'use client';

interface HeaderProps {
  score: number;
  combo: number;
  highScore: number;
}

export default function Header({ score, combo, highScore }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-white">
      <div className="text-center">
        <div className="text-xs text-gray-400">HI-SCORE</div>
        <div className="text-sm font-bold">{highScore.toLocaleString()}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-400">SCORE</div>
        <div className="text-2xl font-black text-yellow-400">{score.toLocaleString()}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-400">COMBO</div>
        <div className="text-sm font-bold">{combo > 0 ? combo : '-'}</div>
      </div>
    </div>
  );
}
