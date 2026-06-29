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

  const scorePerClear = SCORE_TABLE[linesCleared] ?? SCORE_TABLE[4];
  const newScore = score + (linesCleared > 0 ? scorePerClear * level : 0);
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
