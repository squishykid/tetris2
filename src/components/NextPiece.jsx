import { PIECES, TRIANGLE_CLIP_PATHS } from '../tetrominoes.js';
import { SOLID_CLASSES } from '../constants.js';

export default function NextPiece({ type }) {
  if (!type) return null;

  const { shapes, clips, color, size } = PIECES[type];
  const cells = shapes[0];
  // Render into a size×size grid; each cell tracks whether it's filled and its
  // clip code (so triangle pieces preview with their triangular silhouette).
  const grid = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      const idx = cells.findIndex(([dr, dc]) => dr === r && dc === c);
      return { filled: idx !== -1, clip: clips && idx !== -1 ? clips[0][idx] : 'FULL' };
    })
  );

  return (
    <div>
      <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Next</p>
      <div
        className="grid gap-px"
        style={{ gridTemplateColumns: `repeat(${size}, 1.5rem)` }}
      >
        {grid.map((row, r) =>
          row.map(({ filled, clip }, c) => {
            const clipPath = TRIANGLE_CLIP_PATHS[clip];
            return (
              <div
                key={`${r}-${c}`}
                className={`w-6 h-6 ${filled ? SOLID_CLASSES[color] : 'bg-gray-800'}`}
                style={clipPath ? { clipPath } : undefined}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
