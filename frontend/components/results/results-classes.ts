// 大会結果ページ(/results/[year]/[competition])のクラス文字列の単一ソース。
// 色は rn-* トークンと、検索ページと同じ順位バッジ色だけを使う(docs/design-rules.md §2・§6)。

// 大会ページ: 見出しブロック直下のメタ行とボタン
export const metaLine = "mt-4 mb-0 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] leading-[1.6] text-rn-meta [font-variant-numeric:tabular-nums]";
export const metaActions = "mt-6 flex flex-wrap items-center gap-3";

// 図(上罫線が墨の版。大会ページの先頭の図に使う)
export const figureRuled = "mx-0 mt-12 mb-0 border-t border-rn-border-strong pt-5";

// 種目別の結果: md以上で2列の小さな表
export const eventGrid = "mt-3 grid grid-cols-1 gap-x-10 gap-y-3 md:grid-cols-2";
export const eventBlock = "border-t border-rn-border pt-3.5 pb-2";
export const eventHeading = "m-0 flex items-baseline gap-2.5 text-[18px] font-bold leading-[1.5] text-rn-text";
export const eventHeadingLink = "text-rn-text no-underline hover:underline";
export const eventMore = "ml-auto whitespace-nowrap text-[12px] font-medium text-rn-meta no-underline hover:underline";
// グローバルの table { min-width: 980px; table-layout: fixed } を打ち消す(2列グリッドに収める)
export const eventTable =
  "mt-2 w-full min-w-0 border-collapse text-[13px] leading-[1.5] [font-variant-numeric:tabular-nums] [table-layout:auto]";
export const eventTd = "border-b border-rn-border-soft px-2 py-1.5 align-middle";
export const eventTdRank = `${eventTd} w-[34px] pl-0`;
export const eventTdTime = `${eventTd} w-[70px] whitespace-nowrap text-right font-bold text-rn-text`;
export const eventTdGap = `${eventTd} w-[64px] whitespace-nowrap pr-0 text-right text-[12px] text-rn-meta`;
export const crewName = "text-[13px] font-medium text-rn-text no-underline hover:underline";
export const crewOrg = "text-[12px] text-rn-meta";

// 順位バッジ(サイト共通。docs/design-rules.md §6)。基底と色は排他で合成する
// 1位=青地白文字 / 2〜3位=灰青地 / 4位以下=薄灰地。金銀銅は使わない
const badgeBase =
  "inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[12px] font-bold leading-none [font-variant-numeric:tabular-nums]";
export function rankBadgeClass(rank: number): string {
  if (rank === 1) return `${badgeBase} bg-rn-primary text-white`;
  if (rank <= 3) return `${badgeBase} bg-rn-primary-soft text-rn-text`;
  return `${badgeBase} bg-rn-surface-soft text-rn-muted`;
}

// ---- 一段組ページ(選手・大会)の見出しブロック ----
export const narrowPage = "mx-auto max-w-[760px]";
export const eyebrow = "m-0 text-[13px] font-normal leading-[1.6] text-rn-meta";
export const personName = "mt-3.5 mb-0 text-[40px] font-bold leading-[1.3] tracking-[0.02em] text-rn-text max-[640px]:text-[32px]";
export const affiliation = "mt-2 mb-0 text-[14px] leading-[1.7] text-rn-muted";
export const lead = "mt-6 mb-0 text-[17px] leading-[1.95] text-rn-text-body";

// 統計 dl(3列。上罫線は墨、下罫線は灰)
export const statsDl = "mt-9 mb-0 grid grid-cols-3 border-t border-rn-border-strong border-b border-rn-border";
export const statsItem = "py-4 [&+&]:border-l [&+&]:border-rn-border [&+&]:pl-5";
export const statsKey = "text-[12px] leading-[1.5] text-rn-meta";
export const statsValue = "mt-1 mb-0 text-[32px] font-bold leading-[1.2] text-rn-text [font-variant-numeric:tabular-nums]";
export const statsUnit = "ml-1 text-[14px] font-normal";

// 図(上罫線なし版。統計 dl の直後に置く)
export const figure = "mx-0 mt-12 mb-0";
export const figureTitle = "text-[16px] font-bold leading-[1.5] text-rn-text";
export const figureSub = "mt-1.5 mb-4 text-[13px] leading-[1.6] text-rn-meta";
export const figureNote = "mt-4 mb-0 text-[12px] leading-[1.8] text-rn-meta";

// 大会ページの h1(正式名の先頭セグメント)。.hero h1 と同じ 38px/1.4
export const pageTitle = "mt-3.5 mb-0 text-[38px] font-bold leading-[1.4] tracking-normal text-rn-text max-[640px]:text-[28px]";
