'use client';

import { BlockColor, COLOR_MAP } from '@/lib/types';

interface StockBarProps {
  stock: BlockColor[];            // 最大3個
  selectedStockIndex: number | null;
  onSelectStock: (index: number) => void;
}

export default function StockBar({ stock, selectedStockIndex, onSelectStock }: StockBarProps) {
  const slots = [0, 1, 2];

  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <span className="text-xs text-gray-400 mr-2">STOCK</span>
      {slots.map((i) => {
        const color = stock[i] || null;
        const isSelected = selectedStockIndex === i;

        return (
          <button
            key={i}
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={
              color
                ? {
                    backgroundColor: COLOR_MAP[color],
                    border: isSelected ? '2px solid #FBBF24' : '2px solid #334155',
                    boxShadow: isSelected ? '0 0 10px #FBBF24' : 'none',
                    animation: isSelected ? 'pulse 1s infinite' : 'none',
                  }
                : {
                    border: '2px dashed #4B5563',
                    backgroundColor: 'transparent',
                  }
            }
            onClick={() => {
              if (color) onSelectStock(i);
            }}
            disabled={!color}
          >
            {color && (
              <div
                className="w-3/4 h-3/4 rounded-sm"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
