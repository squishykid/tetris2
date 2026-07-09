import { describe, it, expect } from 'vitest';
import { BOARD_COLS, BOARD_ROWS, PIECE_TYPES, COLORS, SCORE_TABLE, gravityDelay } from './constants.js';

describe('constants', () => {
  it('board is 10x20', () => {
    expect(BOARD_COLS).toBe(10);
    expect(BOARD_ROWS).toBe(20);
  });

  it('has 8 piece types', () => {
    expect(PIECE_TYPES).toHaveLength(8);
    expect(PIECE_TYPES).toContain('I');
    expect(PIECE_TYPES).toContain('O');
    expect(PIECE_TYPES).toContain('TRI');
  });

  it('colors maps 0-8', () => {
    expect(COLORS[0]).toBeNull();
    expect(COLORS[1]).toMatch(/cyan/);
    expect(COLORS[7]).toMatch(/orange/);
    expect(COLORS[8]).toMatch(/pink/);
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
