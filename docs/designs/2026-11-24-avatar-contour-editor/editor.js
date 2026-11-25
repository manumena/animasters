  const root = document.getElementById('anime-prop-contour-editor');
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
    compact: { sprite: 'hair', rectangle: [126, 67, 260, 195] },
    bob: { sprite: 'bob', rectangle: [130, 68, 252, 277] },
    buns: { sprite: 'buns', rectangle: [91, 23, 330, 269] }
  };

  const profiles = preset.props;
  const state = { ...preset.selection, control: preset.selection.control ?? 'anchor', edits: {}, fits: {}, fronts: {}, tucked: {}, shapes: {}, handles: {} };
  const propKeys = Object.keys(profiles);

  function rectangleFor(prop) {
    return state.fits[prop] ?? profiles[prop].rectangle;
  }

  function profileFor(prop) {
    return {
      ...profiles[prop],
      foreground: state.fronts[prop] ?? profiles[prop].foreground,
      tuckHair: state.tucked[prop] ?? profiles[prop].tuckHair,
    };
  }
  let ready = false;
  let dragPointer = null;

  function pointsFor(prop, region) {
    return state.edits[prop]?.[region] ?? profiles[prop].curves[region].points;
  }

  function shapeFor(prop, region) {
    return state.shapes[prop]?.[region] ?? profiles[prop].curves[region].interpolation ?? 's-curve';
  }

  function handlesFor(prop, region) {
    const points = pointsFor(prop, region);
    const saved = state.handles[prop]?.[region] ?? profiles[prop].curves[region].controls;
    if (saved) {
      return saved.map((handle, index) => [
        Math.max(points[index][0], Math.min(points[index + 1][0], handle[0])),
        handle[1],
      ]);
    }
    return points.slice(1).map((point, index) => [
      (points[index][0] + point[0]) / 2,
      (points[index][1] + point[1]) / 2,
    ]);
  }

  function selectedControl() {
    return state.control === 'bend'
      ? handlesFor(state.prop, state.region)[state.point]
      : pointsFor(state.prop, state.region)[state.point];
  }

  function imageCoordinates(profile, along, across) {
    return profile.vertical ? [across, along] : [along, across];
  }

  function traceCurve(path, profile, points, region = 0, reversed = false) {
    path.lineTo(...imageCoordinates(profile, ...points[0]));
    if (shapeFor(state.prop, region) === 'quadratic') {
      const handles = handlesFor(state.prop, region);
      const orderedHandles = reversed ? [...handles].reverse() : handles;
      for (let index = 1; index < points.length; index += 1) {
        path.quadraticCurveTo(
          ...imageCoordinates(profile, ...orderedHandles[index - 1]),
          ...imageCoordinates(profile, ...points[index]),
        );
      }
      return;
    }
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
    const profile = profileFor(state.prop);
    const path = new Path2D();

    if (profile.foreground === 'between') {
      const left = pointsFor(state.prop, 0);
      const right = pointsFor(state.prop, 1).toReversed();
      path.moveTo(...imageCoordinates(profile, ...left[0]));
      traceCurve(path, profile, left);
      traceCurve(path, profile, right, 1, true);
      path.closePath();
      return path;
    }

    for (const [region] of profile.curves.entries()) {
      const points = pointsFor(state.prop, region);
      path.moveTo(...imageCoordinates(profile, points[0][0], profile.foreground));
      traceCurve(path, profile, points, region);
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
    const profile = profileFor(state.prop);
    const rear = new Path2D();
    rear.rect(0, 0, 1, 1);
    rear.addPath(foreground);

    context.clearRect(0, 0, preview.width, preview.height);
    context.save();
    context.scale(preview.width / avatarSize, preview.height / avatarSize);
    drawProp(context, rectangleFor(state.prop), rear);
    context.drawImage(sprites.base, ...baseFit);

    const hair = hairFits[state.hair];
    if (hair) {
      context.save();
      if (profile.tuckHair) {
        const [, top, , height] = rectangleFor(state.prop);
        const points = pointsFor(state.prop, 0);
        const fringe = top + height * points[Math.floor(points.length / 2)][1];
        context.beginPath();
        context.rect(0, fringe, avatarSize, avatarSize - fringe);
        context.clip();
      }
      context.drawImage(sprites[hair.sprite], ...hair.rectangle);
      context.restore();
    }

    drawProp(context, rectangleFor(state.prop), foreground);
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
    const profile = profileFor(state.prop);
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
      traceCurve(curve, profile, points, region);
      const scaledCurve = new Path2D();
      scaledCurve.addPath(curve, transform);
      context.strokeStyle = ink;
      context.globalAlpha = active ? 1 : .55;
      context.lineWidth = active ? 4 : 3;
      context.stroke(scaledCurve);
      if (!active) continue;

      if (shapeFor(state.prop, region) === 'quadratic') {
        for (const [index, handle] of handlesFor(state.prop, region).entries()) {
          const [handleX, handleY] = imageCoordinates(profile, ...handle);
          const [startX, startY] = imageCoordinates(profile, ...points[index]);
          const [endX, endY] = imageCoordinates(profile, ...points[index + 1]);
          context.beginPath();
          context.moveTo(x + startX * width, y + startY * height);
          context.lineTo(x + handleX * width, y + handleY * height);
          context.lineTo(x + endX * width, y + endY * height);
          context.strokeStyle = ink;
          context.globalAlpha = .45;
          context.lineWidth = 1;
          context.stroke();
          context.globalAlpha = 1;
          const radius = state.control === 'bend' && index === state.point ? 11 : 8;
          context.fillStyle = ink;
          context.fillRect(x + handleX * width - radius, y + handleY * height - radius, radius * 2, radius * 2);
        }
      }

      for (const [index, point] of points.entries()) {
        const [horizontal, vertical] = imageCoordinates(profile, ...point);
        context.beginPath();
        context.arc(x + horizontal * width, y + vertical * height, state.control === 'anchor' && index === state.point ? 12 : 9, 0, Math.PI * 2);
        context.fillStyle = state.control === 'anchor' && index === state.point ? ink : getComputedStyle(root).color;
        context.fill();
        context.lineWidth = 3;
        context.strokeStyle = getComputedStyle(root).getPropertyValue('--card').trim() || getComputedStyle(root).color;
        context.stroke();
      }
    }
    context.globalAlpha = 1;
  }

  function pointLimits() {
    const profile = profileFor(state.prop);
    const points = pointsFor(state.prop, state.region);
    if (state.control === 'bend') {
      const bounds = profile.curves[state.region].bounds ?? [0, 1];
      // A handle between the two anchors gives a single quadratic arc.
      const alongLimits = [points[state.point][0], points[state.point + 1][0]];
      return profile.vertical ? [bounds, alongLimits] : [alongLimits, bounds];
    }
    const [along] = points[state.point];
    const previous = points[state.point - 1];
    const next = points[state.point + 1];
    const alongLimits = previous && next ? [previous[0] + .02, next[0] - .02] : [along, along];
    const acrossLimits = profile.curves[state.region].bounds ?? [0, 1];
    return profile.vertical ? [acrossLimits, alongLimits] : [alongLimits, acrossLimits];
  }

  function updateCoordinateControls() {
    const profile = profileFor(state.prop);
    const point = selectedControl();
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
    const status = profile.curves[state.region].label + (state.control === 'bend' ? ' · Bend ' : ' · Point ') + (state.point + 1);
    if (find('status').textContent !== status) find('status').textContent = status;
  }

  function render() {
    if (!ready) return;
    const foreground = foregroundPath();
    drawAvatar(foreground);
    drawArtwork(foreground);
    updateCoordinateControls();
  }

  function syncSizeControl() {
    const [, , width, height] = rectangleFor(state.prop);
    const percent = 100 * width / profiles[state.prop].rectangle[2];
    const input = find('size');
    input.min = Math.ceil(percent * Math.max(20 / width, 20 / height));
    input.max = Math.floor(percent * Math.min(640 / width, 640 / height));
    input.value = Math.round(percent);
    find('size-value').textContent = Math.round(percent) + '%';
  }

  function syncFitControls() {
    const rectangle = rectangleFor(state.prop);
    for (const [index, axis] of ['x', 'y', 'width', 'height'].entries()) {
      const input = find('fit-' + axis);
      input.value = rectangle[index];
    }
    syncSizeControl();
    const profile = profileFor(state.prop);
    const labels = profile.vertical ? ['Left of contour', 'Right of contour'] : ['Above contour', 'Below contour'];
    const options = profiles[state.prop].foreground === 'between'
      ? [new Option('Between both contours', 'between')]
      : labels.map((label, index) => new Option(label, index));
    find('front').replaceChildren(...options);
    find('front').value = profile.foreground;
    find('tuck').checked = Boolean(profile.tuckHair);
    find('tuck').disabled = Boolean(profile.vertical);
    find('progress').textContent = (propKeys.indexOf(state.prop) + 1) + ' / ' + propKeys.length;
  }

  function syncControlSelector() {
    const anchors = pointsFor(state.prop, state.region).map((_, index) => new Option('Point ' + (index + 1), index));
    const bends = shapeFor(state.prop, state.region) === 'quadratic'
      ? handlesFor(state.prop, state.region).map((_, index) => new Option('Bend ' + (index + 1), 'bend-' + index))
      : [];
    find('point').replaceChildren(...anchors, ...bends);
    find('point').value = state.control === 'bend' ? 'bend-' + state.point : state.point;
    find('shape').value = shapeFor(state.prop, state.region);
  }

  function syncSelectors() {
    const profile = profileFor(state.prop);
    find('prop').value = state.prop;
    find('hair').value = state.hair;
    find('region').replaceChildren(...profile.curves.map((curve, index) => new Option(curve.label, index)));
    find('region').value = state.region;
    syncControlSelector();
    syncFitControls();
  }

  function movePoint(horizontal, vertical) {
    const profile = profileFor(state.prop);
    const values = [horizontal, vertical];
    const limits = pointLimits();
    const clamped = values.map((value, index) => {
      const [min, max] = limits[index];
      return Math.round(Math.max(min, Math.min(max, value)) * 100) / 100;
    });
    if (state.control === 'bend') {
      state.handles[state.prop] ??= {};
      state.handles[state.prop][state.region] ??= structuredClone(handlesFor(state.prop, state.region));
      state.handles[state.prop][state.region][state.point] = imageCoordinates(profile, ...clamped);
    } else {
      const points = pointsFor(state.prop, state.region);
      const previous = points[state.point];
      const moved = imageCoordinates(profile, ...clamped);
      const delta = moved[0] - previous[0];
      if (shapeFor(state.prop, state.region) === 'quadratic') {
        state.handles[state.prop] ??= {};
        const handles = structuredClone(handlesFor(state.prop, state.region));
        const nextPoints = points.map((point, index) => index === state.point ? moved : point);
        for (const index of [state.point - 1, state.point]) {
          if (!handles[index]) continue;
          handles[index][0] = Math.max(nextPoints[index][0], Math.min(nextPoints[index + 1][0], handles[index][0] + delta / 2));
        }
        state.handles[state.prop][state.region] = handles;
      }
      state.edits[state.prop] ??= profile.curves.map(curve => structuredClone(curve.points));
      state.edits[state.prop][state.region][state.point] = moved;
    }
    render();
  }

  function save() {
    if (find('export').open) updateExport();
    if (!window.openai?.setWidgetState) return;
    Promise.resolve(window.openai.setWidgetState({
      modelContent: exportSnapshot(),
      privateContent: { kind: 'anime-prop-contour-editor', ...state }
    })).catch(() => {});
  }

  function exportSnapshot() {
    const { prop, hair, region, point, control } = state;
    const props = Object.fromEntries(Object.entries(profiles).map(([key]) => {
      const profile = profileFor(key);
      const curves = profile.curves.map((curve, index) => ({
        ...curve,
        points: pointsFor(key, index),
        interpolation: shapeFor(key, index),
        controls: shapeFor(key, index) === 'quadratic' ? handlesFor(key, index) : undefined,
      }));
      return [key, { ...profile, rectangle: rectangleFor(key), curves }];
    }));
    return { version: preset.version, selection: { prop, hair, region, point, control }, props };
  }

  function updateExport() {
    find('json').value = JSON.stringify(exportSnapshot(), null, 2) + '\n';
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
    if (candidate?.kind !== 'anime-prop-contour-editor') return;
    if (Object.hasOwn(profiles, candidate.prop)) state.prop = candidate.prop;
    if (candidate.hair === 'none' || Object.hasOwn(hairFits, candidate.hair)) state.hair = candidate.hair;
    state.edits = {};
    state.fits = {};
    state.fronts = {};
    state.tucked = {};
    state.shapes = {};
    state.handles = {};
    for (const [prop, profile] of Object.entries(profiles)) {
      const fit = candidate.fits?.[prop];
      if (Array.isArray(fit) && fit.length === 4 && fit.every(Number.isFinite)
          && fit.slice(0, 2).every(value => value >= -128 && value <= 512)
          && fit.slice(2).every(value => value >= 20 && value <= 640)) {
        state.fits[prop] = [...fit];
      }
      const front = candidate.fronts?.[prop];
      if (front === 0 || front === 1) state.fronts[prop] = front;
      if (typeof candidate.tucked?.[prop] === 'boolean') state.tucked[prop] = candidate.tucked[prop];
      const edits = candidate.edits?.[prop];
      if (Array.isArray(edits) && edits.length === profile.curves.length && edits.every((points, index) => validCurve(points, profile.curves[index]))) {
        state.edits[prop] = structuredClone(edits);
      }
    }
    for (const [prop, profile] of Object.entries(profiles)) {
      for (const [region, curve] of profile.curves.entries()) {
        const shape = candidate.shapes?.[prop]?.[region];
        if (shape === 'quadratic' || shape === 's-curve') {
          state.shapes[prop] ??= {};
          state.shapes[prop][region] = shape;
        }
        const handles = candidate.handles?.[prop]?.[region];
        const points = pointsFor(prop, region);
        const [min, max] = curve.bounds ?? [0, 1];
        const valid = Array.isArray(handles) && handles.length === points.length - 1
          && handles.every((handle, index) => Array.isArray(handle) && handle.length === 2
            && handle.every(Number.isFinite)
            && handle[0] >= points[index][0] && handle[0] <= points[index + 1][0]
            && handle[1] >= min && handle[1] <= max);
        if (valid) {
          state.handles[prop] ??= {};
          state.handles[prop][region] = structuredClone(handles);
        }
      }
    }
    const curves = profiles[state.prop].curves;
    state.region = Number.isInteger(candidate.region) && curves[candidate.region] ? candidate.region : 0;
    state.control = candidate.control === 'bend' && shapeFor(state.prop, state.region) === 'quadratic' ? 'bend' : 'anchor';
    const controls = state.control === 'bend' ? handlesFor(state.prop, state.region) : pointsFor(state.prop, state.region);
    state.point = Number.isInteger(candidate.point) && controls[candidate.point] ? candidate.point : 1;
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
    const profile = profileFor(state.prop);
    const points = pointsFor(state.prop, state.region);
    const controls = points.map((point, index) => ({ point, index, type: 'anchor' }));
    if (shapeFor(state.prop, state.region) === 'quadratic') {
      controls.push(...handlesFor(state.prop, state.region).map((point, index) => ({ point, index, type: 'bend' })));
    }
    let nearest = null;
    let distance = 22;
    for (const control of controls) {
      const [horizontal, vertical] = imageCoordinates(profile, ...control.point);
      const offset = Math.hypot((horizontal - x) * width, (vertical - y) * height) * displayScale;
      if (offset < distance) {
        distance = offset;
        nearest = control;
      }
    }
    if (!nearest) return;
    state.point = nearest.index;
    state.control = nearest.type;
    syncControlSelector();
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

  function selectProp(prop) {
    state.prop = prop;
    state.region = 0;
    state.point = 1;
    state.control = 'anchor';
    syncSelectors();
    render();
    save();
  }

  find('prop').addEventListener('change', event => selectProp(event.target.value));
  for (const [button, direction] of [['previous', -1], ['next', 1]]) {
    find(button).addEventListener('click', () => {
      const index = propKeys.indexOf(state.prop);
      selectProp(propKeys[(index + direction + propKeys.length) % propKeys.length]);
    });
  }

  for (const [index, axis] of ['x', 'y', 'width', 'height'].entries()) {
    const input = find('fit-' + axis);
    input.addEventListener('input', () => {
      if (input.value === '') return;
      const value = Number(input.value);
      if (!Number.isFinite(value)) return;
      const rectangle = [...rectangleFor(state.prop)];
      rectangle[index] = Math.max(Number(input.min), Math.min(Number(input.max), value));
      state.fits[state.prop] = rectangle;
      syncSizeControl();
      render();
      save();
    });
    input.addEventListener('change', syncFitControls);
  }

  find('size').addEventListener('input', event => {
    const [x, y, width, height] = rectangleFor(state.prop);
    const nextWidth = profiles[state.prop].rectangle[2] * Number(event.target.value) / 100;
    const factor = Math.max(20 / width, 20 / height, Math.min(nextWidth / width, 640 / width, 640 / height));
    const scaledWidth = width * factor;
    const scaledHeight = height * factor;
    // Scale around the center. Clamp position only at the editor's bounds.
    state.fits[state.prop] = [
      Math.max(-128, Math.min(512, x + (width - scaledWidth) / 2)),
      Math.max(-128, Math.min(512, y + (height - scaledHeight) / 2)),
      scaledWidth,
      scaledHeight,
    ];
    syncFitControls();
    render();
    save();
  });

  find('front').addEventListener('change', event => {
    state.fronts[state.prop] = event.target.value === 'between' ? 'between' : Number(event.target.value);
    render();
    save();
  });

  find('tuck').addEventListener('change', event => {
    state.tucked[state.prop] = event.target.checked;
    render();
    save();
  });

  find('reset-fit').addEventListener('click', () => {
    delete state.fits[state.prop];
    syncFitControls();
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
    state.control = 'anchor';
    syncSelectors();
    render();
    save();
  });

  find('point').addEventListener('change', event => {
    const value = event.target.value;
    state.control = value.startsWith('bend-') ? 'bend' : 'anchor';
    state.point = Number(value.replace('bend-', ''));
    render();
    save();
  });

  find('shape').addEventListener('change', event => {
    state.shapes[state.prop] ??= {};
    state.shapes[state.prop][state.region] = event.target.value;
    state.control = 'anchor';
    state.point = 1;
    syncControlSelector();
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
    if (state.handles[state.prop]) delete state.handles[state.prop][state.region];
    if (state.shapes[state.prop]) delete state.shapes[state.prop][state.region];
    state.control = 'anchor';
    state.point = 1;
    syncControlSelector();
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
