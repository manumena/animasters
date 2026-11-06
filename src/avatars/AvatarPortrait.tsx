import { useEffect, useMemo, useRef, useState } from 'react';
import { readAvatar } from './protocol';
import type { AvatarConfig } from './protocol';
import './AvatarPortrait.css';

interface AvatarPortraitProps {
  avatar?: AvatarConfig;
  nickname?: string;
  preview?: boolean;
  resolution?: number;
}

export default function AvatarPortrait({
  avatar,
  nickname = '',
  preview = false,
  resolution = preview ? 320 : 96,
}: AvatarPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);
  // Room snapshots recreate player objects even when the look is unchanged.
  const look = useMemo(() => {
    const valid = readAvatar(avatar);
    return valid ? JSON.stringify(valid) : '';
  }, [avatar]);

  useEffect(() => {
    if (!look || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const config = JSON.parse(look) as AvatarConfig;
    let active = true;

    void import('./renderer')
      .then(async ({ drawAvatar, loadAvatarArtwork }) => {
        const artwork = await loadAvatarArtwork();
        if (!active) return;

        drawAvatar(canvas, artwork, config);
        setDrawn(true);
      })
      .catch(() => {
        if (active) setDrawn(false);
      });

    return () => {
      active = false;
    };
  }, [look, resolution]);

  const showCanvas = Boolean(look) && drawn;
  const initial = Array.from(nickname.trim())[0];

  return (
    <span
      className={preview ? 'avatar-portrait avatar-portrait-preview' : 'avatar-portrait'}
      aria-hidden={!preview}
      role={preview ? 'img' : undefined}
      aria-label={preview ? 'Avatar preview' : undefined}
    >
      {look && <canvas ref={canvasRef} width={resolution} height={resolution} hidden={!showCanvas} />}
      {!showCanvas && <span>{initial ?? '…'}</span>}
    </span>
  );
}
