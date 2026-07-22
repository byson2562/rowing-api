// 検索ページ(/search)UIのTailwindクラス(旧 globals.css の検索系クラスを移行)。
// 方針は article-classes.ts / lp-classes.ts と同じ:
//  - rn-* トークンが一致する箇所のみトークン、固有色は arbitrary 値で保持(視覚ゼロ変更)。
//  - 値は「デザインパス」節の上書き適用後の実効値(例: ボタン類は font-weight 600、
//    チップ・ラベル類は 500、results-jump はプライマリグラデーション)。
//  - モバイル(<=768px)の切替は max-[768px]: バリアント。
//  - グローバルの table/th/td 規則(static ページと共有)は legacy に残し、差分だけ重ねる。
//  - 状態変化(.open/.active/.is-refreshing 等)は条件分岐でクラス文字列を切り替える。

// 注: 旧CSSでは select の矢印画像は Clubhouse パスの background ショートハンドで
// 上書きされて消えていたため、矢印なしが現行の見た目。
const control =
  "h-11 w-full rounded-rn-control border-2 border-rn-border-soft bg-rn-surface-soft px-[11px] py-2 text-[14px] " +
  "text-[#1d3557] focus:border-rn-primary focus:bg-white focus:outline-2 focus:outline-[rgba(29,110,224,0.25)]";

const genderTabBase =
  "cursor-pointer rounded-[999px] border-2 px-[18px] py-[9px] font-semibold transition-all duration-[180ms] " +
  "max-[768px]:py-2.5 ";

const comboboxOptionBase =
  "cursor-pointer rounded-lg border-0 px-2 py-[7px] text-left text-[14px] ";

const chartCardBase = "rounded-rn-card bg-white p-3.5 shadow-rn-soft max-[768px]:col-span-full ";

const pagBtnBase =
  "cursor-pointer rounded-[999px] border-2 border-rn-border-soft bg-white font-semibold text-rn-link " +
  "enabled:hover:border-rn-primary enabled:hover:text-rn-primary " +
  "disabled:cursor-not-allowed disabled:opacity-55 max-[768px]:min-h-10 ";

const chipBase =
  "rounded-[999px] border border-[#d8e6fa] bg-rn-primary-soft px-2.5 py-[5px] text-[12px] font-medium text-rn-link ";

const resultCardRankBase = "ml-auto min-w-[44px] px-2 py-0.5 text-center text-[14px] ";

