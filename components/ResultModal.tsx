'use client';

import { shareResult } from '@/lib/share';

interface ResultModalProps {
  score: number;
  maxCombo: number;
  totalLinesCleared: number;
  highScore: number;
  isNewRecord: boolean;
  onRestart: () => void;
  onTitle: () => void;
}

export default function ResultModal({
  score,
  maxCombo,
  totalLinesCleared,
  highScore,
  isNewRecord,
  onRestart,
  onTitle,
}: ResultModalProps) {
  const handleShare = () => {
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    shareResult(score, maxCombo, totalLinesCleared, url);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl p-8 mx-4 max-w-sm w-full text-center">
        <h2 className="text-3xl font-black text-white mb-2">GAME OVER</h2>

        {isNewRecord && (
          <div className="text-yellow-400 text-lg font-bold mb-4 animate-pulse">
            NEW RECORD!
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center px-4">
            <span className="text-gray-400">Score</span>
            <span className="text-2xl font-bold text-white">
              {score.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center px-4">
            <span className="text-gray-400">Max Combo</span>
            <span className="text-xl font-bold text-yellow-400">{maxCombo}</span>
          </div>
          <div className="flex justify-between items-center px-4">
            <span className="text-gray-400">Lines</span>
            <span className="text-xl font-bold text-white">{totalLinesCleared}</span>
          </div>
          <div className="flex justify-between items-center px-4 border-t border-slate-600 pt-3">
            <span className="text-gray-400">Hi-Score</span>
            <span className="text-lg font-bold text-white">
              {highScore.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors"
          >
            Share
          </button>
          <button
            onClick={onRestart}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl transition-colors"
          >
            もう1回
          </button>
          <button
            onClick={onTitle}
            className="w-full py-3 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl transition-colors"
          >
            タイトルへ
          </button>
        </div>
      </div>
    </div>
  );
}
