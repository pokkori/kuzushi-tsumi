export function generateShareText(score: number, maxCombo: number, lines: number): string {
  const comboStars = '\u2B50'.repeat(Math.min(maxCombo, 10));
  return `崩し積み Stack Collapse\n` +
    `Score: ${score.toLocaleString()}\n` +
    `Max Combo: ${maxCombo} ${comboStars}\n` +
    `Lines: ${lines}\n` +
    `#崩し積み #StackCollapse`;
}

export function shareResult(score: number, maxCombo: number, lines: number, url: string): void {
  const text = generateShareText(score, maxCombo, lines);

  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({
      title: '崩し積み Stack Collapse',
      text,
      url,
    }).catch(() => {
      // Fallback to Twitter
      openTwitterShare(text, url);
    });
  } else {
    openTwitterShare(text, url);
  }
}

function openTwitterShare(text: string, url: string): void {
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(tweetUrl, '_blank');
}
