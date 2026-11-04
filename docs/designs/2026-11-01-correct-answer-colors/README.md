# Correct-answer colors

November 1, 2026. Color exploration for the existing “You got it!” result banner.

## User feedback

The primary color does not make the success result stand out enough. Owner selected **Solid emerald** (requested as “vivid emerald”). Implemented November 1, 2026: `#54d69c` background with `#10392b` text and icon, providing approximately 7:1 contrast.

## Variants

- **Vivid lime:** yellow-green text and icon on an olive-green surface. Recommended for a distinct success highlight while retaining a quiet banner surface.
- **Reward gold:** gold text and icon on a warm brown surface. Celebratory, but shares a color family with the final-three-second countdown warning.
- **Solid emerald:** a bright green surface with dark content. Strongest visual emphasis of the three alternatives.
- **Current mint:** reference using the previous production dark banner colors, `#203d3c` and `#9ae1d0`.

All variants retain the existing banner layout, text, icon and points. The surrounding answer and primary Ready action provide context. Light theme adaptations are sketch-only; the dark mint reference preserves the previous production appearance. The timer is a static context sample. Ready buttons demonstrate local state only.

## Files

- `source.html`: editable inline source, with optional host color controls.
- `preview.html`: browser-openable preview with variant navigation.

The selected emerald colors are implemented in `src/rooms/RoomMatch.css`. Wrong and unanswered states retain their existing colors. No image dependencies. The preview runtime supplies Lucide icons and carousel navigation and may require internet access.
