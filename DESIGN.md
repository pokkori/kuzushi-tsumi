# 崩し積み（Stack Collapse） 詳細設計書

## 概要
6列x12行のグリッドでブロックを操作し、同色の横1行を揃えて消すパズルゲーム。
ブロックの抜き取り・挿入によるストック機能が戦略性の核。

---

## 1. 技術スタック

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- DOM ベース描画（CSS Grid + transform アニメーション）
- localStorage でハイスコア永続化
- Web Audio API で効果音
- @vercel/og でOGP動的生成

---

## 2. 画面遷移

```
タイトル画面 → [プレイ開始] → ゲームプレイ画面 → [ゲームオーバー] → 結果画面 → [もう1回/タイトルへ]
```

---

## 3. ファイル構成

```
崩し積み/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # タイトル画面
│   ├── globals.css
│   ├── play/page.tsx         # ゲーム本体
│   └── api/og/route.tsx      # OGP動的生成
├── components/
│   ├── StackBoard.tsx        # 6x12グリッド描画+操作ハンドリング
│   ├── Block.tsx             # 個別ブロック（色+アニメーション）
│   ├── StockBar.tsx          # ストック欄（最大3個）
│   ├── ComboDisplay.tsx      # コンボ数表示（フロート演出）
│   ├── Header.tsx            # スコア+コンボ+ハイスコア
│   └── ResultModal.tsx       # ゲームオーバー画面
├── lib/
│   ├── stackReducer.ts       # useReducer用reducer
│   ├── gridLogic.ts          # 移動+消去+落下+連鎖判定+せり上がり
│   ├── sound.ts              # 効果音
│   └── share.ts              # シェア機能
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── DESIGN.md
```

---

## 4. 型定義

```typescript
// lib/types.ts

/** ブロックの色（5色+null=空） */
type BlockColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | null;

/** 色のCSS値マッピング */
const COLOR_MAP: Record<Exclude<BlockColor, null>, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#EAB308',
  purple: '#A855F7',
};

/** グリッドサイズ */
const ROWS = 12;
const COLS = 6;

/** ゲーム状態 */
interface StackState {
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
type StackAction =
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
```

---

## 5. コンポーネント詳細設計

### 5.1 app/play/page.tsx
- `useReducer(stackReducer, initialState)` でゲーム状態管理
- タッチ/クリックイベントをStackBoardに委譲
- アニメーション中は入力無視（`phase === 'animating'`）

### 5.2 StackBoard.tsx
```typescript
interface StackBoardProps {
  grid: BlockColor[][];
  selected: { row: number; col: number } | null;
  onSelect: (row: number, col: number) => void;
  onSwipe: (dir: 'left' | 'right') => void;
  onDoubleTap: () => void;
  onInsertTarget: (col: number) => void;
}
```

**描画:**
- CSS Grid: `grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(12, 1fr)`
- ブロックサイズ: `(画面幅 - 32px) / 6`（正方形）
- グリッド背景: 深い紺色 `#0F172A`
- グリッド線: `border: 1px solid #1E293B`

**タッチハンドリング:**
- シングルタップ: 300ms待ちでダブルタップと区別
- ダブルタップ: 300ms以内に2回タップ
- スワイプ: `touchstart` → `touchend` の差分で判定（閾値30px）
- 選択中にスワイプ → `MOVE_LEFT` / `MOVE_RIGHT`
- 未選択時にタップ → `SELECT`

### 5.3 Block.tsx
```typescript
interface BlockProps {
  color: BlockColor;
  isSelected: boolean;
  isClearing: boolean;   // 消去アニメーション中
  isFalling: boolean;    // 落下アニメーション中
  fallDistance: number;   // 落下マス数（アニメーション用）
}
```

**CSS:**
- 基本: `border-radius: 4px; transition: transform 0.3s ease`
- 選択中: `border: 2px solid #FBBF24; box-shadow: 0 0 10px #FBBF24`（黄色枠）
- 消去: `animation: block-clear 0.4s ease-out forwards`（scale(1)→scale(0)+opacity(0)）
- 落下: `animation: block-fall 0.3s ease-in`（translateY(-{fallDistance*cellSize}px) → translateY(0)）

### 5.4 StockBar.tsx
```typescript
interface StockBarProps {
  stock: BlockColor[];            // 最大3個
  selectedStockIndex: number | null;
  onSelectStock: (index: number) => void;
}
```

**描画:**
- 横並び3スロット。空スロット=灰色点線枠
- 選択中のストック=黄色枠+パルスアニメーション
- ストック選択後、ボード上の列をタップで挿入先指定

### 5.5 ComboDisplay.tsx
```typescript
interface ComboDisplayProps {
  combo: number;
  isActive: boolean;
}
```
- combo >= 2 のとき表示
- `🔥 {combo} COMBO!` テキスト
- 画面中央に大きく表示 → 0.5秒でフェードアウト
- コンボ数に応じてフォントサイズ増加（2=2xl, 3=3xl, 4+=4xl）

### 5.6 ResultModal.tsx
- スコア、最大コンボ、消去行数を表示
- ハイスコア更新時に「NEW RECORD!」表示
- シェアボタン、もう1回ボタン

---

## 6. ロジック詳細設計

### 6.1 lib/stackReducer.ts

**初期盤面生成:**
```typescript
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
```

**Reducer処理フロー:**

