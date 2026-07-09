// src/tetrominoes.test.js
import { describe, it, expect } from 'vitest';
import {
  PIECES,
  getPieceCells,
  getPieceCellsWithClips,
  spawnPiece,
  tryRotate,
  TRIANGLE_CLIP_PATHS,
} from './tetrominoes.js';
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

describe('TRI piece', () => {
  it('has 4 rotations of 3 cells each, all inside a 2x2 box', () => {
    expect(PIECES.TRI.shapes).toHaveLength(4);
    for (const shape of PIECES.TRI.shapes) {
      expect(shape).toHaveLength(3);
      for (const [r, c] of shape) {
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThan(2);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThan(2);
      }
    }
  });

  it('has a clip code for every cell, all resolving to known clip-paths', () => {
    PIECES.TRI.shapes.forEach((shape, rot) => {
      expect(PIECES.TRI.clips[rot]).toHaveLength(shape.length);
      for (const code of PIECES.TRI.clips[rot]) {
        expect(TRIANGLE_CLIP_PATHS).toHaveProperty(code);
      }
    });
  });

  it('getPieceCellsWithClips pairs each cell with its clip code', () => {
    const cells = getPieceCellsWithClips('TRI', 0, 3, 5);
    expect(cells).toHaveLength(3);
    // rotation 0: [[0,0],[1,0],[1,1]] with clips ['LL','FULL','LL']
    expect(cells[0]).toEqual({ r: 5, c: 3, clip: 'LL' });
    expect(cells[1]).toEqual({ r: 6, c: 3, clip: 'FULL' });
    expect(cells[2]).toEqual({ r: 6, c: 4, clip: 'LL' });
  });

  it('non-triangle pieces report FULL clips', () => {
    for (const { clip } of getPieceCellsWithClips('T', 0, 0, 0)) {
      expect(clip).toBe('FULL');
    }
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
