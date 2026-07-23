// フッター協賛枠に表示するスポンサー一覧。
// 契約が決まったらここに追加する(空のあいだは協賛枠自体が描画されない)。
export type Sponsor = {
  name: string;
  /** リンクは個別相談の企業・団体協賛のみ設定する */
  url?: string;
  /** goldはフッターで先頭+金色の強調表示になる */
  plan?: "silver" | "gold" | "corporate";
};

export const sponsors: Sponsor[] = [];

/** フッター表示用: gold を先頭に並べる */
export function sortedSponsors(): Sponsor[] {
  const order = { gold: 0, corporate: 1, silver: 2 } as const;
  return [...sponsors].sort(
    (a, b) => (order[a.plan ?? "silver"] ?? 9) - (order[b.plan ?? "silver"] ?? 9)
  );
}