```
SELECT → 選択状態をセット
MOVE_LEFT/MOVE_RIGHT → 選択中ブロックを同行内で隣接マスと交換
  → 交換先がnullの場合: ブロックが移動（元の位置はnull）
  → 交換先が色ありの場合: 2つのブロックを入れ替え
  → 移動後、movesSinceLastRise++
  → movesSinceLastRise >= 3 → RISE発火
  → CHECK_LINES発火

EXTRACT → 選択中ブロックをストックに移動（stock.length < 3の場合のみ）
  → 元の位置はnull
  → APPLY_GRAVITY発火（上のブロックが落ちる）
  → CHECK_LINES発火

SELECT_STOCK → ストック内ブロックを選択状態に
INSERT(col) → ストック選択中のブロックを指定列の最上部に挿入
  → その列の最も上にある空マスに配置
  → ストックから削除
  → CHECK_LINES発火
  → movesSinceLastRise++

CHECK_LINES → 横1行が全て同色かチェック
  → 該当行があれば: phase='animating', combo++
  → 0.4秒後にAPPLY_GRAVITYを発火（アニメーション完了待ち）
  → 該当行なし: combo=0, phase='playing'

APPLY_GRAVITY → null以外のブロックを下に詰める
  → 落下があれば: 0.3秒後にCHECK_LINES再発火（連鎖チェック）
  → 落下なし: combo=0, phase='playing'

RISE → 最下行に新しいランダム色行を追加、全ブロックを1行上にずらす
  → 最上行にブロックがある場合: GAME_OVER
  → movesSinceLastRise = 0
```

### 6.2 lib/gridLogic.ts

**ライン消去判定:**
```typescript
/**
 * 完成行（全マスが同色でnullでない）のインデックスを返す
 */
function findCompletedLines(grid: BlockColor[][]): number[] {
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
```

**行消去実行:**
```typescript
/**
 * 指定行を消去（nullで埋める）
 * 返り値: 消去した行数
 */
function clearLines(grid: BlockColor[][], lines: number[]): BlockColor[][] {
  const newGrid = grid.map(row => [...row]);
  for (const lineIndex of lines) {
    newGrid[lineIndex] = Array(COLS).fill(null);
  }
  return newGrid;
}
```

**重力適用（落下）:**
```typescript
/**
 * 各列でnull以外のブロックを下に詰める
 * 返り値: { grid: 新グリッド, fallInfo: 各ブロックの落下距離マップ }
 */
function applyGravity(grid: BlockColor[][]): {
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
```

**せり上がり:**
```typescript
/**
 * 最下行に新行を追加し、全体を1行上にシフト
 * 返り値: { grid, isGameOver: 最上行にブロックがあるか }
 */
function riseOneRow(grid: BlockColor[][]): {
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
```

**ブロック移動（同行内左右）:**
```typescript
/**
 * 選択中ブロックを同行内で左右に移動
 */
function moveBlock(
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
```

---

## 7. スコア計算詳細

```typescript
function calculateLineScore(combo: number, usedStock: boolean): number {
  // 基本: 100pt
  // 連鎖ボーナス: N連鎖目 = 100 × N
  // ストックボーナス: +50pt
  const base = 100 * combo;
  const stockBonus = usedStock ? 50 : 0;
  return base + stockBonus;
}
```

---

## 8. アニメーションタイミング

| イベント | アニメーション | 時間 | 次のアクション |
|---|---|---|---|
| ブロック移動 | translateX | 0.15s | CHECK_LINES |
| ライン消去 | scale(0) + opacity(0) | 0.4s | APPLY_GRAVITY |
| ブロック落下 | translateY | 0.3s | CHECK_LINES（連鎖チェック） |
| せり上がり | translateY(全体) | 0.5s | CHECK_LINES |
| コンボ表示 | scale(0→1) + fadeOut | 0.8s | - |

**アニメーション制御:**
- `phase: 'animating'` の間は入力を無視
- `setTimeout` でアニメーション完了後にdispatch
- 連鎖チェックは再帰的に実行（消去→落下→再チェック→...→連鎖終了）

---

## 9. 効果音

| イベント | 音の特徴 | 周波数 | 長さ |
|---|---|---|---|
| ブロック選択 | 短いクリック音 | 600Hz | 0.05s |
| ブロック移動 | スライド音 | 400→500Hz | 0.1s |
| ライン消去 | 爽快な消去音 | 800→1600Hz | 0.2s |
| 連鎖 | 消去音の音程が上がる | +200Hz/連鎖 | 0.2s |
| 抜き取り | ポップ音 | 500→800Hz | 0.1s |
| 挿入 | 逆ポップ音 | 800→500Hz | 0.1s |
| ゲームオーバー | 低い崩壊音 | 300→50Hz | 0.5s |

---

## 10. シェアテキスト

```typescript
function generateShareText(score: number, maxCombo: number, lines: number): string {
  const comboStars = '⭐'.repeat(Math.min(maxCombo, 10));
  return `崩し積み Stack Collapse\n` +
    `Score: ${score.toLocaleString()}\n` +
    `Max Combo: ${maxCombo} ${comboStars}\n` +
    `Lines: ${lines}\n` +
    `#崩し積み #StackCollapse`;
}
```

---

## 11. localStorage設計

```typescript
const STORAGE_KEY = 'stack-collapse-highscore';

function loadHighScore(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
}

function saveHighScore(score: number): void {
  const current = loadHighScore();
  if (score > current) {
    localStorage.setItem(STORAGE_KEY, score.toString());
  }
}
```

---

## 12. パフォーマンス注意事項

1. **アニメーション中の状態管理**: `phase: 'animating'` で入力ブロック。setTimeout完了後にphase復帰。連鎖中は複数のsetTimeoutがチェーン実行される。
2. **CSS transitionとReact再レンダリング**: Blockコンポーネントはkeyを`${row}-${col}-${color}`にして不要な再マウントを防ぐ。落下アニメーションはCSS transitionの`transform`で実現。
3. **タッチイベント**: ダブルタップ検知は300msのタイマーで実装。iOS Safariのダブルタップズームを`touch-action: manipulation`で防止。
