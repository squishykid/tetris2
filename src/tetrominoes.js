import { BOARD_COLS, BOARD_ROWS } from './constants.js';

// Each piece: 4 rotation states, each state = array of [row, col] offsets from bounding-box origin
export const PIECES = {
  I: {
    color: 1, size: 4,
    shapes: [
      [[1,0],[1,1],[1,2],[1,3]],
      [[0,2],[1,2],[2,2],[3,2]],
      [[2,0],[2,1],[2,2],[2,3]],
      [[0,1],[1,1],[2,1],[3,1]],
    ],
  },
  O: {
    color: 2, size: 2,
    shapes: [
      [[0,0],[0,1],[1,0],[1,1]],
      [[0,0],[0,1],[1,0],[1,1]],
      [[0,0],[0,1],[1,0],[1,1]],
      [[0,0],[0,1],[1,0],[1,1]],
    ],
  },
  T: {
    color: 3, size: 3,
    shapes: [
      [[0,1],[1,0],[1,1],[1,2]],
      [[0,1],[1,1],[1,2],[2,1]],
      [[1,0],[1,1],[1,2],[2,1]],
      [[0,1],[1,0],[1,1],[2,1]],
    ],
  },
  S: {
    color: 4, size: 3,
    shapes: [
      [[0,1],[0,2],[1,0],[1,1]],
      [[0,1],[1,1],[1,2],[2,2]],
      [[1,1],[1,2],[2,0],[2,1]],
      [[0,0],[1,0],[1,1],[2,1]],
    ],
  },
  Z: {
    color: 5, size: 3,
    shapes: [
      [[0,0],[0,1],[1,1],[1,2]],
      [[0,2],[1,1],[1,2],[2,1]],
      [[1,0],[1,1],[2,1],[2,2]],
      [[0,1],[1,0],[1,1],[2,0]],
    ],
  },
  J: {
    color: 6, size: 3,
    shapes: [
      [[0,0],[1,0],[1,1],[1,2]],
      [[0,1],[0,2],[1,1],[2,1]],
      [[1,0],[1,1],[1,2],[2,2]],
      [[0,1],[1,1],[2,0],[2,1]],
    ],
  },
  L: {
    color: 7, size: 3,
    shapes: [
      [[0,2],[1,0],[1,1],[1,2]],
      [[0,1],[1,1],[2,1],[2,2]],
      [[1,0],[1,1],[1,2],[2,0]],
      [[0,0],[0,1],[1,1],[2,1]],
    ],
  },
  // TRI is a right-triangle piece — 3 cells inside a 2x2 box. Its cells carry
  // `clips` (parallel to `shapes`) so each cell renders as a triangular slice,
  // giving the whole piece a clean triangle silhouette in all 4 rotations.
  TRI: {
    color: 8, size: 2,
    shapes: [
      [[0,0],[1,0],[1,1]],  // right angle bottom-left
      [[0,0],[0,1],[1,0]],  // right angle top-left
      [[0,0],[0,1],[1,1]],  // right angle top-right
      [[0,1],[1,0],[1,1]],  // right angle bottom-right
    ],
    clips: [
      ['LL', 'FULL', 'LL'],
      ['FULL', 'UL', 'UL'],
      ['UR', 'FULL', 'UR'],
      ['LR', 'LR', 'FULL'],
    ],
  },
};

// CSS clip-path polygons for triangular cells. Each key is a right-triangle
// half of the cell; 'FULL' leaves the cell as a solid square (null = no clip).
export const TRIANGLE_CLIP_PATHS = {
  LL: 'polygon(0 0, 0 100%, 100% 100%)',   // ◣ lower-left
  UL: 'polygon(0 0, 100% 0, 0 100%)',      // ◤ upper-left
  UR: 'polygon(0 0, 100% 0, 100% 100%)',   // ◥ upper-right
  LR: 'polygon(100% 0, 100% 100%, 0 100%)',// ◢ lower-right
  FULL: null,
};

// SRS wall kick offsets [dx, dy] — dx=col delta, dy=row delta (positive = down)
// Derived from SRS spec with row-axis flipped to match board coordinates (row 0 = top)
const JLSTZ_KICKS = {
  '0->1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '1->0': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '1->2': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '2->1': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '2->3': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '3->2': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '3->0': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '0->3': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
};

const I_KICKS = {
  '0->1': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '1->0': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '1->2': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
  '2->1': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '2->3': [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  '3->2': [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  '3->0': [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
  '0->3': [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
};

// TRI lives in a 2x2 box, so SRS's 3x3 kicks don't apply. A few gentle nudges
// are enough to let it rotate off walls and floors without clipping through.
const TRI_KICKS = {
  '0->1': [[0,0],[-1,0],[1,0],[0,-1]],
  '1->0': [[0,0],[-1,0],[1,0],[0,-1]],
  '1->2': [[0,0],[-1,0],[1,0],[0,-1]],
  '2->1': [[0,0],[-1,0],[1,0],[0,-1]],
  '2->3': [[0,0],[-1,0],[1,0],[0,-1]],
  '3->2': [[0,0],[-1,0],[1,0],[0,-1]],
  '3->0': [[0,0],[-1,0],[1,0],[0,-1]],
  '0->3': [[0,0],[-1,0],[1,0],[0,-1]],
};

export const WALL_KICKS = { I: I_KICKS, JLSTZ: JLSTZ_KICKS, TRI: TRI_KICKS };

// Absolute board [row, col] for each cell of a piece
export function getPieceCells(type, rotation, x, y) {
  return PIECES[type].shapes[rotation].map(([dr, dc]) => [y + dr, x + dc]);
}

// Like getPieceCells but pairs each cell with its clip code (or 'FULL').
// Used by renderers to draw triangular pieces cell-by-cell.
export function getPieceCellsWithClips(type, rotation, x, y) {
  const { shapes, clips } = PIECES[type];
  return shapes[rotation].map(([dr, dc], i) => ({
    r: y + dr,
    c: x + dc,
    clip: clips ? clips[rotation][i] : 'FULL',
  }));
}

// Check if a piece at (x, y, rotation) collides with walls or locked cells
export function collides(board, type, rotation, x, y) {
  return getPieceCells(type, rotation, x, y).some(([r, c]) =>
    c < 0 || c >= BOARD_COLS || r >= BOARD_ROWS || (r >= 0 && board[r][c] !== 0)
  );
}

// Compute the Y position where the piece would land (ghost piece row)
export function computeGhostY(board, type, rotation, x, y) {
  let gy = y;
  while (!collides(board, type, rotation, x, gy + 1)) gy++;
  return gy;
}

// Spawn piece at top center; y offset so topmost cell aligns with board row 0
export function spawnPiece(type) {
  const { size, shapes } = PIECES[type];
  const minRow = Math.min(...shapes[0].map(([r]) => r));
  return {
    type,
    rotation: 0,
    x: Math.floor((BOARD_COLS - size) / 2),
    y: -minRow,
  };
}

// Try clockwise rotation with SRS wall kicks; returns new {rotation,x,y} or null
export function tryRotate(board, type, rotation, x, y) {
  const next = (rotation + 1) % 4;
  const table = type === 'I' ? I_KICKS : type === 'TRI' ? TRI_KICKS : JLSTZ_KICKS;
  const offsets = table[`${rotation}->${next}`] ?? [[0, 0]];
  for (const [dx, dy] of offsets) {
    if (!collides(board, type, next, x + dx, y + dy)) {
      return { rotation: next, x: x + dx, y: y + dy };
    }
  }
  return null;
}
