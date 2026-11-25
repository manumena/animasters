const root = document.getElementById('avatar-hair-fit-editor');
const find = name => root.querySelector('#hair-fit-' + name);
const canvas = find('avatar');
const preset = __HAIR_PRESET__;
const savedFits = __SAVED_HAIR_FITS__;
const sourceUrls = __HAIR_ASSETS__;
const styleIds = Object.keys(preset.styles);
const sprites = {};
const hairLayers = {};
const state = { style: preset.selection.style, fits: {} };
const stageSize = 512;
const storageKind = 'avatar-hair-fit-editor';
let ready = false;
let drag = null;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function rectangleFor(style) {
  return state.fits[style] ?? preset.styles[style].rectangle;
}

function snapshot() {
  return {
    version: 1,
    kind: storageKind,
    selection: { style: state.style },
    styles: Object.fromEntries(styleIds.map(style => [style, {
      ...preset.styles[style],
      rectangle: [...rectangleFor(style)],
    }])),
  };
}

function restore(snapshot) {
  // Widget state may belong to an older or unrelated visualization.
  const saved = snapshot?.modelContent ?? snapshot;
  if (saved?.kind !== storageKind || saved.version !== 1) return;
  const nextFits = {};
  for (const style of styleIds) {
    const rectangle = saved.styles?.[style]?.rectangle;
    if (!Array.isArray(rectangle) || rectangle.length !== 4 || !rectangle.every(Number.isFinite)) continue;
    const [x, y, width, height] = rectangle;
    const initial = preset.styles[style].rectangle;
    const scale = width / initial[2];
    // Reject damaged dimensions rather than stretching a saved hairstyle.
    if (scale < 0.4 || scale > 1.8 || Math.abs(width / height - initial[2] / initial[3]) > 0.001) continue;
    if (x < -256 || x > 768 || y < -256 || y > 768) continue;
    nextFits[style] = [...rectangle];
  }
  state.fits = nextFits;
  if (styleIds.includes(saved.selection?.style)) state.style = saved.selection.style;
}

function updateExport() {
  find('json').value = JSON.stringify(snapshot(), null, 2);
}

function save() {
  if (find('export').open) updateExport();
  if (!window.openai?.setWidgetState) return;
  Promise.resolve(window.openai.setWidgetState({
    modelContent: snapshot(),
    privateContent: { kind: storageKind, selectedStyle: state.style },
  })).catch(() => {});
}

function syncControls() {
  const [x, y, width, height] = rectangleFor(state.style);
  const percentage = width / preset.styles[state.style].rectangle[2] * 100;
  find('style').value = state.style;
  find('x').value = Number(x.toFixed(2));
  find('y').value = Number(y.toFixed(2));
  find('size').value = percentage;
  find('size-number').value = Number(percentage.toFixed(2));
  find('size-value').textContent = Math.round(percentage) + '%';
  find('dimensions').textContent = width.toFixed(1) + ' × ' + height.toFixed(1) + ' px';
  find('progress').textContent = (styleIds.indexOf(state.style) + 1) + ' / ' + styleIds.length;
}

function makeHairLayers(style) {
  const outline = preset.styles[style].depth?.frontOutline;
  if (!outline) return null;

  // Coordinates follow the trimmed sprite, so the split scales with its fit.
  const front = new Path2D();
  front.moveTo(...outline.start);
  // Follow individual face-framing locks, including their inward turns and tips.
  // A height cutoff would incorrectly send those locks behind the head.
  for (const segment of outline.segments) {
    if (segment.control) {
      front.quadraticCurveTo(...segment.control, ...segment.to);
    } else {
      front.lineTo(...segment.to);
    }
  }
  front.closePath();

  // An exact complement avoids rendering translucent edge pixels twice.
  const rear = new Path2D();
  rear.rect(0, 0, 1, 1);
  rear.addPath(front);
  return { front, rear };
}

function drawHair(context, side) {
  const layers = hairLayers[state.style];
  if (!layers && side === 'rear') return;

  const [x, y, width, height] = rectangleFor(state.style);
  context.save();
  context.translate(x, y);
  context.scale(width, height);
  if (layers) context.clip(layers[side], 'evenodd');
  context.drawImage(sprites[state.style], 0, 0, 1, 1);
  context.restore();
}

function render() {
  if (!ready) return;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.scale(canvas.width / stageSize, canvas.height / stageSize);
  drawHair(context, 'rear');
  // Match the production portrait anchors; only the new hair rectangle moves.
  context.drawImage(sprites.base, 136, 110, 240, 336);
  context.drawImage(sprites.face, 138, 137, 236, 190);
  const rectangle = rectangleFor(state.style);
  drawHair(context, 'front');
  const theme = getComputedStyle(root);
  context.strokeStyle = theme.getPropertyValue('--border').trim() || theme.color;
  context.lineWidth = 1;
  context.setLineDash([4, 5]);
  context.strokeRect(...rectangle);
  context.restore();
  canvas.setAttribute('aria-label', 'Avatar wearing ' + preset.styles[state.style].label + '. Drag the hair to reposition it, or use the position fields.');
}

