# Tetris Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, playable Tetris game as a Vite + React + Tailwind SPA with useReducer state management.

**Architecture:** Single `useReducer` owns all game state. Two thin hooks (`useGameLoop`, `useInput`) connect the outside world (timers, keyboard) to the reducer via `dispatch`. Four React components render from state snapshot.

**Tech Stack:** Vite 5, React 18, Tailwind CSS 3, Vitest 1

## Global Constraints
- Node ≥ 18; no backend, no persistence
- Board: BOARD_COLS=10, BOARD_ROWS=20
- 7 piece types: I O T S Z J L  (color indices 1–7)
- 7-bag randomizer; `nextPiece` = what spawns after current active piece
- SRS wall kicks: separate tables for I-piece vs JLSTZ
- Scoring: 1L=100×lvl, 2L=300×lvl, 3L=500×lvl, 4L=800×lvl (level at time of clear)
- Level = Math.floor(linesTotal / 10) + 1; gravity delay = Math.max(100, 1000 − (lvl−1)×90) ms
- Ghost piece: outlined, ~30% opacity cells at hard-drop row
- Colors: I=cyan-400, O=yellow-400, T=purple-500, S=green-500, Z=red-500, J=blue-600, L=orange-500
- Controls: ←/→ move, ↓ soft drop, ↑/X rotate, Space hard drop, P pause, R restart

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/index.css`

**Interfaces:**
- Produces: `npm run dev` starts at `http://localhost:5173`; `npm test` runs Vitest

- [ ] **Step 1: Write package.json**

```json
{
  "name": "tetris2",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "vite": "^5.4.10",
    "vitest": "^1.6.0",
    "@vitest/ui": "^1.6.0"
  }
}
```

- [ ] **Step 2: Write vite.config.js**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 3: Write tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 4: Write postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Write index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tetris</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Write src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: Write src/main.jsx**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 8: Write src/App.jsx**

```jsx
import Tetris from './components/Tetris.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <Tetris />
    </div>
  );
}
```

- [ ] **Step 9: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 10: Commit**

```bash
git add package.json vite.config.js tailwind.config.js postcss.config.js index.html src/
git commit -m "feat: scaffold Vite + React + Tailwind project"
```

---

### Task 2: Constants

**Files:**
- Create: `src/constants.js`
- Create: `src/constants.test.js`

**Interfaces:**
- Produces: `BOARD_COLS`, `BOARD_ROWS`, `PIECE_TYPES`, `COLORS`, `SCORE_TABLE`, `gravityDelay(level)`

- [ ] **Step 1: Write the failing test**

```js
// src/constants.test.js
import { describe, it, expect } from 'vitest';
import { BOARD_COLS, BOARD_ROWS, PIECE_TYPES, COLORS, SCORE_TABLE, gravityDelay } from './constants.js';

describe('constants', () => {
  it('board is 10x20', () => {
    expect(BOARD_COLS).toBe(10);
    expect(BOARD_ROWS).toBe(20);
  });

  it('has 7 piece types', () => {
    expect(PIECE_TYPES).toHaveLength(7);
    expect(PIECE_TYPES).toContain('I');
    expect(PIECE_TYPES).toContain('O');
  });

  it('colors maps 0-7', () => {
    expect(COLORS[0]).toBeNull();
    expect(COLORS[1]).toMatch(/cyan/);
    expect(COLORS[7]).toMatch(/orange/);
  });

  it('score table', () => {
    expect(SCORE_TABLE[1]).toBe(100);
    expect(SCORE_TABLE[4]).toBe(800);
  });

  it('gravity delay starts at 1000ms and floors at 100ms', () => {
    expect(gravityDelay(1)).toBe(1000);
    expect(gravityDelay(10)).toBe(190);
    expect(gravityDelay(20)).toBe(100); // clamped
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test
```

Expected: FAIL — `constants.js` does not exist.

- [ ] **Step 3: Write src/constants.js**

```js
export const BOARD_COLS = 10;
export const BOARD_ROWS = 20;

export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// null = empty cell; 1-7 = piece color index
export const COLORS = {
  0: null,
  1: 'bg-cyan-400',    // I
  2: 'bg-yellow-400',  // O
  3: 'bg-purple-500',  // T
  4: 'bg-green-500',   // S
  5: 'bg-red-500',     // Z
  6: 'bg-blue-600',    // J
  7: 'bg-orange-500',  // L
};

// Points per lines-cleared multiplied by current level
export const SCORE_TABLE = { 1: 100, 2: 300, 3: 500, 4: 800 };

// Milliseconds between automatic gravity ticks
export const gravityDelay = (level) => Math.max(100, 1000 - (level - 1) * 90);
```

