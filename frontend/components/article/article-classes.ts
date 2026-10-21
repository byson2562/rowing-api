// 記事本文コンポーネントのTailwindクラス。
// 日経ビジュアルデータ寄り(docs/design-rules.md、2026-10-20):
//  - 箱・影・pill・グラデーションを作らない。図・注記・年代別の区切りはヘアライン(rn-border)と余白。
//  - 文字は墨(rn-text)、本文は rn-text-body、補足は rn-muted / rn-meta。青(rn-primary)は図だけ。
//  - font-size は text-[Npx] を使う(named text-sm/base は line-height も束ねてしまうため使わない)。
//  - グローバル legacy に `p/ol/ul { margin-bottom }` があるため、余白を持たせない要素には mb-0 を付ける。
//  - モバイル(<=640px)の積みは max-[640px]: バリアントで表現。

// 本文ヘッダーの日付メタ
export const articleMeta = "mt-1.5 mb-0 text-[13px] leading-[1.6] text-rn-meta [font-variant-numeric:tabular-nums]";

// ---- 棒グラフ(金メダル数) ----
export const articleChart = "mt-[1.4em] grid gap-2";
export const articleBarRow = "grid grid-cols-[6.5em_minmax(0,1fr)_2.4em] items-center gap-2.5";
export const articleBarLabel = "text-right text-[13px] font-medium leading-[1.4] text-rn-muted";
export const articleBarTrack = "h-[14px] overflow-hidden bg-rn-surface-soft";
export const articleBarFill = "block h-full bg-rn-primary";
export const articleBarValue = "text-[13px] font-bold text-rn-text [font-variant-numeric:tabular-nums]";

// ---- 図解(用語集のSVG) ----
// preflight が効かない環境なので、figure のブラウザ既定 margin(左右40px)を明示的に打ち消す
export const articleFigure = "mx-0 mt-[1.6em] mb-[1.8em]";
export const articleFigureFrame = "border-t border-rn-border bg-white px-0 pt-4 pb-1";
export const articleFigureRow =
  "flex flex-col items-stretch gap-4 md:flex-row md:items-start md:justify-center md:gap-6";
export const articleFigureCaption = "mt-2.5 mb-0 text-[13px] leading-[1.7] text-rn-meta";

// ---- 年代別グリッド(箱にせず、上罫線で列を区切る) ----
export const articleEraGrid = "mt-[1.4em] grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-8 gap-y-5";
export const articleEraCard = "border-t border-rn-border-strong px-0 pt-3 pb-1";
export const articleEraCardTitle = "m-0 text-[16px] font-bold leading-[1.5] text-rn-text [font-variant-numeric:tabular-nums]";
export const articleEraCardList = "mt-2 mb-0 pl-[1.4em] text-[15px] leading-[1.9] text-rn-text-body";

// ---- 注記(データについての注記) ----
export const articleNote = "mt-[2.6em] border-t border-rn-border px-0 pt-4";
export const articleNoteTitle = "m-0 text-[15px] font-bold leading-[1.5] text-rn-text";
export const articleNoteList = "mt-2 mb-0 pl-[1.3em] text-[14px] leading-[1.8] text-rn-muted";

// ---- データテーブル(狭幅では data-label の行に積む) ----
// グローバル legacy の table/th/td 規則(上罫線墨・ヘッダ12px灰・行罫線)の上に差分だけを重ねる。
export const articleTableWrap = "mt-[1.4em] overflow-x-auto max-[640px]:overflow-visible";
// グローバルの table { min-width: 980px; table-layout: fixed } は記事の 760px 幅に収まらないので打ち消す
export const articleTable =
  "mt-0 w-full min-w-0 text-[14px] [font-variant-numeric:tabular-nums] [table-layout:auto] max-[640px]:block max-[640px]:text-[13px]";
export const articleThead =
  "max-[640px]:absolute max-[640px]:h-px max-[640px]:w-px max-[640px]:overflow-hidden max-[640px]:[clip:rect(0_0_0_0)]";
export const articleTbody = "max-[640px]:block max-[640px]:border-t max-[640px]:border-rn-border-strong";
export const articleTr = "max-[640px]:block max-[640px]:border-b max-[640px]:border-rn-border max-[640px]:py-1.5";
export const articleTh = "whitespace-nowrap px-2.5 py-2 text-left leading-[1.6]";
export const articleTd =
  "border-b border-rn-border px-2.5 py-2 text-left leading-[1.6] " +
  "max-[640px]:flex max-[640px]:items-baseline max-[640px]:justify-between max-[640px]:gap-3.5 " +
  "max-[640px]:border-b-0 max-[640px]:px-0 max-[640px]:py-1 max-[640px]:text-right " +
  "max-[640px]:before:shrink-0 max-[640px]:before:text-left max-[640px]:before:text-[12px] " +
  "max-[640px]:before:font-medium max-[640px]:before:text-rn-meta max-[640px]:before:content-[attr(data-label)]";
export const articleTdYear = "font-bold";
