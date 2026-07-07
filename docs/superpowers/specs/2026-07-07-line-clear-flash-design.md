# Line-clear flash design

## Context

Three features were requested: a game-over screen with final score, a next-piece preview panel, and a flashing animation on completed lines before they clear.

Investigation found the first two already exist:
- Game-over overlay with final score: `src/components/Tetris.jsx` (`phase === 'gameover'` block).
- Next-piece preview: `src/components/NextPiece.jsx`, rendered via `src/components/Sidebar.jsx`.

This spec covers only the third, unimplemented feature: flashing completed lines before removing them.

## Current behavior

`afterLock` in `src/gameReducer.js` locks a piece, calls `clearLines(board)` which immediately filters out full rows, updates score/lines/level, and spawns the next piece — all within one reducer call, one React render. There is no gap in which a "line about to clear" state is visible.

## Design

### State machine

Split line clearing into two steps using a new `phase: 'clearing'`:

1. On lock, if any rows are full, don't remove them yet. Store which rows are full and freeze the game (reuse the existing phase-gating: `useGameLoop` already no-ops when `phase !== 'playing'`; `gameReducer`'s top-level guard already ignores most actions outside `'playing'`).
2. After a fixed delay, a timer dispatches `FINISH_CLEAR`, which performs the actual row removal, score/lines/level update, and next-piece spawn (the logic `afterLock` does today) — or transitions to `'gameover'` if the newly spawned piece collides.

This reuses the existing phase-based architecture (`idle` / `playing` / `paused` / `gameover`) rather than introducing a parallel animation system.

### `gameReducer.js` changes

- `INITIAL_STATE` gains `clearingRows: []`.
- `afterLock` splits into:
  - Row-detection: a helper `findFullRows(board)` returns full row indices without mutating the board.
  - If `findFullRows` is empty: behave exactly as today (spawn next piece immediately, phase `'playing'`).
  - If non-empty: return `{ ...state, board: lockedBoard, clearingRows: fullRowIndices, phase: 'clearing' }`. Score, lines, level, and next-piece spawn are **not** updated yet.
- New action `FINISH_CLEAR`: reads `state.board` and `state.clearingRows`, removes those rows and prepends empty rows (existing `clearLines`-style logic), computes score/lines/level increases, spawns the next piece via existing `spawnPiece`/`drawFromBag` logic, resets `clearingRows: []`, and sets `phase: 'playing'` (or `'gameover'` on spawn collision, matching today's `afterLock` collision check).
- The reducer's top-level guard clause (`if (state.phase !== 'playing' && action.type !== 'START' && action.type !== 'PAUSE') return state;`) adds `FINISH_CLEAR` alongside `START`/`PAUSE` as an allowed action outside `'playing'`.

### Timing and visuals

- New constant `FLASH_DURATION_MS = 400` in `src/constants.js`.
- New hook `src/hooks/useLineClearTimer.js`, mirroring `useGameLoop`'s pattern: when `phase === 'clearing'`, `setTimeout(() => dispatch({ type: 'FINISH_CLEAR' }), FLASH_DURATION_MS)`, cleared on unmount or phase change.
- `src/components/Board.jsx` accepts a new `clearingRows` prop (array of row indices). For cells whose row is in `clearingRows`, `cellClass` returns a white flash class (`bg-white transition-colors duration-300`) instead of the piece's normal color class. Because React applies this class as soon as `clearingRows` is set, the cell transitions from its piece color to white over ~300ms (CSS transition), then the row disappears entirely when `FINISH_CLEAR` removes it from `board` at 400ms — producing a "fade to white, then clear" effect.
- `src/components/Tetris.jsx` wires `state.clearingRows` into `<Board>` and calls `useLineClearTimer(dispatch, phase, state.clearingRows)` alongside the existing `useGameLoop`/`useInput` calls.
- `src/hooks/useInput.js` needs no change — dispatched actions during `'clearing'` are already no-ops via the reducer's guard clause.

### Testing

- Update the existing `gameReducer.test.js` "line clearing" test: after `HARD_DROP` completes full rows, assert `phase === 'clearing'`, `clearingRows` holds the expected indices, and `score` is still the pre-clear value (deferred, not yet incremented).
- Add tests for `FINISH_CLEAR`: dispatched against a `'clearing'`-phase state, produces the shrunk board, updated score/lines/level, a newly spawned piece, and `phase: 'playing'`.
- Add a test that `TICK` (and by extension other gameplay actions) is a no-op while `phase === 'clearing'`.
- Add a test for game-over-during-clear: if the piece spawned by `FINISH_CLEAR` collides immediately, `phase` becomes `'gameover'`.
- No dedicated tests for `useLineClearTimer` — consistent with `useGameLoop`/`useInput` having no dedicated tests today; verified manually in-browser for the visual fade.

## Out of scope

- Game-over screen and next-piece preview: already implemented, no changes planned.
- Configurable flash duration/style: hardcoded constant, not user-facing.