function selectStyle(style) {
  drag = null;
  state.style = style;
  syncControls();
  render();
  save();
}

function cycleStyle(direction) {
  const index = (styleIds.indexOf(state.style) + direction + styleIds.length) % styleIds.length;
  selectStyle(styleIds[index]);
}

function changePosition(axis, value) {
  if (!Number.isFinite(value)) return;
  const rectangle = [...rectangleFor(state.style)];
  rectangle[axis] = clamp(value, -256, 768);
  state.fits[state.style] = rectangle;
  render();
  save();
}

function resizeHair(percentage) {
  if (!Number.isFinite(percentage)) return;
  const initial = preset.styles[state.style].rectangle;
  const [x, y, width, height] = rectangleFor(state.style);
  const scale = clamp(percentage, 40, 180) / 100;
  const scaledWidth = initial[2] * scale;
  const scaledHeight = initial[3] * scale;
  // Keep the center fixed and derive both dimensions from the same scale.
  state.fits[state.style] = [
    clamp(x + (width - scaledWidth) / 2, -256, 768),
    clamp(y + (height - scaledHeight) / 2, -256, 768),
    scaledWidth,
    scaledHeight,
  ];
  syncControls();
  render();
  save();
}

function pointerPosition(event) {
  const bounds = canvas.getBoundingClientRect();
  return [
    (event.clientX - bounds.left) / bounds.width * stageSize,
    (event.clientY - bounds.top) / bounds.height * stageSize,
  ];
}

canvas.addEventListener('pointerdown', event => {
  if (!ready || event.button !== 0) return;
  const point = pointerPosition(event);
  const [x, y, width, height] = rectangleFor(state.style);
  if (point[0] < x || point[0] > x + width || point[1] < y || point[1] > y + height) return;
  drag = { pointerId: event.pointerId, point, rectangle: [...rectangleFor(state.style)] };
  canvas.setPointerCapture(event.pointerId);
  event.preventDefault();
});

canvas.addEventListener('pointermove', event => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const point = pointerPosition(event);
  const [x, y, width, height] = drag.rectangle;
  state.fits[state.style] = [
    clamp(x + point[0] - drag.point[0], -256, 768),
    clamp(y + point[1] - drag.point[1], -256, 768),
    width,
    height,
  ];
  syncControls();
  render();
});

function finishDrag(event) {
  if (!drag || drag.pointerId !== event.pointerId) return;
  drag = null;
  save();
}

canvas.addEventListener('pointerup', finishDrag);
canvas.addEventListener('pointercancel', finishDrag);
canvas.addEventListener('lostpointercapture', finishDrag);

find('style').addEventListener('change', event => selectStyle(event.target.value));
find('previous').addEventListener('click', () => cycleStyle(-1));
find('next').addEventListener('click', () => cycleStyle(1));
for (const [axis, index] of [['x', 0], ['y', 1]]) {
  find(axis).addEventListener('input', event => changePosition(index, event.target.valueAsNumber));
  find(axis).addEventListener('change', syncControls);
}
find('size').addEventListener('input', event => resizeHair(event.target.valueAsNumber));
// Commit typed percentages on change so intermediate digits are not clamped.
find('size-number').addEventListener('change', event => {
  resizeHair(event.target.valueAsNumber);
  syncControls();
});
find('export').addEventListener('toggle', () => {
  if (find('export').open) updateExport();
});
find('select-json').addEventListener('click', () => {
  find('json').focus();
  find('json').select();
});

restore(savedFits);
restore(window.openai?.widgetState);
find('style').replaceChildren(...styleIds.map(style => new Option(preset.styles[style].label, style)));
syncControls();
window.addEventListener('openai:set_globals', event => {
  restore(event.detail?.globals?.widgetState);
  syncControls();
  render();
  if (find('export').open) updateExport();
});
new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });

async function initialize() {
  try {
    const entries = await Promise.all(Object.entries(sourceUrls).map(async ([name, url]) => {
      const image = await loadImage(url);
      return [name, cleanSprite(image, [0, 0, image.width, image.height], name !== 'face')];
    }));
    Object.assign(sprites, Object.fromEntries(entries));
    for (const style of styleIds) hairLayers[style] = makeHairLayers(style);
    ready = true;
    root.dataset.ready = 'true';
    root.querySelectorAll('[disabled]').forEach(control => { control.disabled = false; });
    find('status').hidden = true;
    render();
  } catch (error) {
    find('status').setAttribute('role', 'alert');
    find('status').textContent = error.message;
  }
}

initialize();