- [ ] **Step 4: Run to confirm pass**

```bash
npm test
```

Expected: PASS (all constants tests green).

- [ ] **Step 5: Commit**

```bash
git add src/constants.js src/constants.test.js
git commit -m "feat: add game constants"
```

---

### Task 3: Tetrominoes

**Files:**
- Create: `src/tetrominoes.js`
- Create: `src/tetrominoes.test.js`

**Interfaces:**
- Produces:
  - `PIECES` — `{ [type]: { color: number, size: number, shapes: [row,col][][] } }`
  - `WALL_KICKS` — `{ [type]: { [from->to]: [dx,dy][] } }`
  - `getPieceCells(type, rotation, x, y)` → `[row, col][]`
  - `spawnPiece(type)` → `{ type, rotation, x, y }`
  - `tryRotate(board, type, rotation, x, y)` → `{ rotation, x, y } | null`

- [ ] **Step 1: Write the failing tests**

```js
// src/tetrominoes.test.js
import { describe, it, expect } from 'vitest';
import { PIECES, getPieceCells, spawnPiece, tryRotate } from './tetrominoes.js';
import { BOARD_COLS, BOARD_ROWS } from './constants.js';

describe('PIECES', () => {
  it('has 7 pieces with 4 rotations each', () => {
    for (const type of ['I', 'O', 'T', 'S', 'Z', 'J', 'L']) {
      expect(PIECES[type].shapes).toHaveLength(4);
      expect(PIECES[type].shapes[0]).toHaveLength(4); // each rotation has 4 cells
    }
  });

  it('I-piece rotation 0 is horizontal', () => {
    const cells = PIECES['I'].shapes[0];
    const rows = cells.map(([r]) => r);
    expect(new Set(rows).size).toBe(1); // all same row
  });

  it('O-piece all rotations are identical', () => {
    const [r0, r1, r2, r3] = PIECES['O'].shapes;
    expect(r0).toEqual(r1);
    expect(r0).toEqual(r2);
    expect(r0).toEqual(r3);
  });
});

describe('getPieceCells', () => {
  it('offsets cells by piece position', () => {
    const cells = getPieceCells('T', 0, 3, 5);
    // T rotation 0: [[0,1],[1,0],[1,1],[1,2]] + (5, 3)
    expect(cells).toContainEqual([5, 4]);  // [5+0, 3+1]
    expect(cells).toContainEqual([6, 3]);  // [5+1, 3+0]
  });
});

describe('spawnPiece', () => {
  it('spawns horizontally centered', () => {
    const { x, y, type, rotation } = spawnPiece('T');
    expect(type).toBe('T');
    expect(rotation).toBe(0);
    expect(x).toBe(3); // Math.floor((10-3)/2)
  });

  it('I-piece top cell is at board row 0', () => {
    const p = spawnPiece('I');
    const cells = getPieceCells(p.type, p.rotation, p.x, p.y);
    const minRow = Math.min(...cells.map(([r]) => r));
    expect(minRow).toBe(0);
  });
});

describe('tryRotate', () => {
  it('rotates T-piece in open space', () => {
    const board = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(0));
    const result = tryRotate(board, 'T', 0, 4, 5);
    expect(result).not.toBeNull();
    expect(result.rotation).toBe(1);
  });

  it('returns null when all kick positions collide', () => {
    // Fill the entire board solid
    const board = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(1));
    const result = tryRotate(board, 'T', 0, 4, 5);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test
```

Expected: FAIL — `tetrominoes.js` does not exist.

- [ ] **Step 3: Write src/tetrominoes.js**

```js
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

export const WALL_KICKS = { I: I_KICKS, JLSTZ: JLSTZ_KICKS };

// Absolute board [row, col] for each cell of a piece
export function getPieceCells(type, rotation, x, y) {
  return PIECES[type].shapes[rotation].map(([dr, dc]) => [y + dr, x + dc]);
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
  const table = type === 'I' ? I_KICKS : JLSTZ_KICKS;
  const offsets = table[`${rotation}->${next}`] ?? [[0, 0]];
  for (const [dx, dy] of offsets) {
    if (!collides(board, type, next, x + dx, y + dy)) {
      return { rotation: next, x: x + dx, y: y + dy };
    }
  }
  return null;
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npm test
```

