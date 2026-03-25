/** ブロックの色（5色+null=空） */
export type BlockColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | null;

/** 色のCSS値マッピング */
export const COLOR_MAP: Record<Exclude<BlockColor, null>, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#EAB308',
  purple: '#A855F7',
};

/** グリッドサイズ */
export const ROWS = 12;
export const COLS = 6;

/** ゲーム状態 */
export interface StackState {
  phase: 'title' | 'playing' | 'animating' | 'game-over';
  grid: BlockColor[][];          // grid[row][col], row=0が最上行
  selected: { row: number; col: number } | null;
  stock: BlockColor[];           // 最大3個
  score: number;
  combo: number;                 // 現在の連鎖数（連鎖中のみ>0）
  maxCombo: number;              // 最大連鎖数（結果表示用）
  highScore: number;
  movesSinceLastRise: number;    // せり上がりカウンター
  totalLinesCleared: number;     // 累計消去行数
  insertTarget: number | null;   // ストックから挿入する列のインデックス
}

/** アクション */
export type StackAction =
  | { type: 'SELECT'; row: number; col: number }     // タップ: 選択
  | { type: 'DESELECT' }                              // 選択解除
  | { type: 'MOVE_LEFT' }                             // スワイプ左
  | { type: 'MOVE_RIGHT' }                            // スワイプ右
  | { type: 'EXTRACT' }                               // ダブルタップ: 抜き取り
  | { type: 'SELECT_STOCK'; index: number }           // ストック内選択
  | { type: 'INSERT'; col: number }                   // ストックから挿入
  | { type: 'CHECK_LINES' }                           // ライン消去判定
  | { type: 'APPLY_GRAVITY' }                         // 落下処理
  | { type: 'RISE' }                                  // 新行せり上がり
  | { type: 'GAME_OVER' }
  | { type: 'RESTART' };
