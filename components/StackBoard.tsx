'use client';

import { useRef, useCallback } from 'react';
import { BlockColor, ROWS, COLS } from '@/lib/types';
import Block from './Block';

interface StackBoardProps {
  grid: BlockColor[][];
  selected: { row: number; col: number } | null;
  clearingRows: number[];
  fallInfo: Map<string, number>;
  onSelect: (row: number, col: number) => void;
  onSwipe: (dir: 'left' | 'right') => void;
  onDoubleTap: () => void;
  onInsertTarget: (col: number) => void;
}

export default function StackBoard({
  grid,
  selected,
  clearingRows,
  fallInfo,
  onSelect,
  onSwipe,
  onDoubleTap,
  onInsertTarget,
}: StackBoardProps) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent, row: number, col: number) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // スワイプ判定（閾値30px）
      if (absDx > 30 && absDx > absDy) {
        onSwipe(dx < 0 ? 'left' : 'right');
        touchStartRef.current = null;
        return;
      }

      // ダブルタップ判定（300ms以内）
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        onDoubleTap();
        lastTapRef.current = 0;
        touchStartRef.current = null;
        return;
      }

      lastTapRef.current = now;
      // シングルタップ: 300ms待ち
      const tapTime = now;
      setTimeout(() => {
        if (lastTapRef.current === tapTime) {
          onSelect(row, col);
        }
      }, 300);

      touchStartRef.current = null;
    },
    [onSelect, onSwipe, onDoubleTap]
  );

  const handleClick = useCallback(
    (row: number, col: number) => {
      onInsertTarget(col);
    },
    [onInsertTarget]
  );

  return (
    <div
      className="w-full max-w-sm mx-auto"
      style={{
        touchAction: 'manipulation',
      }}
    >
      <div
        className="grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          backgroundColor: '#0F172A',
          aspectRatio: `${COLS} / ${ROWS}`,
        }}
      >
        {grid.map((row, r) =>
          row.map((color, c) => {
            const isSelected =
              selected !== null && selected.row === r && selected.col === c;
            const isClearing = clearingRows.includes(r);
            const fallKey = `${r},${c}`;
            const fallDist = fallInfo.get(fallKey) || 0;
            const isFalling = fallDist > 0;

            return (
              <div
                key={`${r}-${c}`}
                className="relative"
                style={{
                  border: '1px solid #1E293B',
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, r, c)}
                onClick={() => handleClick(r, c)}
              >
                <Block
                  color={color}
                  isSelected={isSelected}
                  isClearing={isClearing}
                  isFalling={isFalling}
                  fallDistance={fallDist}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
