export const BOARD_COLS = 10;
export const BOARD_ROWS = 20;

export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L', 'TRI'];

// null = empty cell; 1-8 = piece color index
export const COLORS = {
  0: null,
  1: 'bg-cyan-400',    // I
  2: 'bg-yellow-400',  // O
  3: 'bg-purple-500',  // T
  4: 'bg-green-500',   // S
  5: 'bg-red-500',     // Z
  6: 'bg-blue-600',    // J
  7: 'bg-orange-500',  // L
  8: 'bg-pink-500',    // TRI
};

// Tailwind doesn't support dynamic class composition; use a lookup instead
export const SOLID_CLASSES = {
  1: 'bg-cyan-400',
  2: 'bg-yellow-400',
  3: 'bg-purple-500',
  4: 'bg-green-500',
  5: 'bg-red-500',
  6: 'bg-blue-600',
  7: 'bg-orange-500',
  8: 'bg-pink-500',
};

// Points per lines-cleared multiplied by current level
export const SCORE_TABLE = { 1: 100, 2: 300, 3: 500, 4: 800 };

// Milliseconds between automatic gravity ticks
export const gravityDelay = (level) => Math.max(100, 1000 - (level - 1) * 90);

// Milliseconds a completed row flashes white before being removed
export const FLASH_DURATION_MS = 400;
