// 大会結果ページ(/results/[year]/[competition])のクラス文字列の単一ソース。
// 色は rn-* トークンと、検索ページと同じ順位バッジ色だけを使う(docs/design-rules.md §2・§6)。

// 見出しブロック
export const titleEyebrow = "m-0 text-[12px] font-medium leading-[1.5] tracking-[0.02em] text-rn-muted";
export const titleSub = "mt-2 mb-0 max-w-[62ch] text-[14px] leading-[1.6] text-rn-muted";

// 入口帯: ヘアラインで区切った項目(箱にしない)。モバイルは3列、md以上で 1.2fr 1fr 1fr + ボタン
export const entryStrip =
  "mt-6 grid grid-cols-3 border-y border-rn-border md:grid-cols-[1.2fr_1fr_1fr_auto]";
export const entryItem =
  "flex min-h-[44px] flex-col gap-0.5 border-r border-rn-border-soft px-3 py-3 text-rn-text no-underline " +
  "first:pl-0 hover:bg-rn-surface-soft hover:no-underline " +
  "md:px-4 md:py-3.5 md:first:pl-0";
export const entryItemLast = entryItem.replace("border-r border-rn-border-soft", "border-r-0 md:border-r md:border-rn-border-soft");
export const entryKey = "text-[12px] font-medium leading-[1.4] text-rn-muted";
export const entryValue =
  "text-[20px] font-bold leading-[1.2] text-rn-brand [font-variant-numeric:tabular-nums] md:text-[22px]";
export const entryUnit = "ml-1 text-[12px] font-medium text-rn-muted";
export const entryCta = "col-span-3 flex items-center border-t border-rn-border-soft py-3 md:col-span-1 md:border-t-0 md:py-0 md:pl-4";

// 優勝クルー一覧
export const sectionCaption = "mt-1 mb-3 text-[13px] leading-[1.6] text-rn-muted";
export const chip =
  "ml-2 inline-flex h-[22px] items-center whitespace-nowrap rounded-full bg-rn-primary-soft px-2 text-[11px] font-medium text-rn-brand";
export const numCell = "text-right font-bold text-rn-brand [font-variant-numeric:tabular-nums]";
export const gapCell = "text-right text-rn-muted [font-variant-numeric:tabular-nums]";
// 1秒未満の接戦は太字だけで示す(アクセント色は1画面1箇所の規定なので使わない)
export const gapCellClose = "text-right font-bold text-rn-brand [font-variant-numeric:tabular-nums]";

// 種目別の結果: md以上で2列の小さな表
export const eventGrid = "mt-3 grid grid-cols-1 gap-x-10 gap-y-3 md:grid-cols-2";
export const eventBlock = "border-t border-rn-border pt-3.5 pb-2";
export const eventHeading = "m-0 flex items-baseline gap-2.5 text-[16px] font-bold leading-[1.4] text-rn-brand";
export const eventHeadingLink = "text-rn-brand no-underline hover:text-rn-primary hover:underline";
export const eventMore = "ml-auto whitespace-nowrap text-[12px] font-medium";
// グローバルの table { min-width: 980px; table-layout: fixed } を打ち消す(2列グリッドに収める)
export const eventTable =
  "mt-2 w-full min-w-0 border-collapse text-[13px] leading-[1.5] [font-variant-numeric:tabular-nums] [table-layout:auto]";
export const eventTd = "border-b border-rn-border-soft px-2 py-1.5 align-middle";
export const eventTdRank = `${eventTd} w-[34px] pl-0`;
export const eventTdTime = `${eventTd} w-[70px] whitespace-nowrap text-right font-bold text-rn-brand`;
export const eventTdGap = `${eventTd} w-[64px] whitespace-nowrap pr-0 text-right text-[12px] text-rn-muted`;
export const crewName = "text-[13px] font-semibold text-rn-text";
export const crewOrg = "text-[12px] text-rn-muted";

// 順位バッジ(検索ページと同じ金銀銅)。基底と色は排他で合成する
const badgeBase =
  "inline-flex h-[26px] w-[26px] items-center justify-center rounded-full text-[12px] font-bold [font-variant-numeric:tabular-nums]";
export function rankBadgeClass(rank: number): string {
  if (rank === 1) return `${badgeBase} bg-[#ffd76e] text-[#78350f]`;
  if (rank === 2) return `${badgeBase} bg-[#e5e7eb] text-[#374151]`;
  if (rank === 3) return `${badgeBase} bg-[#f5d0a9] text-[#7c2d12]`;
  return `${badgeBase} bg-rn-primary-soft text-rn-brand`;
}
