// 結果記事の本文で使う新聞調の表記。表のタイムは結果ページと同じ「5:58.13」のまま使う

// 秒を「5分58秒13」の形にする(1分未満は「58秒13」)
export function formatRaceTime(seconds: number): string {
  const hundredths = Math.round(seconds * 100);
  const minutes = Math.floor(hundredths / 6000);
  const rest = hundredths - minutes * 6000;
  const sec = Math.floor(rest / 100);
  const frac = String(rest % 100).padStart(2, "0");
  return minutes > 0 ? `${minutes}分${String(sec).padStart(2, "0")}秒${frac}` : `${sec}秒${frac}`;
}

// 着差を「2秒59」の形にする(「差」は呼び出し側で付ける)
export function formatMargin(seconds: number): string {
  return formatRaceTime(seconds);
}

// 2回目以降に出す略称。「日本大学」→「日本大」のように末尾の「大学」だけを縮める
export function shortOrgName(name: string): string {
  return name.replace(/大学$/, "大");
}
