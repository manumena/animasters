  function newCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('An avatar image could not be loaded.'));
      image.src = url;
    });
  }

  // Atlas cells contain transparent padding and a little generation noise. Keep
  // the largest connected silhouette so neither affects the sprite's anchors.
  function extractSprite(image, rectangle) {
    const [sourceX, sourceY, width, height] = rectangle;
    const working = newCanvas(Math.ceil(width), Math.ceil(height));
    const context = working.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, sourceX, sourceY, width, height, 0, 0, working.width, working.height);
    const imageData = context.getImageData(0, 0, working.width, working.height);
    const pixels = imageData.data;
    const labels = new Int32Array(working.width * working.height);
    const queue = new Int32Array(labels.length);
    let componentId = 0;
    let largestId = 0;
    let largestCount = 0;

    for (let start = 0; start < labels.length; start += 1) {
      if (labels[start] || pixels[start * 4 + 3] < 28) continue;
      componentId += 1;
      let read = 0;
      let write = 1;
      queue[0] = start;
      labels[start] = componentId;

      while (read < write) {
        const index = queue[read++];
        const x = index % working.width;
        const neighbors = [];
        if (x > 0) neighbors.push(index - 1);
        if (x + 1 < working.width) neighbors.push(index + 1);
        if (index >= working.width) neighbors.push(index - working.width);
        if (index + working.width < labels.length) neighbors.push(index + working.width);

        for (const neighbor of neighbors) {
          if (labels[neighbor] || pixels[neighbor * 4 + 3] < 28) continue;
          labels[neighbor] = componentId;
          queue[write++] = neighbor;
        }
      }

      if (write > largestCount) {
        largestCount = write;
        largestId = componentId;
      }
    }

    if (!largestCount) throw new Error('An avatar layer has no visible pixels.');
    let left = working.width;
    let right = 0;
    let top = working.height;
    let bottom = 0;

    for (let index = 0; index < labels.length; index += 1) {
      if (labels[index] !== largestId) {
        pixels[index * 4 + 3] = 0;
        continue;
      }
      const x = index % working.width;
      const y = Math.floor(index / working.width);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }

    context.putImageData(imageData, 0, 0);
    const trimmed = newCanvas(right - left + 1, bottom - top + 1);
    trimmed.getContext('2d').drawImage(working, left, top, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
    return trimmed;
  }
