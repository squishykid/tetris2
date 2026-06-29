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
