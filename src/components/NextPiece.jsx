import { PIECES } from '../tetrominoes.js';
import { SOLID_CLASSES } from '../constants.js';

export default function NextPiece({ type }) {
  if (!type) return null;

  const { shapes, color, size } = PIECES[type];
  const cells = shapes[0];
  // Render into a size×size grid
  const grid = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) =>
      cells.some(([dr, dc]) => dr === r && dc === c)
    )
  );

  return (
    <div>
      <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Next</p>
      <div
        className="grid gap-px"
        style={{ gridTemplateColumns: `repeat(${size}, 1.5rem)` }}
      >
        {grid.map((row, r) =>
          row.map((filled, c) => (
            <div
              key={`${r}-${c}`}
              className={`w-6 h-6 ${filled ? SOLID_CLASSES[color] : 'bg-gray-800'}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
