  const sourceUrls = __AVATAR_ASSETS__;
  const profiles = __PROP_PROFILES__;
  const stageSize = 512;
  const hairStyles = {
    compact: { label: 'Spiky', image: 'hair', rectangle: [126, 67, 260, 195] },
    bob: { label: 'Bob', image: 'bob', rectangle: [130, 68, 252, 277] },
    buns: { label: 'Twin buns', image: 'buns', rectangle: [91, 23, 330, 269] },
    none: { label: 'Bald' }
  };

  const palettes = {
    hairColor: {
      charcoal: { label: 'Charcoal', rgb: [58, 57, 64] },
      chestnut: { label: 'Chestnut', rgb: [103, 64, 48] },
      copper: { label: 'Copper', rgb: [172, 78, 43] },
      blonde: { label: 'Honey blonde', rgb: [193, 143, 75] },
      silver: { label: 'Silver', rgb: [166, 174, 188] },
      teal: { label: 'Teal', rgb: [27, 143, 149] },
      blue: { label: 'Cobalt', rgb: [61, 101, 209] },
      pink: { label: 'Bubblegum', rgb: [221, 105, 161] }
    },
    skin: {
      light: { label: 'Fair', rgb: [247, 203, 173] },
      warm: { label: 'Warm peach', rgb: [238, 175, 128] },
      brown: { label: 'Golden brown', rgb: [175, 112, 78] },
      deep: { label: 'Deep brown', rgb: [113, 69, 55] },
      mint: { label: 'Mint green', rgb: [102, 194, 149] },
      sky: { label: 'Sky blue', rgb: [105, 179, 230] },
      lilac: { label: 'Lilac', rgb: [176, 144, 222] },
      rose: { label: 'Rose pink', rgb: [229, 133, 161] }
    }
  };

  // Feature IDs keep their atlas columns and rows stable across saved looks.
  const eyeOptions = [['oval', 'Oval'], ['round', 'Round with iris'], ['almond', 'Almond']];
  const expressionOptions = [['smile', 'Smile'], ['neutral', 'Neutral'], ['laugh', 'Laugh'], ['angry', 'Angry'], ['sleepy', 'Sleepy'], ['surprised', 'Surprised']];
  const labelsFrom = entries => Object.entries(entries).map(([id, item]) => [id, item.label]);
  const choices = {
    hair: labelsFrom(hairStyles),
    hairColor: labelsFrom(palettes.hairColor),
    skin: labelsFrom(palettes.skin),
    eyes: eyeOptions,
    expression: expressionOptions,
    prop: [['none', 'None'], ...labelsFrom(profiles)]
  };

  const sprites = {};
  const propLayers = {};
  const tintedSprites = new Map();
  const features = [];
  function coordinates(profile, along, across) {
    return profile.vertical ? [across, along] : [along, across];
  }

  function traceCurve(path, profile, points) {
    path.lineTo(...coordinates(profile, ...points[0]));
    for (let index = 1; index < points.length; index += 1) {
      const [previousAlong, previousAcross] = points[index - 1];
      const [along, across] = points[index];
      const midpoint = (previousAlong + along) / 2;
      path.bezierCurveTo(
        ...coordinates(profile, midpoint, previousAcross),
        ...coordinates(profile, midpoint, across),
        ...coordinates(profile, along, across)
      );
    }
  }

  function makePropLayers(profile, sprite) {
    const front = new Path2D();
    if (profile.foreground === 'between') {
      const left = profile.curves[0].points;
      const right = [...profile.curves[1].points].reverse();
      front.moveTo(...coordinates(profile, ...left[0]));
      traceCurve(front, profile, left);
      traceCurve(front, profile, right);
      front.closePath();
    } else {
      for (const { points } of profile.curves) {
        front.moveTo(...coordinates(profile, points[0][0], profile.foreground));
        traceCurve(front, profile, points);
        front.lineTo(...coordinates(profile, points.at(-1)[0], profile.foreground));
        front.closePath();
      }
    }

    const rear = new Path2D();
    rear.rect(0, 0, 1, 1);
    rear.addPath(front);
    return { sprite, front, rear, rectangle: profile.rectangle };
  }

  function drawProp(context, key, side) {
    const layer = propLayers[key];
    const [x, y, width, height] = layer.rectangle;
    context.save();
    context.translate(x, y);
    context.scale(width, height);
    context.clip(layer[side], 'evenodd');
    context.drawImage(layer.sprite, 0, 0, 1, 1);
    context.restore();
  }

  function recolor(source, kind, id, spriteId = 'base') {
    if (kind === 'skin' ? id === 'warm' : id === 'charcoal') return source;
    const key = [kind, id, spriteId].join('-');
    if (tintedSprites.has(key)) return tintedSprites.get(key);

    const canvas = newCanvas(source.width, source.height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(source, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const color = palettes[kind][id].rgb;
    const middle = kind === 'skin' ? 188 : 58;

    for (let index = 0; index < pixels.length; index += 4) {
      if (!pixels[index + 3]) continue;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      // Warm pixels mark the skin on this neutral base. Gray fabric keeps its color.
      if (kind === 'skin' && (red < green * 1.07 || red < blue * 1.17)) continue;
      const shade = (.2126 * red + .7152 * green + .0722 * blue) / middle;
      for (let channel = 0; channel < 3; channel += 1) {
        const value = color[channel];
        pixels[index + channel] = shade < 1 ? value * shade : value + (255 - value) * Math.min(1, (shade - 1) * 1.2);
      }
    }
    context.putImageData(imageData, 0, 0);
    tintedSprites.set(key, canvas);
    return canvas;
  }

  function drawHair(context, look) {
    const hair = hairStyles[look.hair];
    if (!hair.image) return;
    const prop = profiles[look.prop];
    context.save();
    if (prop?.tuckHair) {
      const [, top, , height] = prop.rectangle;
      const points = prop.curves[0].points;
      const fringe = top + height * points[Math.floor(points.length / 2)][1];
      context.beginPath();
      context.rect(0, fringe, stageSize, stageSize - fringe);
      context.clip();
    }
    context.drawImage(recolor(sprites[hair.image], 'hairColor', look.hairColor, hair.image), ...hair.rectangle);
    context.restore();
  }

  function drawAvatar(portrait, look) {
    const context = portrait.getContext('2d');
    const prop = look.prop === 'none' ? null : look.prop;
    const eyes = eyeOptions.findIndex(([key]) => key === look.eyes);
    const expression = expressionOptions.findIndex(([key]) => key === look.expression);

    context.clearRect(0, 0, portrait.width, portrait.height);
    context.save();
    context.scale(portrait.width / stageSize, portrait.height / stageSize);
    if (prop) drawProp(context, prop, 'rear');
    context.drawImage(recolor(sprites.blank3d, 'skin', look.skin), 136, 110, 240, 336);
    context.drawImage(features[expression][eyes], 138, 137, 236, 190);
    drawHair(context, look);
    if (prop) drawProp(context, prop, 'front');
    context.restore();
  }

  async function loadAvatarArtwork() {
  const images = Object.fromEntries(await Promise.all(Object.entries(sourceUrls).map(async ([name, url]) => [name, await loadImage(url)])));
  for (const name of ['blank3d', 'hair', 'bob', 'buns']) {
    const image = images[name];
    sprites[name] = cleanSprite(image, [0, 0, image.width, image.height], true);
  }
  const atlas = images.features3d;
  const cellWidth = atlas.width / eyeOptions.length;
  const cellHeight = atlas.height / expressionOptions.length;
  for (let row = 0; row < expressionOptions.length; row += 1) {
    features.push(eyeOptions.map((_, column) => cleanSprite(atlas, [column * cellWidth, row * cellHeight, cellWidth, cellHeight], false)));
  }
  for (const [key, profile] of Object.entries(profiles)) {
    const image = images[profile.image];
    const [x, y, width, height] = profile.crop ?? [0, 0, 1, 1];
    const sprite = cleanSprite(image, [x * image.width, y * image.height, width * image.width, height * image.height], true, 28);
    propLayers[key] = makePropLayers(profile, sprite);
  }
  }
