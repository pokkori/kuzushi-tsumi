import { BlockColor, ROWS, COLS } from './types';

/**
 * 完成行（全マスが同色でnullでない）のインデックスを返す
 */
export function findCompletedLines(grid: BlockColor[][]): number[] {
  const completed: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    const firstColor = grid[r][0];
    if (firstColor === null) continue;
    if (grid[r].every(cell => cell === firstColor)) {
      completed.push(r);
    }
  }
  return completed;
}

/**
 * 指定行を消去（nullで埋める）
 * 返り値: 消去した行数
 */
export function clearLines(grid: BlockColor[][], lines: number[]): BlockColor[][] {
  const newGrid = grid.map(row => [...row]);
  for (const lineIndex of lines) {
    newGrid[lineIndex] = Array(COLS).fill(null);
  }
  return newGrid;
}

/**
 * 各列でnull以外のブロックを下に詰める
 * 返り値: { grid: 新グリッド, fallInfo: 各ブロックの落下距離マップ }
 */
export function applyGravity(grid: BlockColor[][]): {
  grid: BlockColor[][];
  fallInfo: Map<string, number>; // key: "row,col" → 落下マス数
} {
  const newGrid: BlockColor[][] = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(null)
  );
  const fallInfo = new Map<string, number>();

  for (let c = 0; c < COLS; c++) {
    // その列の非nullブロックを下から詰める
    let writeRow = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c] !== null) {
        newGrid[writeRow][c] = grid[r][c];
        if (writeRow !== r) {
          fallInfo.set(`${writeRow},${c}`, writeRow - r);
        }
        writeRow--;
      }
    }
  }

  return { grid: newGrid, fallInfo };
}

/**
 * 最下行に新行を追加し、全体を1行上にシフト
 * 返り値: { grid, isGameOver: 最上行にブロックがあるか }
 */
export function riseOneRow(grid: BlockColor[][]): {
  grid: BlockColor[][];
  isGameOver: boolean;
} {
  // 最上行にブロックがあるかチェック
  const isGameOver = grid[0].some(cell => cell !== null);

  const newGrid: BlockColor[][] = [];
  // 既存行を1行上にずらす（最上行は消滅）
  for (let r = 1; r < ROWS; r++) {
    newGrid.push([...grid[r]]);
  }
  // 最下行に新しいランダム行を追加
  const colors: Exclude<BlockColor, null>[] = ['red', 'blue', 'green', 'yellow', 'purple'];
  const newRow: BlockColor[] = Array.from({ length: COLS }, () =>
    colors[Math.floor(Math.random() * 5)]
  );
  newGrid.push(newRow);

  return { grid: newGrid, isGameOver };
}

/**
 * 選択中ブロックを同行内で左右に移動
 */
export function moveBlock(
  grid: BlockColor[][],
  pos: { row: number; col: number },
  dir: 'left' | 'right'
): { grid: BlockColor[][]; newPos: { row: number; col: number } } {
  const newCol = pos.col + (dir === 'left' ? -1 : 1);
  if (newCol < 0 || newCol >= COLS) return { grid, newPos: pos };

  const newGrid = grid.map(row => [...row]);
  // 交換
  const temp = newGrid[pos.row][newCol];
  newGrid[pos.row][newCol] = newGrid[pos.row][pos.col];
  newGrid[pos.row][pos.col] = temp;

  return { grid: newGrid, newPos: { row: pos.row, col: newCol } };
}

/**
 * 初期盤面で完成行がないことを確認（あれば色を入れ替え）
 */
export function ensureNoCompletedLines(grid: BlockColor[][]): BlockColor[][] {
  const newGrid = grid.map(row => [...row]);
  const colors: Exclude<BlockColor, null>[] = ['red', 'blue', 'green', 'yellow', 'purple'];

  for (let r = 0; r < ROWS; r++) {
    const firstColor = newGrid[r][0];
    if (firstColor === null) continue;
    if (newGrid[r].every(cell => cell === firstColor)) {
      // 完成行を崩す: 最後のセルの色を変える
      const otherColors = colors.filter(c => c !== firstColor);
      newGrid[r][COLS - 1] = otherColors[Math.floor(Math.random() * otherColors.length)];
    }
  }
  return newGrid;
}
