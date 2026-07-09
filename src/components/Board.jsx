import { SOLID_CLASSES, BOARD_COLS, BOARD_ROWS } from '../constants.js';
import { PIECES, getPieceCellsWithClips, TRIANGLE_CLIP_PATHS } from '../tetrominoes.js';

// A locked board cell is either a color index or a { color, clip } object
// (triangle cells). Normalize to { color, clip }.
function normalizeCell(cell) {
  if (cell && typeof cell === 'object') return { color: cell.color, clip: cell.clip };
  return { color: cell, clip: 'FULL' };
}

// Build a display grid: start from locked board, overlay ghost + active piece
function buildDisplayGrid(board, activePiece, ghostY) {
  const grid = board.map(row => row.map(cell => ({ ...normalizeCell(cell), ghost: false })));

  if (!activePiece) return grid;

  const { type, rotation, x, y } = activePiece;
  const color = PIECES[type].color;

  // Ghost cells (outlined, not filled)
  getPieceCellsWithClips(type, rotation, x, ghostY).forEach(({ r, c, clip }) => {
    if (r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS && grid[r][c].color === 0) {
      grid[r][c] = { color, clip, ghost: true };
    }
  });

  // Active piece cells (solid, rainbow)
  getPieceCellsWithClips(type, rotation, x, y).forEach(({ r, c, clip }) => {
    if (r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS) {
      grid[r][c] = { color, clip, ghost: false, active: true };
    }
  });

  return grid;
}


const GHOST_CLASSES = {
  1: 'border-2 border-cyan-400',
  2: 'border-2 border-yellow-400',
  3: 'border-2 border-purple-500',
  4: 'border-2 border-green-500',
  5: 'border-2 border-red-500',
  6: 'border-2 border-blue-600',
  7: 'border-2 border-orange-500',
};

function cellClass({ color, ghost, active }, isClearing) {
  if (isClearing) return 'bg-white transition-colors duration-300';
  if (color === 0) return 'bg-gray-800 border border-gray-700';
  if (ghost) return `${GHOST_CLASSES[color]} bg-transparent opacity-40`;
  if (active) return 'rainbow-cell';
  return SOLID_CLASSES[color];
}

export default function Board({ board, activePiece, ghostY, clearingRows = [] }) {
  const grid = buildDisplayGrid(board, activePiece, ghostY);
  const clearingSet = new Set(clearingRows);

  return (
    <div
      className="grid border-2 border-gray-600"
      style={{ gridTemplateColumns: `repeat(${BOARD_COLS}, 1.75rem)` }}
    >
      {grid.map((row, r) =>
        row.map((cell, c) => {
          const clipPath = clearingSet.has(r) ? undefined : TRIANGLE_CLIP_PATHS[cell.clip];
          return (
            <div
              key={`${r}-${c}`}
              className={`w-7 h-7 ${cellClass(cell, clearingSet.has(r))}`}
              style={clipPath ? { clipPath } : undefined}
            />
          );
        })
      )}
    </div>
  );
}
