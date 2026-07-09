// src/gameReducer.test.js
import { describe, it, expect } from 'vitest';
import { INITIAL_STATE, gameReducer } from './gameReducer.js';
import { PIECES } from './tetrominoes.js';
import { PIECE_TYPES } from './constants.js';

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
  it('clearingRows is empty', () => {
    expect(INITIAL_STATE.clearingRows).toEqual([]);
  });
});

describe('START action', () => {
  it('sets phase to playing', () => {
    const s = startedState();
    expect(s.phase).toBe('playing');
  });
  it('spawns an active piece with valid type', () => {
    const s = startedState();
    expect(PIECE_TYPES).toContain(s.activePiece.type);
  });
  it('sets a nextPiece', () => {
    const s = startedState();
    expect(PIECE_TYPES).toContain(s.nextPiece);
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
    // Board should have exactly the dropped piece's cells locked
    const totalLocked = s2.board.flat().filter(c => c !== 0).length;
    expect(totalLocked).toBe(PIECES[type0].shapes[0].length);
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

  it('enters clearing phase and defers the line-clear score bonus', () => {
    const setup = fullBoardSetup();
    const s2 = gameReducer(setup, { type: 'HARD_DROP' });
    expect(s2.phase).toBe('clearing');
    expect(s2.clearingRows.length).toBeGreaterThan(0);
    expect(s2.clearingRows).toEqual(expect.arrayContaining([19]));
    const s3 = gameReducer(s2, { type: 'FINISH_CLEAR' });
    expect(s3.score).toBeGreaterThan(s2.score);
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
    expect(PIECE_TYPES).toContain(s2.activePiece.type);
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

  it('FINISH_CLEAR is a no-op outside the clearing phase', () => {
    const s = startedState();
    const s2 = gameReducer(s, { type: 'FINISH_CLEAR' });
    expect(s2).toBe(s);
  });
});