Expected: all tetrominoes tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/tetrominoes.js src/tetrominoes.test.js
git commit -m "feat: add tetromino shapes, wall kicks, and helpers"
```

---

### Task 4: Game Reducer

**Files:**
- Create: `src/gameReducer.js`
- Create: `src/gameReducer.test.js`

**Interfaces:**
- Consumes: `PIECES`, `BOARD_COLS`, `BOARD_ROWS`, `PIECE_TYPES`, `SCORE_TABLE` from constants/tetrominoes
- Produces:
  - `INITIAL_STATE` — the idle starting state
  - `gameReducer(state, action)` → new state
  - Actions: `START` `TICK` `MOVE_LEFT` `MOVE_RIGHT` `SOFT_DROP` `HARD_DROP` `ROTATE` `PAUSE`

- [ ] **Step 1: Write the failing tests**

```js
// src/gameReducer.test.js
import { describe, it, expect } from 'vitest';
import { INITIAL_STATE, gameReducer } from './gameReducer.js';

function startedState() {
  return gameReducer(INITIAL_STATE, { type: 'START' });
}

describe('INITIAL_STATE', () => {
  it('phase is idle', () => {
    expect(INITIAL_STATE.phase).toBe('idle');
  });
  it('board is 20 rows of 10 zeros', () => {
    expect(INITIAL_STATE.board).toHaveLength(20);
    expect(INITIAL_STATE.board[0]).toHaveLength(10);
    expect(INITIAL_STATE.board[0][0]).toBe(0);
  });
});

describe('START action', () => {
  it('sets phase to playing', () => {
    const s = startedState();
    expect(s.phase).toBe('playing');
  });
  it('spawns an active piece with valid type', () => {
    const s = startedState();
    expect(['I','O','T','S','Z','J','L']).toContain(s.activePiece.type);
  });
  it('sets a nextPiece', () => {
    const s = startedState();
    expect(['I','O','T','S','Z','J','L']).toContain(s.nextPiece);
  });
  it('score and lines start at 0', () => {
    const s = startedState();
    expect(s.score).toBe(0);
    expect(s.lines).toBe(0);
    expect(s.level).toBe(1);
  });
});

describe('MOVE_LEFT', () => {
  it('decrements x when space available', () => {
    const s = startedState();
    const x0 = s.activePiece.x;
    const s2 = gameReducer(s, { type: 'MOVE_LEFT' });
    // May or may not move depending on piece position, but should not go past 0
    expect(s2.activePiece.x).toBeGreaterThanOrEqual(0);
    // If it could move, it moved
    if (x0 > 0) expect(s2.activePiece.x).toBe(x0 - 1);
  });
});

describe('MOVE_RIGHT', () => {
  it('increments x when space available', () => {
    const s = startedState();
    const s2 = gameReducer(s, { type: 'MOVE_RIGHT' });
    expect(s2.activePiece.x).toBeGreaterThanOrEqual(s.activePiece.x);
  });
});

describe('ROTATE', () => {
  it('changes rotation on open board', () => {
    const s = startedState();
    // Move piece to center to ensure wall kick space
    const centered = { ...s, activePiece: { ...s.activePiece, x: 4, y: 5 } };
    const s2 = gameReducer(centered, { type: 'ROTATE' });
    if (s.activePiece.type !== 'O') {
      // O-piece rotation is identical, others should change
      expect(s2.activePiece.rotation).toBe((s.activePiece.rotation + 1) % 4);
    }
  });
});

describe('HARD_DROP', () => {
  it('locks piece instantly and spawns next', () => {
    const s = startedState();
    const type0 = s.activePiece.type;
    const s2 = gameReducer(s, { type: 'HARD_DROP' });
    // Active piece should have changed (new piece spawned)
    // Board should have some locked cells
    const totalLocked = s2.board.flat().filter(c => c !== 0).length;
    expect(totalLocked).toBe(4); // one piece locked = 4 cells
    // Phase is still playing (no game over on fresh board)
    expect(s2.phase).toBe('playing');
  });
});

