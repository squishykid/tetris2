# Line-Clear Flash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a piece lock completes one or more full rows, flash those rows white for ~400ms (frozen gameplay) before removing them, instead of clearing instantly.

**Architecture:** Split the existing single-step `afterLock` (lock → clear → score → spawn) into two reducer steps connected by a new `phase: 'clearing'`. Locking with full rows freezes the game (reusing existing phase-gating in `useGameLoop` and the reducer's action guard) and records which rows are full. A new timer hook fires `FINISH_CLEAR` after a fixed delay, which does the actual removal, scoring, and next-piece spawn. `Board.jsx` renders rows named in `clearingRows` with a white CSS-transition class instead of their normal piece color, producing the fade.

**Tech Stack:** React 18, Vite, Tailwind CSS, Vitest (existing stack, no new dependencies).

## Global Constraints

- No new npm dependencies.
- Flash duration is a hardcoded constant, not user-configurable.
- Existing action guard clause pattern (`phase !== 'playing'` blocks most actions) must be preserved and extended, not replaced.
- Follow existing code style: named exports, no comments except where genuinely non-obvious (existing files use very few comments — match that).

---

### Task 1: Add `FLASH_DURATION_MS` constant

**Files:**
- Modify: `src/constants.js`

**Interfaces:**
- Produces: `FLASH_DURATION_MS` (number, exported constant) — consumed by Task 3's timer hook.

- [ ] **Step 1: Add the constant**

In `src/constants.js`, after the `gravityDelay` export (end of file), add:

```js

// Milliseconds a completed row flashes white before being removed
export const FLASH_DURATION_MS = 400;
```

- [ ] **Step 2: Commit**

```bash
git add src/constants.js
git commit -m "feat: add FLASH_DURATION_MS constant"
```

---

### Task 2: Split `afterLock` into deferred-clear + `FINISH_CLEAR` in the reducer

**Files:**
- Modify: `src/gameReducer.js`
- Test: `src/gameReducer.test.js`

**Interfaces:**
- Consumes: existing `PIECES`, `spawnPiece`, `collides`, `computeGhostY`, `getPieceCells` from `./tetrominoes.js`; existing `BOARD_COLS`, `BOARD_ROWS`, `SCORE_TABLE` from `./constants.js`.
- Produces:
  - `INITIAL_STATE.clearingRows` — `number[]`, empty by default.
  - New phase value `'clearing'`.
  - New action `{ type: 'FINISH_CLEAR' }`.
  - These are consumed by Task 3 (timer hook dispatches `FINISH_CLEAR`) and Task 4 (`Board.jsx` reads `clearingRows`).

- [ ] **Step 1: Write the failing tests**

Replace the existing `describe('line clearing', ...)` block in `src/gameReducer.test.js` (currently lines 114-129) with:

```js
describe('line clearing', () => {
  function fullBoardSetup() {
    const s = startedState();
    // Fill rows 1-19 completely (leave row 0 empty)
    const filledBoard = s.board.map((row, i) =>
      i === 0 ? row : row.map(() => 1)
    );
    // Place active piece at top (y near 0) so hard drop completes rows 1-19
    const pieceAtTop = { ...s.activePiece, x: 0, y: -1 };
    return { ...s, board: filledBoard, activePiece: pieceAtTop };
  }

  it('enters clearing phase without scoring immediately', () => {
    const setup = fullBoardSetup();
    const s2 = gameReducer(setup, { type: 'HARD_DROP' });
    expect(s2.phase).toBe('clearing');
    expect(s2.score).toBe(setup.score);
    expect(s2.clearingRows.length).toBeGreaterThan(0);
    expect(s2.clearingRows).toEqual(expect.arrayContaining([19]));
  });

  it('ignores gameplay actions while clearing', () => {
    const setup = fullBoardSetup();
    const clearing = gameReducer(setup, { type: 'HARD_DROP' });
    const y0 = clearing.activePiece.y;
    const ticked = gameReducer(clearing, { type: 'TICK' });
    expect(ticked).toBe(clearing);
    expect(ticked.activePiece.y).toBe(y0);
  });

  it('FINISH_CLEAR removes rows, scores, and spawns next piece', () => {
    const setup = fullBoardSetup();
    const clearing = gameReducer(setup, { type: 'HARD_DROP' });
    const s2 = gameReducer(clearing, { type: 'FINISH_CLEAR' });
    expect(s2.phase).toBe('playing');
    expect(s2.clearingRows).toEqual([]);
    expect(s2.score).toBeGreaterThan(setup.score);
    expect(s2.lines).toBeGreaterThan(0);
    expect(['I','O','T','S','Z','J','L']).toContain(s2.activePiece.type);
  });

  it('FINISH_CLEAR triggers game over if the new piece cannot spawn', () => {
    // Hand-craft a 'clearing' state directly rather than routing through
    // HARD_DROP, so the test doesn't depend on randomized piece type or
    // ghostY. Row 19 is the only row about to be cleared; rows 0-3 are
    // packed solid, so after the clear shifts everything down by 1 row,
    // rows 1-3 are still packed and block the T piece's spawn cells.
    const s = startedState();
    const packedRow = () => Array(10).fill(1);
    const board = s.board.map((row, i) => (i === 19 || i <= 3) ? packedRow() : row);
    const clearingState = { ...s, board, clearingRows: [19], phase: 'clearing', nextPiece: 'T' };
    const s2 = gameReducer(clearingState, { type: 'FINISH_CLEAR' });
    expect(s2.phase).toBe('gameover');
  });
});
```

Also update the `INITIAL_STATE` describe block (lines 9-18) to add a check for the new field — append this test inside the existing `describe('INITIAL_STATE', ...)` block:

```js
  it('clearingRows is empty', () => {
    expect(INITIAL_STATE.clearingRows).toEqual([]);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/gameReducer.test.js`
Expected: FAIL — `clearingRows` is undefined, `phase` is `'gameover'` or `'playing'` instead of `'clearing'`, `FINISH_CLEAR` is an unhandled action type.

- [ ] **Step 3: Implement the reducer changes**

In `src/gameReducer.js`:

1. Add `clearingRows: []` to `INITIAL_STATE`:

```js
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
  clearingRows: [],
};
```

2. Replace the `clearLines` function with two helpers — one that only detects full rows, one that removes a given set of rows:

```js
// Row indices (0-based) that are completely filled
function findFullRows(board) {
  const rows = [];
  board.forEach((row, i) => {
    if (row.every(cell => cell !== 0)) rows.push(i);
  });
  return rows;
}

// Remove the given row indices, prepend empty rows to keep board height
function removeRows(board, rowIndices) {
  const toRemove = new Set(rowIndices);
  const remaining = board.filter((_, i) => !toRemove.has(i));
  const empty = Array.from({ length: rowIndices.length }, () => Array(BOARD_COLS).fill(0));
  return [...empty, ...remaining];
}
```

3. Replace `afterLock` with a version that defers clearing, plus a new `finishClear`:

```js
// Locks the active piece; defers to 'clearing' phase if any rows completed,
// otherwise spawns the next piece immediately (mirrors pre-flash behavior).
function afterLock(state) {
  const { activePiece, board, nextPiece, bag } = state;
  const lockedBoard = lockPiece(board, activePiece.type, activePiece.rotation, activePiece.x, activePiece.y);
  const fullRows = findFullRows(lockedBoard);

  if (fullRows.length > 0) {
    return { ...state, board: lockedBoard, clearingRows: fullRows, phase: 'clearing' };
  }

  const newActive = spawnPiece(nextPiece);
  const { piece: newNext, bag: newBag } = drawFromBag(bag);

  if (collides(lockedBoard, newActive.type, newActive.rotation, newActive.x, newActive.y)) {
    return { ...state, board: lockedBoard, phase: 'gameover' };
  }

  return {
    ...state,
    board: lockedBoard,
    activePiece: newActive,
    ghostY: computeGhostY(lockedBoard, newActive.type, newActive.rotation, newActive.x, newActive.y),
    bag: newBag,
    nextPiece: newNext,
    phase: 'playing',
  };
}

// Removes previously-detected full rows, applies score/lines/level, spawns next piece
function finishClear(state) {
  const { board, clearingRows, nextPiece, bag, score, level, lines } = state;
  const newBoard = removeRows(board, clearingRows);
  const linesCleared = clearingRows.length;

  const scorePerClear = SCORE_TABLE[linesCleared] ?? SCORE_TABLE[4];
  const newScore = score + scorePerClear * level;
  const newLines = lines + linesCleared;
  const newLevel = Math.floor(newLines / 10) + 1;

  const newActive = spawnPiece(nextPiece);
  const { piece: newNext, bag: newBag } = drawFromBag(bag);

  if (collides(newBoard, newActive.type, newActive.rotation, newActive.x, newActive.y)) {
    return {
      ...state,
      board: newBoard,
      score: newScore,
      lines: newLines,
      level: newLevel,
      clearingRows: [],
      phase: 'gameover',
    };
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
    clearingRows: [],
    phase: 'playing',
  };
}
```

4. Update the top-level guard clause to also allow `FINISH_CLEAR` outside `'playing'`:

```js
export function gameReducer(state, action) {
  // Only START, PAUSE, and FINISH_CLEAR work outside of playing
  if (
    state.phase !== 'playing' &&
    action.type !== 'START' &&
    action.type !== 'PAUSE' &&
    action.type !== 'FINISH_CLEAR'
  ) {
    return state;
  }
  ...
```

5. Add the `FINISH_CLEAR` case to the `switch`, and update `START` to include `clearingRows: []`:

```js
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
        clearingRows: [],
      };
    }
```

```js
    case 'FINISH_CLEAR': {
      return finishClear(state);
    }
```

Note: `BOARD_ROWS` import is still used by `emptyBoard`; `removeRows` no longer needs `BOARD_ROWS` directly (it derives row count from `board.length`), only `BOARD_COLS` for the empty-row width — leave the existing import line unchanged since `BOARD_ROWS` is still used elsewhere in the file (`emptyBoard`, `lockPiece` bounds check).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/gameReducer.test.js`
Expected: All tests PASS, including the 4 new/changed line-clearing tests and the `clearingRows is empty` test.

- [ ] **Step 5: Commit**

```bash
git add src/gameReducer.js src/gameReducer.test.js
git commit -m "feat: defer line clearing behind a 'clearing' phase"
```

---

### Task 3: Add `useLineClearTimer` hook and wire it into `Tetris.jsx`

**Files:**
- Create: `src/hooks/useLineClearTimer.js`
- Modify: `src/components/Tetris.jsx`

**Interfaces:**
- Consumes: `FLASH_DURATION_MS` from `../constants.js` (Task 1); `phase`, `clearingRows` from reducer state (Task 2).
- Produces: `useLineClearTimer(dispatch, phase, clearingRows)` — no return value, side-effect only. Called from `Tetris.jsx` alongside `useGameLoop`/`useInput`.

- [ ] **Step 1: Create the hook**

Create `src/hooks/useLineClearTimer.js`:

```js
import { useEffect, useRef } from 'react';
import { FLASH_DURATION_MS } from '../constants.js';

// Fires dispatch({ type: 'FINISH_CLEAR' }) once, FLASH_DURATION_MS after
// entering the 'clearing' phase.
export function useLineClearTimer(dispatch, phase, clearingRows) {
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  useEffect(() => {
    if (phase !== 'clearing' || clearingRows.length === 0) return;
    const id = setTimeout(() => dispatchRef.current({ type: 'FINISH_CLEAR' }), FLASH_DURATION_MS);
    return () => clearTimeout(id);
  }, [phase, clearingRows]);
}
```

- [ ] **Step 2: Wire the hook into `Tetris.jsx`**

In `src/components/Tetris.jsx`, update the imports and hook calls:

```js
import { useReducer } from 'react';
import { gameReducer, INITIAL_STATE } from '../gameReducer.js';
import { useGameLoop } from '../hooks/useGameLoop.js';
import { useInput } from '../hooks/useInput.js';
import { useLineClearTimer } from '../hooks/useLineClearTimer.js';
import Board from './Board.jsx';
import Sidebar from './Sidebar.jsx';
```

```js
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const { board, activePiece, ghostY, nextPiece, score, level, lines, phase, clearingRows } = state;

  useGameLoop(dispatch, phase, level);
  useInput(dispatch);
  useLineClearTimer(dispatch, phase, clearingRows);
```

And pass `clearingRows` to `Board`:

```js
        <Board board={board} activePiece={activePiece} ghostY={ghostY} clearingRows={clearingRows} />
```

- [ ] **Step 3: Manually verify no regressions**

Run: `npm run dev`, open the app, press R to start, and play until a line clears. Confirm the game still locks/clears (visual flash comes in Task 4 — for now just confirm no crash and the line eventually disappears after ~400ms with no visual change yet).

Expected: no console errors; board freezes briefly then the row(s) vanish and next piece appears.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useLineClearTimer.js src/components/Tetris.jsx
git commit -m "feat: add useLineClearTimer hook and wire into Tetris"
```

---

### Task 4: Render the white flash on clearing rows in `Board.jsx`

**Files:**
- Modify: `src/components/Board.jsx`

**Interfaces:**
- Consumes: new `clearingRows` prop (`number[]`) passed from `Tetris.jsx` (Task 3).
- Produces: no new exports; purely visual change to `Board`'s rendering.

- [ ] **Step 1: Update `Board.jsx` to accept and use `clearingRows`**

In `src/components/Board.jsx`, update `cellClass` to take a flashing flag, and update the component:

```js
function cellClass({ color, ghost }, isClearing) {
  if (isClearing) return 'bg-white transition-colors duration-300';
  if (color === 0) return 'bg-gray-800 border border-gray-700';
  if (ghost) return `${GHOST_CLASSES[color]} bg-transparent opacity-40`;
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
```

- [ ] **Step 2: Manually verify the flash renders**

Run: `npm run dev`, play until a line completes. Confirm the completed row(s) turn white and fade/hold briefly before disappearing, and that the board is unresponsive to input during that ~400ms window.

Expected: visible white flash on the completed row(s), board frozen, then row(s) removed and play resumes.

- [ ] **Step 3: Run the full test suite**

Run: `npx vitest run`
Expected: All existing tests (constants, gameReducer, tetrominoes) PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/Board.jsx
git commit -m "feat: flash completed rows white before they clear"
```

---

## Self-Review Notes

- **Spec coverage:** State machine (Task 2), timing/hook (Task 3), visuals (Task 4), constant (Task 1), testing plan including deferred-scoring test, FINISH_CLEAR test, freeze test, and game-over-during-clear test (all in Task 2) — all spec sections covered. Game-over screen and next-piece preview are explicitly out of scope per the spec and untouched.
- **Type consistency:** `clearingRows` is `number[]` everywhere (reducer state, hook param, Board prop). `FINISH_CLEAR` action type string matches between reducer switch, guard clause, and hook dispatch. `FLASH_DURATION_MS` name matches between constants.js and the hook's import.
- **No placeholders:** every step has complete, exact code.
