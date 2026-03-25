'use client';

import { BlockColor, COLOR_MAP } from '@/lib/types';

interface BlockProps {
  color: BlockColor;
  isSelected: boolean;
  isClearing: boolean;   // 消去アニメーション中
  isFalling: boolean;    // 落下アニメーション中
  fallDistance: number;   // 落下マス数（アニメーション用）
}

export default function Block({ color, isSelected, isClearing, isFalling, fallDistance }: BlockProps) {
  if (color === null) {
    return <div className="w-full h-full" />;
  }

  const bgColor = COLOR_MAP[color];

  const style: React.CSSProperties = {
    backgroundColor: bgColor,
    borderRadius: '4px',
    transition: 'transform 0.3s ease',
    ...(isSelected
      ? {
          border: '2px solid #FBBF24',
          boxShadow: '0 0 10px #FBBF24',
        }
      : {}),
    ...(isClearing
      ? {
          animation: 'block-clear 0.4s ease-out forwards',
        }
      : {}),
    ...(isFalling
      ? {
          animation: `block-fall 0.3s ease-in`,
          '--fall-distance': `-${fallDistance * 100}%`,
        } as React.CSSProperties
      : {}),
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={style}
    >
      <div
        className="w-3/4 h-3/4 rounded-sm"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)`,
        }}
      />
    </div>
  );
}
