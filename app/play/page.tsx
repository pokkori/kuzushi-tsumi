'use client';

import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { stackReducer, createInitialState } from '@/lib/stackReducer';
import { findCompletedLines, applyGravity } from '@/lib/gridLogic';
import { playSelect, playMove, playClear, playExtract, playInsert, playGameOver } from '@/lib/sound';
import StackBoard from '@/components/StackBoard';
import StockBar from '@/components/StockBar';
import ComboDisplay from '@/components/ComboDisplay';
import Header from '@/components/Header';
import ResultModal from '@/components/ResultModal';

export default function PlayPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(stackReducer, undefined, createInitialState);
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [fallInfo, setFallInfo] = useState<Map<string, number>>(new Map());
  const [comboActive, setComboActive] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const animatingRef = useRef(false);

  // CHECK_LINES後のアニメーション制御
  useEffect(() => {
    if (state.phase === 'playing' && !animatingRef.current) {
      // ライン消去チェック
      const completed = findCompletedLines(state.grid);
      if (completed.length > 0) {
        animatingRef.current = true;
        setClearingRows(completed);
        dispatch({ type: 'CHECK_LINES' });
        playClear(state.combo + 1);

        // コンボ表示
        if (state.combo + 1 >= 2) {
          setComboActive(true);
          setTimeout(() => setComboActive(false), 800);
        }

        // 0.4秒後に重力適用
        setTimeout(() => {
          setClearingRows([]);
          const gravityResult = applyGravity(state.grid);
          setFallInfo(gravityResult.fallInfo);
          dispatch({ type: 'APPLY_GRAVITY' });

          // 0.3秒後に連鎖チェック
          setTimeout(() => {
            setFallInfo(new Map());
            animatingRef.current = false;
          }, 300);
        }, 400);
      }
    }
  }, [state.grid, state.phase, state.combo]);

  // せり上がりチェック
  useEffect(() => {
    if (state.movesSinceLastRise >= 3 && state.phase === 'playing') {
      dispatch({ type: 'RISE' });
    }
  }, [state.movesSinceLastRise, state.phase]);

  // ゲームオーバー検知
  useEffect(() => {
    if (state.phase === 'game-over') {
      playGameOver();
      setIsNewRecord(state.score > 0 && state.score >= state.highScore);
    }
  }, [state.phase, state.score, state.highScore]);

  const handleSelect = useCallback(
    (row: number, col: number) => {
      if (state.phase !== 'playing' && state.phase !== 'animating') return;
      if (animatingRef.current) return;

      // ストック選択中なら挿入
      if (state.insertTarget !== null) {
        dispatch({ type: 'INSERT', col });
        playInsert();
        return;
      }

      dispatch({ type: 'SELECT', row, col });
      playSelect();
    },
    [state.phase, state.insertTarget]
  );

  const handleSwipe = useCallback(
    (dir: 'left' | 'right') => {
      if (state.phase !== 'playing' || animatingRef.current) return;
      if (!state.selected) return;
      dispatch(dir === 'left' ? { type: 'MOVE_LEFT' } : { type: 'MOVE_RIGHT' });
      playMove();
    },
    [state.phase, state.selected]
  );

  const handleDoubleTap = useCallback(() => {
    if (state.phase !== 'playing' || animatingRef.current) return;
    if (!state.selected) return;
    dispatch({ type: 'EXTRACT' });
    playExtract();
  }, [state.phase, state.selected]);

  const handleInsertTarget = useCallback(
    (col: number) => {
      if (state.insertTarget !== null) {
        dispatch({ type: 'INSERT', col });
        playInsert();
      }
    },
    [state.insertTarget]
  );

  const handleSelectStock = useCallback(
    (index: number) => {
      if (state.phase !== 'playing' || animatingRef.current) return;
      dispatch({ type: 'SELECT_STOCK', index });
      playSelect();
    },
    [state.phase]
  );

  const handleRestart = useCallback(() => {
    animatingRef.current = false;
    setClearingRows([]);
    setFallInfo(new Map());
    setComboActive(false);
    dispatch({ type: 'RESTART' });
  }, []);

  const handleTitle = useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header score={state.score} combo={state.combo} highScore={state.highScore} />

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <StackBoard
          grid={state.grid}
          selected={state.selected}
          clearingRows={clearingRows}
          fallInfo={fallInfo}
          onSelect={handleSelect}
          onSwipe={handleSwipe}
          onDoubleTap={handleDoubleTap}
          onInsertTarget={handleInsertTarget}
        />

        <StockBar
          stock={state.stock}
          selectedStockIndex={state.insertTarget}
          onSelectStock={handleSelectStock}
        />

        {state.insertTarget !== null && (
          <p className="text-xs text-yellow-400 mt-1 animate-pulse">
            挿入先の列をタップしてください
          </p>
        )}
      </div>

      <ComboDisplay combo={state.combo} isActive={comboActive} />

      {state.phase === 'game-over' && (
        <ResultModal
          score={state.score}
          maxCombo={state.maxCombo}
          totalLinesCleared={state.totalLinesCleared}
          highScore={state.highScore}
          isNewRecord={isNewRecord}
          onRestart={handleRestart}
          onTitle={handleTitle}
        />
      )}
    </div>
  );
}
