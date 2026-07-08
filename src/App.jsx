import Tetris from './components/Tetris.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-pink-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <Tetris />
      </div>
      <footer className="sticky bottom-0 w-full text-center text-pink-100 py-2 text-sm">
        made w/ &lt;3 in sf
      </footer>
    </div>
  );
}
