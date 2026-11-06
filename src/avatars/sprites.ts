import type { Rectangle } from './propCatalog';

export function newCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function context2d(canvas: HTMLCanvasElement, willReadFrequently = false) {
  const context = canvas.getContext('2d', { willReadFrequently });
  if (!context) throw new Error('Avatar drawing requires a 2D canvas.');
  return context;
}

export function loadImage(name: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('An avatar sprite could not be loaded.'));
    image.src = import.meta.env.BASE_URL + 'avatars/v1/' + name + '.webp';
  });
}

export function cleanSprite(image: HTMLImageElement, rectangle: Rectangle, keepLargest: boolean, minimumAlpha = 36) {
  const [sourceX, sourceY, width, height] = rectangle;
  const canvas = newCanvas(Math.ceil(width), Math.ceil(height));
  const context = context2d(canvas, true);
  context.drawImage(image, sourceX, sourceY, width, height, 0, 0, canvas.width, canvas.height);
  const data = context.getImageData(0, 0, canvas.width, canvas.height);
  const labels = new Int32Array(canvas.width * canvas.height);
  const queue = new Int32Array(labels.length);
  const componentSizes = [0];
  let largest = 0;

  for (let start = 0; start < labels.length; start += 1) {
    if (labels[start] || data.data[start * 4 + 3] < minimumAlpha) continue;
    const label = componentSizes.length;
    let read = 0;
    let write = 1;
    queue[0] = start;
    labels[start] = label;

    while (read < write) {
      const index = queue[read];
      read += 1;
      const x = index % canvas.width;
      const neighbors = [];
      if (x > 0) neighbors.push(index - 1);
      if (x + 1 < canvas.width) neighbors.push(index + 1);
      if (index >= canvas.width) neighbors.push(index - canvas.width);
      if (index + canvas.width < labels.length) neighbors.push(index + canvas.width);

      for (const neighbor of neighbors) {
        if (labels[neighbor] || data.data[neighbor * 4 + 3] < minimumAlpha) continue;
        labels[neighbor] = label;
        queue[write] = neighbor;
        write += 1;
      }
    }

    componentSizes.push(write);
    if (write > componentSizes[largest]) largest = label;
  }

  let left = canvas.width;
  let top = canvas.height;
  let right = 0;
  let bottom = 0;
  for (let index = 0; index < labels.length; index += 1) {
    const label = labels[index];
    const keep = keepLargest ? label === largest && label !== 0 : componentSizes[label] >= 12;
    if (!keep) {
      data.data[index * 4 + 3] = 0;
      continue;
    }
    const x = index % canvas.width;
    const y = Math.floor(index / canvas.width);
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }

  context.putImageData(data, 0, 0);
  // Facial cells retain their full grid coordinates. Trimming each eye or
  // mouth would move its anchor when an expression changes shape.
  if (!keepLargest) return canvas;
  if (left > right) throw new Error('An avatar sprite has no visible pixels.');
  const trimmed = newCanvas(right - left + 1, bottom - top + 1);
  context2d(trimmed).drawImage(canvas, left, top, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
  return trimmed;
}
