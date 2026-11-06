import { hairStyles, palettes } from './catalog';
import { propProfiles } from './propCatalog';
import type { Point, PropId, PropProfile, Rectangle } from './propCatalog';
import { avatarOptions } from './protocol';
import type { AvatarConfig } from './protocol';
import { cleanSprite, context2d, loadImage, newCanvas } from './sprites';

const stageSize = 512;
const bodyImages = ['blank3d', 'hair', 'bob', 'buns'] as const;
const propImages = ['props', 'headphones', 'glasses', 'scarf'] as const;

interface PropLayers {
  sprite: HTMLCanvasElement;
  front: Path2D;
  rear: Path2D;
  rectangle: Rectangle;
}

function coordinates(profile: PropProfile, along: number, across: number): Point {
  return profile.vertical ? [across, along] : [along, across];
}

function traceCurve(path: Path2D, profile: PropProfile, points: readonly Point[]) {
  path.lineTo(...coordinates(profile, ...points[0]));

  for (let index = 1; index < points.length; index += 1) {
    const [previousAlong, previousAcross] = points[index - 1];
    const [along, across] = points[index];
    const midpoint = (previousAlong + along) / 2;
    path.bezierCurveTo(
      ...coordinates(profile, midpoint, previousAcross),
      ...coordinates(profile, midpoint, across),
      ...coordinates(profile, along, across),
    );
  }
}

function makePropLayers(profile: PropProfile, sprite: HTMLCanvasElement): PropLayers {
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
      front.lineTo(...coordinates(profile, points[points.length - 1][0], profile.foreground));
      front.closePath();
    }
  }

  // Even-odd clipping makes the rear the exact complement of the foreground.
  const rear = new Path2D();
  rear.rect(0, 0, 1, 1);
  rear.addPath(front);
  return { sprite, front, rear, rectangle: profile.rectangle };
}

function drawProp(context: CanvasRenderingContext2D, layer: PropLayers, side: 'front' | 'rear') {
  const [x, y, width, height] = layer.rectangle;
  context.save();
  context.translate(x, y);
  context.scale(width, height);
  context.clip(layer[side], 'evenodd');
  context.drawImage(layer.sprite, 0, 0, 1, 1);
  context.restore();
}

function tint(source: HTMLCanvasElement, rgb: readonly number[], skin: boolean) {
  const canvas = newCanvas(source.width, source.height);
  const context = context2d(canvas, true);
  context.drawImage(source, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const middle = skin ? 188 : 58;

  for (let index = 0; index < pixels.length; index += 4) {
    if (!pixels[index + 3]) continue;

    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    // The warm pixels identify skin on the base sprite. Preserve the gray shirt.
    if (skin && (red < green * 1.07 || red < blue * 1.17)) continue;

    const shade = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / middle;
    for (let channel = 0; channel < 3; channel += 1) {
      const value = rgb[channel];
      pixels[index + channel] = shade < 1
        ? value * shade
        : value + (255 - value) * Math.min(1, (shade - 1) * 1.2);
    }
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

async function loadArtwork() {
  const names = [...bodyImages, ...propImages, 'features3d'] as const;
  const images = Object.fromEntries(
    await Promise.all(names.map(async name => [name, await loadImage(name)] as const)),
  ) as Record<(typeof names)[number], HTMLImageElement>;

  const sprites = Object.fromEntries(bodyImages.map(name => {
    const image = images[name];
    return [name, cleanSprite(image, [0, 0, image.width, image.height], true)];
  })) as Record<(typeof bodyImages)[number], HTMLCanvasElement>;

  // The feature atlas follows the versioned eye columns and expression rows.
  const atlas = images.features3d;
  const cellWidth = atlas.width / avatarOptions.eyes.length;
  const cellHeight = atlas.height / avatarOptions.expression.length;
  const features = avatarOptions.expression.map((_, row) =>
    avatarOptions.eyes.map((_, column) =>
      cleanSprite(atlas, [column * cellWidth, row * cellHeight, cellWidth, cellHeight], false),
    ),
  );

  const props = Object.fromEntries(Object.entries(propProfiles).map(([id, profile]) => {
    const image = images[profile.image];
    const [x, y, width, height] = profile.crop ?? [0, 0, 1, 1];
    const rectangle: Rectangle = [x * image.width, y * image.height, width * image.width, height * image.height];
    return [id, makePropLayers(profile, cleanSprite(image, rectangle, true, 28))];
  })) as Record<PropId, PropLayers>;

  return { sprites, features, props, tintedSprites: new Map<string, HTMLCanvasElement>() };
}

type Artwork = Awaited<ReturnType<typeof loadArtwork>>;
let artworkPromise: Promise<Artwork> | undefined;

function recolor<Kind extends 'skin' | 'hairColor'>(
  artwork: Artwork, sprite: (typeof bodyImages)[number], kind: Kind, color: AvatarConfig[Kind],
) {
  const source = artwork.sprites[sprite];
  if (color === 'warm' || color === 'charcoal') return source;

  const key = sprite + '/' + color;
  const cached = artwork.tintedSprites.get(key);
  if (cached) return cached;

  const colored = tint(source, palettes[kind][color].rgb, kind === 'skin');
  artwork.tintedSprites.set(key, colored);
  return colored;
}

function drawHair(context: CanvasRenderingContext2D, artwork: Artwork, avatar: AvatarConfig, prop?: PropProfile) {
  if (avatar.hair === 'none') return;

  const hair = hairStyles[avatar.hair];
  context.save();
  if (prop?.tuckHair) {
    const [, top, , height] = prop.rectangle;
    const points = prop.curves[0].points;
    const fringe = top + height * points[Math.floor(points.length / 2)][1];
    context.beginPath();
    context.rect(0, fringe, stageSize, stageSize - fringe);
    context.clip();
  }

  const sprite = recolor(artwork, hair.image, 'hairColor', avatar.hairColor);
  context.drawImage(sprite, ...hair.rectangle);
  context.restore();
}

export function loadAvatarArtwork() {
  // The picker and all player portraits share one set of prepared sprites.
  artworkPromise ??= loadArtwork().catch(error => {
    artworkPromise = undefined;
    throw error;
  });
  return artworkPromise;
}

export function drawAvatar(portrait: HTMLCanvasElement, artwork: Artwork, avatar: AvatarConfig) {
  const context = context2d(portrait);
  const prop = avatar.prop === 'none' ? undefined : artwork.props[avatar.prop];
  const eyes = avatarOptions.eyes.indexOf(avatar.eyes);
  const expression = avatarOptions.expression.indexOf(avatar.expression);

  context.clearRect(0, 0, portrait.width, portrait.height);
  context.save();
  context.scale(portrait.width / stageSize, portrait.height / stageSize);
  if (prop) drawProp(context, prop, 'rear');
  context.drawImage(recolor(artwork, 'blank3d', 'skin', avatar.skin), 136, 110, 240, 336);
  context.drawImage(artwork.features[expression][eyes], 138, 137, 236, 190);
  drawHair(context, artwork, avatar, avatar.prop === 'none' ? undefined : propProfiles[avatar.prop]);
  if (prop) drawProp(context, prop, 'front');
  context.restore();
}
