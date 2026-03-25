'use client';

interface ComboDisplayProps {
  combo: number;
  isActive: boolean;
}

export default function ComboDisplay({ combo, isActive }: ComboDisplayProps) {
  if (!isActive || combo < 2) return null;

  const sizeClass = combo >= 4 ? 'text-4xl' : combo === 3 ? 'text-3xl' : 'text-2xl';

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <div
        className={`${sizeClass} font-black text-yellow-400 drop-shadow-lg`}
        style={{
          animation: 'combo-display 0.8s ease-out forwards',
          textShadow: '0 0 20px rgba(251, 191, 36, 0.8)',
        }}
      >
        🔥 {combo} COMBO!
      </div>
    </div>
  );
}
