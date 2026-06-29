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
