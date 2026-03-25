import { StackState, StackAction, BlockColor, ROWS, COLS } from './types';
import {
  findCompletedLines,
  clearLines,
  applyGravity,
  riseOneRow,
  moveBlock,
  ensureNoCompletedLines,
} from './gridLogic';

function generateInitialGrid(): BlockColor[][] {
  const grid: BlockColor[][] = [];
  // 上4行は空
  for (let r = 0; r < 4; r++) {
    grid.push(Array(COLS).fill(null));
  }
  // 下8行はランダムに色を配置
  for (let r = 4; r < ROWS; r++) {
    const row: BlockColor[] = [];
    for (let c = 0; c < COLS; c++) {
      const colors: Exclude<BlockColor, null>[] = ['red', 'blue', 'green', 'yellow', 'purple'];
      row.push(colors[Math.floor(Math.random() * 5)]);
    }
    grid.push(row);
  }
  // 初期盤面で完成行がないことを確認（あれば色を入れ替え）
  return ensureNoCompletedLines(grid);
}

const STORAGE_KEY = 'stack-collapse-highscore';

export function loadHighScore(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
}

export function saveHighScore(score: number): void {
  const current = loadHighScore();
  if (score > current) {
    localStorage.setItem(STORAGE_KEY, score.toString());
  }
}

function calculateLineScore(combo: number): number {
  return 100 * combo;
}

export function createInitialState(): StackState {
  return {
    phase: 'playing',
    grid: generateInitialGrid(),
    selected: null,
    stock: [],
    score: 0,
    combo: 0,
    maxCombo: 0,
    highScore: loadHighScore(),
    movesSinceLastRise: 0,
    totalLinesCleared: 0,
    insertTarget: null,
  };
}

export function stackReducer(state: StackState, action: StackAction): StackState {
  switch (action.type) {
    case 'SELECT': {
      if (state.phase !== 'playing') return state;
      const color = state.grid[action.row][action.col];
      if (color === null) {
        // ストック選択中なら挿入
        if (state.insertTarget !== null) {
          return state;
        }
        return { ...state, selected: null };
      }
      return {
        ...state,
        selected: { row: action.row, col: action.col },
        insertTarget: null,
      };
    }

    case 'DESELECT':
      return { ...state, selected: null, insertTarget: null };

    case 'MOVE_LEFT':
    case 'MOVE_RIGHT': {
      if (state.phase !== 'playing' || !state.selected) return state;
      const dir = action.type === 'MOVE_LEFT' ? 'left' : 'right';
      const { grid, newPos } = moveBlock(state.grid, state.selected, dir);
      const newMoves = state.movesSinceLastRise + 1;

      return {
        ...state,
        grid,
        selected: newPos,
        movesSinceLastRise: newMoves,
      };
    }

    case 'EXTRACT': {
      if (state.phase !== 'playing' || !state.selected) return state;
      if (state.stock.length >= 3) return state;
      const { row, col } = state.selected;
      const color = state.grid[row][col];
      if (color === null) return state;

      const newGrid = state.grid.map(r => [...r]);
      newGrid[row][col] = null;

      return {
        ...state,
        grid: newGrid,
        stock: [...state.stock, color],
        selected: null,
      };
    }

    case 'SELECT_STOCK': {
      if (state.phase !== 'playing') return state;
      if (action.index < 0 || action.index >= state.stock.length) return state;
      return {
        ...state,
        insertTarget: action.index,
        selected: null,
      };
    }

    case 'INSERT': {
      if (state.phase !== 'playing' || state.insertTarget === null) return state;
      const stockIndex = state.insertTarget;
      const blockColor = state.stock[stockIndex];
      if (!blockColor) return state;

      const col = action.col;
      // その列の最も上にある空マスに配置
      let targetRow = -1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (state.grid[r][col] === null) {
          targetRow = r;
          break;
        }
      }
      // 列が満杯の場合は挿入不可
      if (targetRow === -1) return state;

      const newGrid = state.grid.map(r => [...r]);
      newGrid[targetRow][col] = blockColor;

      const newStock = [...state.stock];
      newStock.splice(stockIndex, 1);
      const newMoves = state.movesSinceLastRise + 1;

      return {
        ...state,
        grid: newGrid,
        stock: newStock,
        insertTarget: null,
        movesSinceLastRise: newMoves,
      };
    }

    case 'CHECK_LINES': {
      const completed = findCompletedLines(state.grid);
      if (completed.length > 0) {
        const newCombo = state.combo + 1;
        const lineScore = completed.length * calculateLineScore(newCombo);
        const newGrid = clearLines(state.grid, completed);
        return {
          ...state,
          grid: newGrid,
          phase: 'animating',
          combo: newCombo,
          maxCombo: Math.max(state.maxCombo, newCombo),
          score: state.score + lineScore,
          totalLinesCleared: state.totalLinesCleared + completed.length,
        };
      }
      return {
        ...state,
        combo: 0,
        phase: 'playing',
      };
    }

    case 'APPLY_GRAVITY': {
      const { grid, fallInfo } = applyGravity(state.grid);
      const hasFalls = fallInfo.size > 0;
      return {
        ...state,
        grid,
        phase: hasFalls ? 'animating' : 'playing',
        combo: hasFalls ? state.combo : 0,
      };
    }

    case 'RISE': {
      const { grid, isGameOver } = riseOneRow(state.grid);
      if (isGameOver) {
        saveHighScore(state.score);
        return {
          ...state,
          grid,
          phase: 'game-over',
          highScore: Math.max(state.highScore, state.score),
        };
      }
      return {
        ...state,
        grid,
        movesSinceLastRise: 0,
      };
    }

    case 'GAME_OVER': {
      saveHighScore(state.score);
      return {
        ...state,
        phase: 'game-over',
        highScore: Math.max(state.highScore, state.score),
      };
    }

    case 'RESTART':
      return createInitialState();

    default:
      return state;
  }
}