describe('TICK', () => {
  it('moves piece down by 1 on empty board', () => {
    const s = startedState();
    const y0 = s.activePiece.y;
    const s2 = gameReducer(s, { type: 'TICK' });
    expect(s2.activePiece.y).toBe(y0 + 1);
  });
});

describe('PAUSE', () => {
  it('toggles between playing and paused', () => {
    const s = startedState();
    const paused = gameReducer(s, { type: 'PAUSE' });
    expect(paused.phase).toBe('paused');
    const resumed = gameReducer(paused, { type: 'PAUSE' });
    expect(resumed.phase).toBe('playing');
  });
  it('ignores TICK while paused', () => {
    const s = startedState();
    const paused = gameReducer(s, { type: 'PAUSE' });
    const y0 = paused.activePiece.y;
    const ticked = gameReducer(paused, { type: 'TICK' });
    expect(ticked.activePiece.y).toBe(y0);
  });
});

describe('line clearing', () => {
  it('clears full rows and updates score', () => {
    // Build a state with 19 full rows + 1 empty top row, piece above
    const s = startedState();
    // Fill rows 1-19 completely (leave row 0 empty)
    const filledBoard = s.board.map((row, i) =>
      i === 0 ? row : row.map(() => 1)
    );
    // Place active piece at top (y near 0) so hard drop clears rows
    const pieceAtTop = { ...s.activePiece, x: 0, y: -1 };
    const setup = { ...s, board: filledBoard, activePiece: pieceAtTop };
    const s2 = gameReducer(setup, { type: 'HARD_DROP' });
    // Score should have increased
    expect(s2.score).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test
```

Expected: FAIL — `gameReducer.js` does not exist.

- [ ] **Step 3: Write src/gameReducer.js**

```js
import { BOARD_COLS, BOARD_ROWS, PIECE_TYPES, SCORE_TABLE } from './constants.js';
import {
  PIECES,
  spawnPiece,
  collides,
  computeGhostY,
  getPieceCells,
  tryRotate,
} from './tetrominoes.js';

// Fisher-Yates shuffle, returns new array
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function newBag() {
  return shuffle(PIECE_TYPES);
}

// Pop from bag; refills if empty. Returns { piece, bag }.
function drawFromBag(bag) {
  const refilled = bag.length === 0 ? newBag() : [...bag];
  const piece = refilled[refilled.length - 1];
  return { piece, bag: refilled.slice(0, -1) };
}

// Lock active piece onto board; returns new board
function lockPiece(board, type, rotation, x, y) {
  const next = board.map(row => [...row]);
  getPieceCells(type, rotation, x, y).forEach(([r, c]) => {
    if (r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS) {
      next[r][c] = PIECES[type].color;
    }
  });
  return next;
}

// Remove full rows, prepend empty rows. Returns { newBoard, linesCleared }.
function clearLines(board) {
  const remaining = board.filter(row => row.some(cell => cell === 0));
  const linesCleared = BOARD_ROWS - remaining.length;
  const empty = Array.from({ length: linesCleared }, () => Array(BOARD_COLS).fill(0));
  return { newBoard: [...empty, ...remaining], linesCleared };
}

// Shared logic for locking a piece, clearing lines, and spawning the next piece
function afterLock(state) {
  const { activePiece, board, bag, nextPiece, score, level, lines } = state;
  const lockedBoard = lockPiece(board, activePiece.type, activePiece.rotation, activePiece.x, activePiece.y);
  const { newBoard, linesCleared } = clearLines(lockedBoard);

  const newScore = score + (linesCleared > 0 ? SCORE_TABLE[linesCleared] * level : 0);
  const newLines = lines + linesCleared;
  const newLevel = Math.floor(newLines / 10) + 1;

  const newActive = spawnPiece(nextPiece);
  const { piece: newNext, bag: newBag } = drawFromBag(bag);

  if (collides(newBoard, newActive.type, newActive.rotation, newActive.x, newActive.y)) {
    return { ...state, board: newBoard, score: newScore, lines: newLines, level: newLevel, phase: 'gameover' };
  }

  return {
    ...state,
    board: newBoard,
    activePiece: newActive,
    ghostY: computeGhostY(newBoard, newActive.type, newActive.rotation, newActive.x, newActive.y),
    bag: newBag,
    nextPiece: newNext,
    score: newScore,
    lines: newLines,
    level: newLevel,
    phase: 'playing',
  };
}

const emptyBoard = () => Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(0));

export const INITIAL_STATE = {
  board: emptyBoard(),
  activePiece: null,
  ghostY: 0,
  bag: [],
  nextPiece: null,
  score: 0,
  level: 1,
  lines: 0,
  phase: 'idle',
};

export function gameReducer(state, action) {
  // Only START and PAUSE work outside of playing
  if (state.phase !== 'playing' && action.type !== 'START' && action.type !== 'PAUSE') {
    return state;
  }

  const { activePiece, board } = state;

  switch (action.type) {
    case 'START': {
      const bag1 = newBag();
      const { piece: activeType, bag: bag2 } = drawFromBag(bag1);
      const { piece: nextType, bag: finalBag } = drawFromBag(bag2);
      const newActive = spawnPiece(activeType);
      const newBoard = emptyBoard();
      return {
        board: newBoard,
        activePiece: newActive,
        ghostY: computeGhostY(newBoard, newActive.type, newActive.rotation, newActive.x, newActive.y),
        bag: finalBag,
        nextPiece: nextType,
        score: 0,
        level: 1,
        lines: 0,
        phase: 'playing',
      };
    }

    case 'PAUSE': {
      if (state.phase === 'playing') return { ...state, phase: 'paused' };
      if (state.phase === 'paused') return { ...state, phase: 'playing' };
      return state;
    }

    case 'MOVE_LEFT': {
      const nx = activePiece.x - 1;
      if (collides(board, activePiece.type, activePiece.rotation, nx, activePiece.y)) return state;
      const newPiece = { ...activePiece, x: nx };
      return { ...state, activePiece: newPiece, ghostY: computeGhostY(board, newPiece.type, newPiece.rotation, newPiece.x, newPiece.y) };
    }

    case 'MOVE_RIGHT': {
      const nx = activePiece.x + 1;
      if (collides(board, activePiece.type, activePiece.rotation, nx, activePiece.y)) return state;
      const newPiece = { ...activePiece, x: nx };
      return { ...state, activePiece: newPiece, ghostY: computeGhostY(board, newPiece.type, newPiece.rotation, newPiece.x, newPiece.y) };
    }

    case 'ROTATE': {
      const result = tryRotate(board, activePiece.type, activePiece.rotation, activePiece.x, activePiece.y);
      if (!result) return state;
      const newPiece = { ...activePiece, ...result };
      return { ...state, activePiece: newPiece, ghostY: computeGhostY(board, newPiece.type, newPiece.rotation, newPiece.x, newPiece.y) };
    }

    case 'SOFT_DROP': {
      const ny = activePiece.y + 1;
      if (collides(board, activePiece.type, activePiece.rotation, activePiece.x, ny)) {
        return afterLock(state);
      }
      const newPiece = { ...activePiece, y: ny };
      return {
        ...state,
        activePiece: newPiece,
        ghostY: computeGhostY(board, newPiece.type, newPiece.rotation, newPiece.x, newPiece.y),
        score: state.score + 1,
      };
    }

    case 'TICK': {
      const ny = activePiece.y + 1;
      if (collides(board, activePiece.type, activePiece.rotation, activePiece.x, ny)) {
        return afterLock(state);
      }
      const newPiece = { ...activePiece, y: ny };
      return { ...state, activePiece: newPiece };
    }

    case 'HARD_DROP': {
      const gy = state.ghostY;
      const dropped = gy - activePiece.y;
      const landedPiece = { ...activePiece, y: gy };
      return afterLock({ ...state, activePiece: landedPiece, score: state.score + dropped * 2 });
    }

    default:
      return state;
  }
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npm test
```

Expected: all reducer tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/gameReducer.js src/gameReducer.test.js
git commit -m "feat: add game reducer with all actions"
```

---

### Task 5: Hooks

**Files:**
- Create: `src/hooks/useGameLoop.js`
- Create: `src/hooks/useInput.js`

**Interfaces:**
- Consumes: `dispatch` (React dispatch function), `phase` (string), `level` (number)
- Produces: `useGameLoop(dispatch, phase, level)` — void; `useInput(dispatch, phase)` — void

- [ ] **Step 1: Write src/hooks/useGameLoop.js**

```js
import { useEffect, useRef } from 'react';
import { gravityDelay } from '../constants.js';

// Fires dispatch({ type: 'TICK' }) on a timer that adjusts with level.
// Clears and re-creates the interval whenever level or phase changes.
export function useGameLoop(dispatch, phase, level) {
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => dispatchRef.current({ type: 'TICK' }), gravityDelay(level));
    return () => clearInterval(id);
  }, [phase, level]);
}
```

- [ ] **Step 2: Write src/hooks/useInput.js**

```js
import { useEffect } from 'react';

const KEY_MAP = {
  ArrowLeft:  'MOVE_LEFT',
  ArrowRight: 'MOVE_RIGHT',
  ArrowDown:  'SOFT_DROP',
  ArrowUp:    'ROTATE',
  x:          'ROTATE',
  X:          'ROTATE',
  ' ':        'HARD_DROP',
  p:          'PAUSE',
  P:          'PAUSE',
  r:          'START',
  R:          'START',
};

// Attaches a keydown listener to window and dispatches mapped actions.
export function useInput(dispatch) {
  useEffect(() => {
    function onKeyDown(e) {
      const actionType = KEY_MAP[e.key];
      if (!actionType) return;
      e.preventDefault();
      dispatch({ type: actionType });
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/
git commit -m "feat: add useGameLoop and useInput hooks"
```

---

### Task 6: Board Component

**Files:**
- Create: `src/components/Board.jsx`

**Interfaces:**
- Consumes:
  - `board: number[][]` — locked cell color indices (0 = empty)
  - `activePiece: { type, rotation, x, y }` — the falling piece
  - `ghostY: number` — row where active piece would land
- Produces: `<Board board={} activePiece={} ghostY={} />` rendered 10×20 grid

- [ ] **Step 1: Write src/components/Board.jsx**

```jsx
import { COLORS, BOARD_COLS, BOARD_ROWS } from '../constants.js';
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

  // Active piece cells (solid)
  getPieceCells(type, rotation, x, y).forEach(([r, c]) => {
    if (r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLS) {
      grid[r][c] = { color: PIECES[type].color, ghost: false };
    }
  });

  return grid;
}

// Tailwind doesn't support dynamic class composition; use a lookup instead
const SOLID_CLASSES = {
  1: 'bg-cyan-400',
  2: 'bg-yellow-400',
  3: 'bg-purple-500',
  4: 'bg-green-500',
  5: 'bg-red-500',
  6: 'bg-blue-600',
  7: 'bg-orange-500',
};

const GHOST_CLASSES = {
  1: 'border-2 border-cyan-400',
  2: 'border-2 border-yellow-400',
  3: 'border-2 border-purple-500',
  4: 'border-2 border-green-500',
  5: 'border-2 border-red-500',
  6: 'border-2 border-blue-600',
  7: 'border-2 border-orange-500',
};

function cellClass({ color, ghost }) {
  if (color === 0) return 'bg-gray-800 border border-gray-700';
  if (ghost) return `${GHOST_CLASSES[color]} bg-transparent`;
  return SOLID_CLASSES[color];
}

export default function Board({ board, activePiece, ghostY }) {
  const grid = buildDisplayGrid(board, activePiece, ghostY);

  return (
    <div
      className="grid border-2 border-gray-600"
      style={{ gridTemplateColumns: `repeat(${BOARD_COLS}, 1.75rem)` }}
    >
      {grid.map((row, r) =>
        row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            className={`w-7 h-7 ${cellClass(cell)}`}
          />
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Board.jsx
git commit -m "feat: add Board component with ghost piece rendering"
```

---

### Task 7: NextPiece and Sidebar Components

**Files:**
- Create: `src/components/NextPiece.jsx`
- Create: `src/components/Sidebar.jsx`

**Interfaces:**
- `<NextPiece type={string} />` — renders a 4×4 preview grid showing the next piece
- `<Sidebar score={number} level={number} lines={number} nextPiece={string} />` — score panel + preview

- [ ] **Step 1: Write src/components/NextPiece.jsx**

```jsx
import { PIECES } from '../tetrominoes.js';

const SOLID_CLASSES = {
  1: 'bg-cyan-400',
  2: 'bg-yellow-400',
  3: 'bg-purple-500',
  4: 'bg-green-500',
  5: 'bg-red-500',
  6: 'bg-blue-600',
  7: 'bg-orange-500',
};

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
```

- [ ] **Step 2: Write src/components/Sidebar.jsx**

```jsx
import NextPiece from './NextPiece.jsx';

function StatRow({ label, value }) {
  return (
    <div className="mb-4">
      <p className="text-gray-400 text-xs uppercase tracking-widest">{label}</p>
      <p className="text-white text-2xl font-mono font-bold">{value}</p>
    </div>
  );
}

export default function Sidebar({ score, level, lines, nextPiece }) {
  return (
    <div className="flex flex-col gap-6 w-28">
      <StatRow label="Score" value={score} />
      <StatRow label="Level" value={level} />
      <StatRow label="Lines" value={lines} />
      <NextPiece type={nextPiece} />
      <div className="mt-4">
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Controls</p>
        <ul className="text-gray-500 text-xs space-y-0.5">
          <li>← → Move</li>
          <li>↓ Soft drop</li>
          <li>↑ / X Rotate</li>
          <li>Space Hard drop</li>
          <li>P Pause</li>
          <li>R Restart</li>
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/NextPiece.jsx src/components/Sidebar.jsx
git commit -m "feat: add NextPiece and Sidebar components"
```

---

### Task 8: Tetris Root Component + Smoke Test

**Files:**
- Create: `src/components/Tetris.jsx`

**Interfaces:**
- Consumes: `gameReducer`, `INITIAL_STATE`, `useGameLoop`, `useInput`, `Board`, `Sidebar`
- Produces: `<Tetris />` — fully wired game root component

- [ ] **Step 1: Write src/components/Tetris.jsx**

```jsx
import { useReducer, useCallback } from 'react';
import { gameReducer, INITIAL_STATE } from '../gameReducer.js';
import { useGameLoop } from '../hooks/useGameLoop.js';
import { useInput } from '../hooks/useInput.js';
import Board from './Board.jsx';
import Sidebar from './Sidebar.jsx';

function Overlay({ children }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-10">
      {children}
    </div>
  );
}

export default function Tetris() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const { board, activePiece, ghostY, nextPiece, score, level, lines, phase } = state;

  const stableDispatch = useCallback(dispatch, []);

  useGameLoop(stableDispatch, phase, level);
  useInput(stableDispatch);

  return (
    <div className="flex gap-8 items-start select-none">
      {/* Left padding to balance layout */}
      <div className="w-28" />

      {/* Board with overlays */}
      <div className="relative">
        <Board board={board} activePiece={activePiece} ghostY={ghostY} />

        {phase === 'idle' && (
          <Overlay>
            <h1 className="text-white text-4xl font-bold tracking-widest mb-4">TETRIS</h1>
            <p className="text-gray-300 text-sm">Press R to start</p>
          </Overlay>
        )}

        {phase === 'paused' && (
          <Overlay>
            <h2 className="text-white text-3xl font-bold tracking-widest mb-4">PAUSED</h2>
            <p className="text-gray-300 text-sm">Press P to resume</p>
          </Overlay>
        )}

        {phase === 'gameover' && (
          <Overlay>
            <h2 className="text-white text-3xl font-bold tracking-widest mb-2">GAME OVER</h2>
            <p className="text-gray-400 text-lg mb-4">Score: {score}</p>
            <p className="text-gray-300 text-sm">Press R to restart</p>
          </Overlay>
        )}
      </div>

      <Sidebar score={score} level={level} lines={lines} nextPiece={nextPiece} />
    </div>
  );
}
```

- [ ] **Step 2: Run all tests one final time**

```bash
npm test
```

Expected: all tests PASS (constants, tetrominoes, reducer).

- [ ] **Step 3: Start the dev server**

```bash
npm run dev
```

Expected: server starts at `http://localhost:5173`.

- [ ] **Step 4: Verify manually in browser**

Open `http://localhost:5173` in a browser.

Checklist:
- [ ] "TETRIS / Press R to start" overlay shown on dark background
- [ ] Press R: pieces spawn and fall
- [ ] Left/Right arrows move piece
- [ ] Up arrow or X rotates piece
- [ ] Down arrow accelerates drop
- [ ] Spacebar hard-drops instantly
- [ ] Ghost piece (outlined) shows landing position
- [ ] Filling a row clears it; rows above shift down
- [ ] Score, Level, Lines counters update
- [ ] Next piece preview updates in sidebar
- [ ] P pauses and resumes
- [ ] Game over overlay appears when pieces stack to top
- [ ] R restarts from game over

- [ ] **Step 5: Commit**

```bash
git add src/components/Tetris.jsx
git commit -m "feat: add Tetris root component and wire game together"
```
