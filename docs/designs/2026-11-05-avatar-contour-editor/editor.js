  const root = document.getElementById('avatar-contour-editor');
  const find = id => root.querySelector('#contour-' + id);
  const artwork = find('art');
  const preview = find('avatar');
  const sourceUrls = __AVATAR_ASSETS__;
  const preset = __CONTOUR_PRESET__;
  const sprites = {};
  const propSprites = {};
  const avatarSize = 512;
  const baseFit = [136, 110, 240, 336];
  const hairFits = {
    compact: { sprite: 'hair', rectangle: [134, 73, 244, 183] },
    bob: { sprite: 'bob', rectangle: [130, 68, 252, 277] },
    buns: { sprite: 'buns', rectangle: [91, 23, 330, 269] }
  };

  const profiles = preset.props;
  const state = { ...preset.selection, edits: {} };
  let ready = false;
  let dragPointer = null;

  function pointsFor(prop, region) {
    return state.edits[prop]?.[region] ?? profiles[prop].curves[region].points;
  }

  function imageCoordinates(profile, along, across) {
    return profile.vertical ? [across, along] : [along, across];
  }

  function traceCurve(path, profile, points) {
    path.lineTo(...imageCoordinates(profile, ...points[0]));
    for (let index = 1; index < points.length; index += 1) {
      const [previousAlong, previousAcross] = points[index - 1];
      const [along, across] = points[index];
      const midpoint = (previousAlong + along) / 2;
      path.bezierCurveTo(
        ...imageCoordinates(profile, midpoint, previousAcross),
        ...imageCoordinates(profile, midpoint, across),
        ...imageCoordinates(profile, along, across)
      );
    }
  }

  function foregroundPath() {
    const profile = profiles[state.prop];
    const path = new Path2D();

    if (profile.foreground === 'between') {
      const left = pointsFor(state.prop, 0);
      const right = pointsFor(state.prop, 1).toReversed();
      path.moveTo(...imageCoordinates(profile, ...left[0]));
      traceCurve(path, profile, left);
      traceCurve(path, profile, right);
      path.closePath();
      return path;
    }

    for (const [region] of profile.curves.entries()) {
      const points = pointsFor(state.prop, region);
      path.moveTo(...imageCoordinates(profile, points[0][0], profile.foreground));
      traceCurve(path, profile, points);
      path.lineTo(...imageCoordinates(profile, points.at(-1)[0], profile.foreground));
      path.closePath();
    }
    return path;
  }

  function drawProp(context, rectangle, mask) {
    const [x, y, width, height] = rectangle;
    context.save();
    context.translate(x, y);
    context.scale(width, height);
    if (mask) context.clip(mask, 'evenodd');
    context.drawImage(propSprites[state.prop], 0, 0, 1, 1);
    context.restore();
  }

  function drawAvatar(foreground) {
    const context = preview.getContext('2d');
    const profile = profiles[state.prop];
    const rear = new Path2D();
    rear.rect(0, 0, 1, 1);
    rear.addPath(foreground);

    context.clearRect(0, 0, preview.width, preview.height);
    context.save();
    context.scale(preview.width / avatarSize, preview.height / avatarSize);
    drawProp(context, profile.rectangle, rear);
    context.drawImage(sprites.base, ...baseFit);

    const hair = hairFits[state.hair];
    if (hair) {
      context.save();
      if (profile.tuckHair) {
        const [, top, , height] = profile.rectangle;
        const points = pointsFor(state.prop, 0);
        const fringe = top + height * points[Math.floor(points.length / 2)][1];
        context.beginPath();
        context.rect(0, fringe, avatarSize, avatarSize - fringe);
        context.clip();
      }
      context.drawImage(sprites[hair.sprite], ...hair.rectangle);
      context.restore();
    }

    drawProp(context, profile.rectangle, foreground);
    context.restore();
  }

  function artRectangle() {
    const sprite = propSprites[state.prop];
    const scale = Math.min((artwork.width - 96) / sprite.width, (artwork.height - 120) / sprite.height);
    const width = sprite.width * scale;
    const height = sprite.height * scale;
    return [(artwork.width - width) / 2, (artwork.height - height) / 2, width, height];
  }

  function drawArtwork(foreground) {
    const context = artwork.getContext('2d');
    const profile = profiles[state.prop];
    const rectangle = artRectangle();
    const [x, y, width, height] = rectangle;
    const ink = getComputedStyle(artwork).color;
    context.clearRect(0, 0, artwork.width, artwork.height);

    context.globalAlpha = .38;
    drawProp(context, rectangle);
    context.globalAlpha = 1;
    drawProp(context, rectangle, foreground);

    const transform = new DOMMatrix([width, 0, 0, height, x, y]);
    for (const [region] of profile.curves.entries()) {
      const active = region === state.region;
      const points = pointsFor(state.prop, region);
      const curve = new Path2D();
      curve.moveTo(...imageCoordinates(profile, ...points[0]));
      traceCurve(curve, profile, points);
      const scaledCurve = new Path2D();
      scaledCurve.addPath(curve, transform);
      context.strokeStyle = ink;
      context.globalAlpha = active ? 1 : .55;
      context.lineWidth = active ? 4 : 3;
      context.stroke(scaledCurve);
      if (!active) continue;

      for (const [index, point] of points.entries()) {
        const [horizontal, vertical] = imageCoordinates(profile, ...point);
        context.beginPath();
        context.arc(x + horizontal * width, y + vertical * height, index === state.point ? 12 : 9, 0, Math.PI * 2);
        context.fillStyle = index === state.point ? ink : getComputedStyle(root).color;
        context.fill();
        context.lineWidth = 3;
        context.strokeStyle = getComputedStyle(root).getPropertyValue('--card').trim() || getComputedStyle(root).color;
        context.stroke();
      }
    }
    context.globalAlpha = 1;
  }

  function pointLimits() {
    const profile = profiles[state.prop];
    const points = pointsFor(state.prop, state.region);
    const [along] = points[state.point];
    const previous = points[state.point - 1];
    const next = points[state.point + 1];
    const alongLimits = previous && next ? [previous[0] + .02, next[0] - .02] : [along, along];
    const acrossLimits = profile.curves[state.region].bounds ?? [0, 1];
    return profile.vertical ? [acrossLimits, alongLimits] : [alongLimits, acrossLimits];
  }

  function updateCoordinateControls() {
    const profile = profiles[state.prop];
    const point = pointsFor(state.prop, state.region)[state.point];
    const values = imageCoordinates(profile, ...point);
    const limits = pointLimits();
    for (const [index, axis] of ['x', 'y'].entries()) {
      const input = find(axis);
      const value = Math.round(values[index] * 100);
      input.min = Math.round(limits[index][0] * 100);
      input.max = Math.round(limits[index][1] * 100);
      input.value = value;
      input.disabled = input.min === input.max;
      find(axis + '-value').textContent = value + '%';
    }
    const status = profile.curves[state.region].label + ' · Point ' + (state.point + 1);
    if (find('status').textContent !== status) find('status').textContent = status;
  }

  function render() {
    if (!ready) return;
    const foreground = foregroundPath();
    drawAvatar(foreground);
    drawArtwork(foreground);
    updateCoordinateControls();
  }

  function syncSelectors() {
    const profile = profiles[state.prop];
    find('prop').value = state.prop;
    find('hair').value = state.hair;
    find('region').replaceChildren(...profile.curves.map((curve, index) => new Option(curve.label, index)));
    find('region').value = state.region;
    find('point').replaceChildren(...pointsFor(state.prop, state.region).map((_, index) => new Option('Point ' + (index + 1), index)));
    find('point').value = state.point;
  }

  function movePoint(horizontal, vertical) {
    const profile = profiles[state.prop];
    const values = [horizontal, vertical];
    const limits = pointLimits();
    const clamped = values.map((value, index) => {
      const [min, max] = limits[index];
      return Math.round(Math.max(min, Math.min(max, value)) * 100) / 100;
    });
    state.edits[state.prop] ??= profile.curves.map(curve => structuredClone(curve.points));
    state.edits[state.prop][state.region][state.point] = imageCoordinates(profile, ...clamped);
    render();
  }

  function save() {
    if (find('export').open) updateExport();
    if (!window.openai?.setWidgetState) return;
    const profile = profiles[state.prop];
    Promise.resolve(window.openai.setWidgetState({
      modelContent: { prop: state.prop, hair: state.hair, contours: profile.curves.map((curve, index) => ({ region: curve.label, points: pointsFor(state.prop, index) })) },
      privateContent: { kind: 'avatar-contour-editor', ...state }
    })).catch(() => {});
  }

  function updateExport() {
    const { prop, hair, region, point } = state;
    const props = Object.fromEntries(Object.entries(profiles).map(([key, profile]) => {
      const curves = profile.curves.map((curve, index) => ({ ...curve, points: pointsFor(key, index) }));
      return [key, { ...profile, curves }];
    }));
    const snapshot = { version: preset.version, selection: { prop, hair, region, point }, props };
    find('json').value = JSON.stringify(snapshot, null, 2) + '\n';
  }

  function validCurve(points, curve) {
    if (!Array.isArray(points) || points.length !== curve.points.length) return false;
    const [min, max] = curve.bounds ?? [0, 1];
    return points.every((point, index) => {
      if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)) return false;
      const [along, across] = point;
      const endpoint = index === 0 || index === points.length - 1;
      if (endpoint && along !== curve.points[index][0]) return false;
      if (index > 0 && along - points[index - 1][0] < .019) return false;
      return across >= min && across <= max;
    });
  }

  function restore(saved) {
    const candidate = saved?.privateContent;
    if (candidate?.kind !== 'avatar-contour-editor') return;
    if (Object.hasOwn(profiles, candidate.prop)) state.prop = candidate.prop;
    if (candidate.hair === 'none' || Object.hasOwn(hairFits, candidate.hair)) state.hair = candidate.hair;
    state.edits = {};
    for (const [prop, profile] of Object.entries(profiles)) {
      const edits = candidate.edits?.[prop];
      if (Array.isArray(edits) && edits.length === profile.curves.length && edits.every((points, index) => validCurve(points, profile.curves[index]))) {
        state.edits[prop] = structuredClone(edits);
      }
    }
    const curves = profiles[state.prop].curves;
    state.region = Number.isInteger(candidate.region) && curves[candidate.region] ? candidate.region : 0;
    const points = pointsFor(state.prop, state.region);
    state.point = Number.isInteger(candidate.point) && points[candidate.point] ? candidate.point : 1;
  }

  function pointerPosition(event) {
    const bounds = artwork.getBoundingClientRect();
    const [x, y, width, height] = artRectangle();
    const horizontal = (event.clientX - bounds.left) * artwork.width / bounds.width;
    const vertical = (event.clientY - bounds.top) * artwork.height / bounds.height;
    return [(horizontal - x) / width, (vertical - y) / height, bounds.width / artwork.width];
  }

  artwork.addEventListener('pointerdown', event => {
    if (!ready || dragPointer !== null || event.button !== 0) return;
    const [x, y, displayScale] = pointerPosition(event);
    const [, , width, height] = artRectangle();
    const profile = profiles[state.prop];
    const points = pointsFor(state.prop, state.region);
    let nearest = -1;
    let distance = 22;
    for (const [index, point] of points.entries()) {
      const [horizontal, vertical] = imageCoordinates(profile, ...point);
      const offset = Math.hypot((horizontal - x) * width, (vertical - y) * height) * displayScale;
      if (offset < distance) {
        distance = offset;
        nearest = index;
      }
    }
    if (nearest < 0) return;
    state.point = nearest;
    find('point').value = nearest;
    dragPointer = event.pointerId;
    artwork.setPointerCapture(dragPointer);
    render();
  });

  artwork.addEventListener('pointermove', event => {
    if (dragPointer !== event.pointerId) return;
    const [x, y] = pointerPosition(event);
    movePoint(x, y);
  });

  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    artwork.addEventListener(eventName, event => {
      if (dragPointer !== event.pointerId) return;
      dragPointer = null;
      save();
    });
  }

  find('prop').addEventListener('change', event => {
    state.prop = event.target.value;
    state.region = 0;
    state.point = 1;
    syncSelectors();
    render();
    save();
  });

  find('hair').addEventListener('change', event => {
    state.hair = event.target.value;
    render();
    save();
  });

  find('region').addEventListener('change', event => {
    state.region = Number(event.target.value);
    state.point = 1;
    syncSelectors();
    render();
    save();
  });

  find('point').addEventListener('change', event => {
    state.point = Number(event.target.value);
    render();
    save();
  });

  for (const axis of ['x', 'y']) {
    const input = find(axis);
    input.addEventListener('input', () => movePoint(Number(find('x').value) / 100, Number(find('y').value) / 100));
    input.addEventListener('change', save);
  }

  find('restore').addEventListener('click', () => {
    if (state.edits[state.prop]) {
      state.edits[state.prop][state.region] = structuredClone(profiles[state.prop].curves[state.region].points);
    }
    render();
    save();
  });

  find('export').addEventListener('toggle', () => {
    if (find('export').open) updateExport();
  });
  find('select-json').addEventListener('click', () => {
    const output = find('json');
    output.focus();
    output.select();
  });

  restore(window.openai?.widgetState);
  find('prop').replaceChildren(...Object.entries(profiles).map(([key, profile]) => new Option(profile.label, key)));
  syncSelectors();
  window.addEventListener('openai:set_globals', event => {
    restore(event.detail?.globals?.widgetState);
    syncSelectors();
    render();
    if (find('export').open) updateExport();
  });

  async function initialize() {
    try {
      const images = Object.fromEntries(await Promise.all(Object.entries(sourceUrls).map(async ([name, url]) => [name, await loadImage(url)])));
      const avatarImages = ['base', ...Object.values(hairFits).map(hair => hair.sprite)];
      for (const name of avatarImages) {
        const image = images[name];
        sprites[name] = extractSprite(image, [0, 0, image.width, image.height]);
      }
      for (const [key, profile] of Object.entries(profiles)) {
        const image = images[profile.image];
        const [x, y, width, height] = profile.crop ?? [0, 0, 1, 1];
        const rectangle = [x * image.width, y * image.height, width * image.width, height * image.height];
        propSprites[key] = extractSprite(image, rectangle);
      }
      ready = true;
      root.dataset.ready = 'true';
      render();
    } catch (error) {
      find('status').setAttribute('role', 'alert');
      find('status').textContent = error.message;
    }
  }

  initialize();
