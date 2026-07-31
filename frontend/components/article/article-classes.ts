// 記事本文コンポーネントのTailwindクラス(旧 globals.css の .article-* を移行)。
// 方針:
//  - rn-* トークンが一致する箇所のみトークンを使い、固有色は arbitrary 値で保持(視覚ゼロ変更)。
//  - font-size は text-[Npx] を使う(named text-sm/base は line-height も束ねてしまうため使わない)。
//  - グローバル legacy に `p/ol/ul { margin-bottom }` があるため、余白を持たせない要素には mb-0 を付ける。
//  - モバイル(<=640px)のカード積みは max-[640px]: バリアントで表現。

// 本文ヘッダーの日付メタ(旧 .article-card-meta)
export const articleMeta = "mt-1.5 mb-0 text-[13px] text-[#7189a8]";

// ---- 棒グラフ(金メダル数) ----
export const articleChart = "mt-[1.4em] grid gap-2";
export const articleBarRow =
  "grid grid-cols-[6.5em_minmax(0,1fr)_2.4em] items-center gap-2.5";
export const articleBarLabel = "text-right text-[13px] font-bold text-[#33507a]";
export const articleBarTrack = "h-[18px] overflow-hidden rounded-[999px] bg-[#e8f0fb]";
export const articleBarFill =
  "block h-full rounded-[999px] bg-[linear-gradient(90deg,#2f66b8,#5b93e3)]";
export const articleBarValue = "text-[13px] font-bold text-rn-brand";

// ---- 図解(用語集のSVG) ----
// preflight が効かない環境なので、figure のブラウザ既定 margin(左右40px)を明示的に打ち消す
export const articleFigure = "mx-0 mt-[1.6em] mb-[1.8em]";
export const articleFigureFrame =
  "rounded-rn-card border border-rn-border bg-white px-3 py-4 md:px-4";
export const articleFigureRow =
  "flex flex-col items-stretch gap-4 md:flex-row md:items-start md:justify-center md:gap-6";
export const articleFigureCaption =
  "mt-2.5 mb-0 text-[13px] leading-[1.7] text-rn-muted";

// ---- 年代別グリッド ----
export const articleEraGrid =
  "mt-[1.4em] grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5";
export const articleEraCard =
  "rounded-xl border border-[#d7e3f4] bg-white px-[18px] py-3.5";
export const articleEraCardTitle =
  "m-0 text-[1rem] font-[750] leading-[1.35] text-[#33507a]";
export const articleEraCardList = "mt-2.5 mb-0 pl-[1.4em] leading-[1.9] text-[#2c4364]";

// ---- 注記(データについての注記) ----
export const articleNote =
  "mt-[2.6em] rounded-xl border border-[#d7e3f4] bg-[#f4f8fe] px-5 py-4";
export const articleNoteTitle =
  "m-0 text-[0.95rem] font-[750] leading-[1.35] text-[#33507a]";
export const articleNoteList =
  "mt-2.5 mb-0 pl-[1.3em] text-[14px] leading-[1.8] text-[#4c6687]";

// ---- データテーブル(狭幅では data-label のカードに積む) ----
// グローバル legacy の table/th/td 規則(検索結果表と共有)の上に差分だけを重ねる。
export const articleTableWrap =
  "mt-[1.4em] overflow-x-auto max-[640px]:overflow-visible";
export const articleTable =
  "mt-0 w-full text-[14px] max-[640px]:block max-[640px]:min-w-0 max-[640px]:text-[13px]";
export const articleThead =
  "max-[640px]:absolute max-[640px]:h-px max-[640px]:w-px max-[640px]:overflow-hidden max-[640px]:[clip:rect(0_0_0_0)]";
export const articleTbody = "max-[640px]:block";
export const articleTr =
  "max-[640px]:mb-2.5 max-[640px]:block max-[640px]:rounded-xl max-[640px]:border max-[640px]:border-[#d7e3f4] max-[640px]:bg-white max-[640px]:px-3.5 max-[640px]:py-1";
export const articleTh =
  "border-b border-rn-border bg-[#f2f7ff] px-2.5 py-2 text-left leading-[1.6] text-[#33507a]";
export const articleTd =
  "border-b border-rn-border px-2.5 py-2 text-left leading-[1.6] " +
  "max-[640px]:flex max-[640px]:items-baseline max-[640px]:justify-between max-[640px]:gap-3.5 " +
  "max-[640px]:border-[#eef3fb] max-[640px]:px-0 max-[640px]:py-2 max-[640px]:text-right " +
  "max-[640px]:last:border-b-0 " +
  "max-[640px]:before:shrink-0 max-[640px]:before:text-left max-[640px]:before:font-bold " +
  "max-[640px]:before:text-rn-muted max-[640px]:before:content-[attr(data-label)]";
export const articleTdYear = "font-extrabold";
