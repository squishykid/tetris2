import { useReducer } from 'react';
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

function StatRow({ label, value }) {
  return (
    <div className="mb-4">
      <p className="text-gray-400 text-xs uppercase tracking-widest">{label}</p>
      <p className="text-white text-2xl font-mono font-bold">{value}</p>
    </div>
  );
}

export default function Tetris() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const { board, activePiece, ghostY, nextPiece, score, level, lines, phase } = state;

  useGameLoop(dispatch, phase, level);
  useInput(dispatch);

  return (
    <div className="flex gap-8 items-start select-none">
      {/* Left panel: score / level / lines */}
      <div className="flex flex-col w-28">
        <StatRow label="Score" value={score} />
        <StatRow label="Level" value={level} />
        <StatRow label="Lines" value={lines} />
      </div>

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

      {/* Right panel: next piece + controls */}
      <Sidebar nextPiece={nextPiece} />
    </div>
  );
}
