let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(
  startFreq: number,
  endFreq: number,
  duration: number,
  type: OscillatorType = 'square'
): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported
  }
}

/** ブロック選択 - 短いクリック音 */
export function playSelect(): void {
  playTone(600, 600, 0.05);
}

/** ブロック移動 - スライド音 */
export function playMove(): void {
  playTone(400, 500, 0.1, 'sine');
}

/** ライン消去 - 爽快な消去音 */
export function playClear(combo: number = 1): void {
  const baseFreq = 800 + (combo - 1) * 200;
  playTone(baseFreq, baseFreq * 2, 0.2, 'sine');
}

/** 抜き取り - ポップ音 */
export function playExtract(): void {
  playTone(500, 800, 0.1, 'sine');
}

/** 挿入 - 逆ポップ音 */
export function playInsert(): void {
  playTone(800, 500, 0.1, 'sine');
}

/** ゲームオーバー - 低い崩壊音 */
export function playGameOver(): void {
  playTone(300, 50, 0.5, 'sawtooth');
}
