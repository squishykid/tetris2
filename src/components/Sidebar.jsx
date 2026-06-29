import NextPiece from './NextPiece.jsx';

export default function Sidebar({ nextPiece }) {
  return (
    <div className="flex flex-col gap-6 w-28">
      <NextPiece type={nextPiece} />
      <div className="mt-4">
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Controls</p>
        <ul className="text-gray-500 text-xs space-y-0.5">
          <li>← → Move</li>
          <li>↓ Soft drop</li>
          <li>↑ / X Rotate</li>
          <li>Space Hard drop</li>
          <li>P Pause</li>
          <li>R Restart</li>
        </ul>
      </div>
    </div>
  );
}