export const sx = {
  // ヒーロー内の実績チップ
  heroStats:
    "mt-3.5 mb-0 flex list-none flex-wrap gap-x-[22px] gap-y-2 p-0 text-[13px] text-[#4a678d] " +
    "max-[768px]:gap-x-4 max-[768px]:gap-y-1.5",
  heroStatValue:
    "mr-0.5 text-[16px] font-bold text-rn-primary [font-variant-numeric:tabular-nums] max-[768px]:text-[15px]",

  // フィルタパネル
  panel:
    "relative z-30 rounded-rn-card bg-white p-3.5 shadow-rn [backdrop-filter:blur(6px)] " +
    "max-[768px]:px-3.5 max-[768px]:py-4",
  genderTabs: "flex gap-2",
  genderTabIdle:
    genderTabBase + "border-rn-border bg-white text-[#4a6791] hover:border-rn-primary hover:text-rn-primary",
  genderTabActive: genderTabBase + "border-rn-primary bg-rn-primary text-white",
  filters: "my-3 grid gap-2.5",
  filterRow:
    "grid grid-cols-[repeat(4,minmax(170px,1fr))] gap-2.5 max-[768px]:grid-cols-[repeat(2,minmax(0,1fr))]",
  filterRowSecondary:
    "grid grid-cols-[repeat(4,minmax(170px,1fr))] gap-2.5 pt-2.5 max-[768px]:grid-cols-[repeat(2,minmax(0,1fr))]",
  secondaryWrap: "mt-0.5 grid gap-1.5 border-t border-dashed border-rn-border-soft pt-1 max-[768px]:pt-2.5",
  advHeader: "flex items-center",
  advToggle:
    "inline-flex w-full cursor-pointer items-center gap-2 rounded-rn-control border-2 border-rn-border-soft " +
    "bg-rn-surface-soft px-[13px] py-[11px] text-[13px] font-semibold text-rn-link " +
    "hover:border-rn-primary hover:bg-[#f1f7ff] hover:text-rn-primary",
  advMeta: "ml-auto text-[12px] font-medium text-[#557395]",
  advCaret: "text-[11px] text-[#6a84a5]",
  secondaryPanel:
    "-translate-y-[2px] max-h-0 overflow-hidden opacity-0 " +
    "[transition:max-height_0.22s_ease,opacity_0.18s_ease,transform_0.2s_ease]",
  secondaryPanelOpen:
    "max-h-[360px] translate-y-0 overflow-hidden opacity-100 " +
    "[transition:max-height_0.22s_ease,opacity_0.18s_ease,transform_0.2s_ease]",
  control,
  select: control + " appearance-none pr-[34px]",

  // 団体コンボボックス
  combobox: "relative",
  comboboxOpen: "relative z-[80]",
  comboboxMenu:
    "absolute inset-x-0 top-[calc(100%+4px)] z-[90] flex max-h-[260px] flex-col gap-0.5 overflow-y-auto " +
    "rounded-rn-control border-2 border-rn-border-soft bg-white p-1.5 shadow-rn",
  comboboxOption: comboboxOptionBase + "bg-transparent text-[#1d3557] hover:bg-[#f2f7ff]",
  comboboxOptionActive: comboboxOptionBase + "bg-[#e3edfb] font-bold text-[#0d4d9e]",
  comboboxNoMatch: "px-3 py-2.5 text-[13px] text-rn-muted",
  comboboxHint: "mx-0.5 mb-0 mt-1.5 text-[12px] font-medium text-[#8a5a00]",

  // フィルタ操作列・チップ
  filterActions: "flex justify-end max-[768px]:flex-wrap max-[768px]:gap-2",
  filterActionBtn:
    "cursor-pointer rounded-[999px] border-2 border-rn-border-soft bg-white px-3 py-2 font-semibold text-rn-link " +
    "hover:border-rn-primary hover:text-rn-primary " +
    "disabled:cursor-not-allowed disabled:opacity-60 max-[768px]:ml-auto",
  resultsJump:
    "mr-auto inline-flex items-center rounded-[999px] bg-rn-accent px-5 py-[11px] text-[13px] font-extrabold " +
    "text-rn-accent-ink no-underline shadow-[0_8px_20px_rgba(255,138,61,0.35)] " +
    "hover:brightness-[1.05] hover:no-underline " +
    "max-[768px]:mr-0 max-[768px]:w-full max-[768px]:justify-center",
  chips: "mt-2.5 flex flex-wrap gap-2",
  chipClearable:
    chipBase + "inline-flex cursor-pointer items-center gap-1.5 hover:border-[#86a7d4] hover:bg-[#eef5ff]",
  chipEmpty: chipBase + "text-rn-muted",
  chipClear:
    "inline-flex h-4 w-4 items-center justify-center rounded-[999px] bg-[#dbe9fc] leading-none text-[#2c4c82]",

  // 空状態ガイド
  guide:
    "mt-3.5 rounded-[14px] border border-dashed border-rn-border bg-[linear-gradient(160deg,#f8fbff,#edf4ff)] p-3.5",
  guideTitle: "m-0 text-[1rem]",
  guideText: "mb-0 mt-1.5 text-[13px] text-[#4a678d]",
  guideActions: "mt-2.5 flex flex-wrap gap-2 max-[768px]:flex-col max-[768px]:items-stretch",
  guideBtn:
    "cursor-pointer rounded-[999px] border-2 border-rn-border-soft bg-white px-[11px] py-1.5 font-semibold " +
    "text-[#244a74] disabled:cursor-not-allowed disabled:opacity-60 " +
    "max-[768px]:w-full max-[768px]:px-2.5 max-[768px]:py-2",

  // グラフ
  chartsToggleWrap: "hidden max-[768px]:mt-3.5 max-[768px]:block",
  chartsToggle:
    "w-full cursor-pointer rounded-[999px] border-2 border-rn-border-soft bg-white p-[13px] font-semibold " +
    "text-rn-link hover:border-rn-primary hover:text-rn-primary",
  cards:
    "relative z-[1] mt-3.5 grid grid-cols-[repeat(12,minmax(0,1fr))] items-start gap-3 " +
    "transition-[opacity,transform] duration-200 motion-reduce:transition-none max-[768px]:grid-cols-1",
  chartCard: chartCardBase + "col-[span_6]",
  winnerTrendCard: chartCardBase + "col-span-full",
  chartCardHead: "flex items-baseline justify-between gap-2.5",
  chartCardTitle: "mb-2.5 mt-0 text-[1.05rem]",
  chartCardCaption: "text-[12px] font-medium text-rn-muted",
  chartWrap: "relative h-[260px] w-full max-[768px]:h-[228px]",
  winnerTrendWrap: "relative h-[260px] w-full max-[768px]:h-[210px]",
  winnerTrendWrapNoData: "relative h-[190px] w-full max-[768px]:h-[150px]",
  chartEmpty:
    "grid h-full w-full place-items-center rounded-[10px] border border-dashed border-rn-border bg-[#f8fbff] " +
    "font-medium text-rn-muted",
  chartEmptyNoData: "whitespace-normal text-center max-[768px]:text-[12px]",
  chartSinglePoint: "gap-1.5 p-3",
  singlePointValue: "m-0 text-center text-[15px] text-[#1f3a5c]",
  singlePointStrong: "text-[1.3em] text-rn-primary",
  singlePointHint: "m-0 text-center text-[12px] font-normal text-rn-muted",
  chartLoading:
    "pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 rounded-[10px] " +
    "bg-[rgba(255,255,255,0.42)] text-[13px] font-bold text-[#244a74]",
  chartSpinner:
    "h-[18px] w-[18px] animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-[#b8cae2] border-t-[#1d6ee0]",

  // 結果テーブル
  tableCard:
    "mt-4 scroll-mt-16 rounded-rn-card bg-white p-3.5 shadow-rn-soft " +
    "transition-[opacity,transform] duration-200 motion-reduce:transition-none",
  tableHead:
    "mb-3 flex items-center justify-between gap-3 border-b border-[#e1e9f4] pb-2 " +
    "max-[768px]:flex-col max-[768px]:items-start max-[768px]:pb-2.5",
  tableTitle: "m-0 text-[1.05rem]",
  perPage: "inline-flex items-center gap-2 whitespace-nowrap",
  perPageLabel: "text-[12px] font-medium text-rn-muted",
  perPageSelect: "h-[34px] rounded-[9px] border border-rn-border bg-white px-2.5 py-1 text-[13px]",
  tableScroll: "overflow-x-auto rounded-[10px] border border-[#d8e2f0] max-[768px]:hidden",
  th: "border-b-2 border-[#e3edfb] bg-[#f2f8ff] font-semibold text-[#4a6791] first:rounded-tl-lg last:rounded-tr-lg",
  tr: "group transition-[background] duration-[120ms] hover:bg-[#f6faff]",
  tdHover: "group-hover:bg-[#f3f8ff]",
  colYear: "w-[70px] text-center",
  colCompetition: "w-[360px]",
  colEvent: "w-[120px]",
  colFinal: "w-[84px]",
  colCrew: "w-[150px]",
  colOrganization: "w-[150px]",
  colRank: "w-[68px] text-center",
  colTime: "w-[110px] whitespace-nowrap text-right [font-variant-numeric:tabular-nums]",
  cellClamp: "line-clamp-2 min-h-[calc(1.35em*2)] leading-[1.35]",
  cellEllipsis: "truncate",
  tableEmpty: "px-2.5 py-[18px] text-center text-rn-muted",
  emptyResults: "flex flex-col items-center gap-2.5 py-1.5",
  emptyResultsText: "m-0",
  emptyResultsBtn:
    "cursor-pointer rounded-[999px] border-2 border-rn-border-soft bg-white px-3.5 py-2 font-semibold text-rn-link " +
    "hover:bg-[#eef5ff]",
  // 後段デザインパスの上書き(ひと回り大きい円 30px + primary-soft)適用後の実効値。
  // 色・太さはメダル/通常で排他になるため基底から分離する(ユーティリティ同士は後勝ちできない)
  rankBadge:
    "inline-flex h-[30px] min-w-[30px] items-center justify-center rounded-[999px] px-[7px] " +
    "[font-variant-numeric:tabular-nums]",
  rankBadgePlain: "bg-rn-primary-soft font-semibold text-rn-link",

  // モバイル結果カード
  mobileCards: "hidden max-[768px]:grid max-[768px]:gap-2",
  resultCardEmpty:
    "rounded-[10px] border border-dashed border-rn-border bg-[#f8fbff] px-3 py-3.5 text-center font-medium " +
    "text-rn-muted",
  resultCard: "rounded-[18px] bg-white p-2.5 shadow-rn-soft",
  resultCardHead: "mb-1.5 flex items-center gap-2",
  resultCardTag: "rounded-[999px] border border-rn-border px-2 py-0.5 text-[11px] font-medium text-[#2e4f77]",
  resultCardRank: resultCardRankBase + "rounded-lg font-extrabold",
  resultCardRankMedal: resultCardRankBase + "rounded-md font-bold",
  resultCardEvent: "m-0 font-extrabold text-[#1d3557]",
  resultCardCompetition: "mb-2 mt-1 line-clamp-2 text-[12px] leading-[1.45] text-[#4a6791]",
  resultCardMeta: "m-0 grid gap-1.5",
  resultCardMetaRow: "grid grid-cols-[44px_1fr] items-start gap-2",
  resultCardMetaDt: "m-0 text-[11px] font-medium text-[#5e7897]",
  resultCardMetaDd: "m-0 text-[12px] leading-[1.4] text-[#233b5f]",

  // ページネーション
  pagination:
    "mt-3.5 flex flex-wrap items-center justify-end gap-2 border-t border-[#e1e9f4] pt-2.5 " +
    "max-[768px]:justify-center",
  pagBtn: pagBtnBase + "px-[11px] py-[7px]",
  pageNum: pagBtnBase + "h-[34px] min-w-[34px] px-2 py-0",
  pageNumActive:
    "h-[34px] min-w-[34px] cursor-pointer rounded-[999px] border-2 border-rn-primary bg-rn-primary px-2 py-0 " +
    "font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55 max-[768px]:min-h-10",
  pagPages: "flex items-center gap-1.5",
  pagEmpty: "text-[13px] font-bold text-rn-muted",
  pagEllipsis: "px-0.5 text-[#7a91b1]",
  pagJump: "ml-1 inline-flex items-center gap-1.5",
  pagJumpLabel: "text-[12px] font-bold text-rn-muted",
  pagJumpInput:
    "h-[34px] w-[68px] rounded-[9px] border border-rn-border px-2 py-1 text-[13px] " +
    "focus:border-rn-primary focus:outline-2 focus:outline-[rgba(29,110,224,0.25)]"
};
