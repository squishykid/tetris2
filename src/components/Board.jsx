import { SOLID_CLASSES, BOARD_COLS, BOARD_ROWS } from '../constants.js';
import { PIECES, getPieceCells } from '../tetrominoes.js';

// Build a display grid: start from locked board, overlay ghost + active piece
function buildDisplayGrid(board, activePiece, ghostY) {
  // Deep copy board
  const grid = board.map(row => row.map(cell => ({ color: cell, ghost: false })));

  if (!activePiece) return grid;

  const { type, rotation, x, y } = activePiece;

  // Ghost cells (outlined, not filled)
  getPieceCells(type, rotation, x, ghostY).forEach(([r, c]) => {
    if (r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS && grid[r][c].color === 0) {
      grid[r][c] = { color: PIECES[type].color, ghost: true };
    }
  });

  // Active piece cells (solid, rainbow)
  getPieceCells(type, rotation, x, y).forEach(([r, c]) => {
    if (r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS) {
      grid[r][c] = { color: PIECES[type].color, ghost: false, active: true };
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
        row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            className={`w-7 h-7 ${cellClass(cell, clearingSet.has(r))}`}
          />
        ))
      )}
    </div>
  );
}
