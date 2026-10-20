// 検索ページ(/search)UIのTailwindクラス。
// 日経ビジュアルデータ寄り(docs/design-rules.md、2026-10-20):
//  - 箱・影・pill を作らない。区切りはヘアライン(rn-border)と余白。
//  - 文字・ボタン・リンクは墨(rn-text)。青(rn-primary)は図・1位・選択状態だけ。
//  - 主ボタン(該当N件の結果へ)は墨地白文字で1画面1つ。他はテキストリンクか白地墨枠。
//  - モバイル(<=768px)の切替は max-[768px]: バリアント。
//  - グローバルの table/th/td 規則(上罫線墨・ヘッダ12px灰・行罫線)は legacy に残し、差分だけ重ねる。
//  - 状態変化(.open/.active/.is-refreshing 等)は条件分岐でクラス文字列を切り替える。

const control =
  "h-10 w-full rounded-rn-control border border-rn-border bg-white px-[11px] py-2 text-[14px] leading-[1.5] " +
  "text-rn-text focus-visible:border-rn-primary focus-visible:outline-2 focus-visible:outline-offset-0 " +
  "focus-visible:outline-rn-primary";

const genderTabBase =
  "cursor-pointer border px-[18px] py-[9px] text-[14px] font-medium leading-[1.4] " +
  "transition-colors duration-150 motion-reduce:transition-none max-[768px]:py-2.5 ";

const comboboxOptionBase = "cursor-pointer border-0 px-2.5 py-[7px] text-left text-[14px] leading-[1.5] ";

const chartBlockBase = "border-t border-rn-border-strong pt-4 max-[768px]:col-span-full ";

const smallBtnBase =
  "cursor-pointer rounded-rn-control border border-rn-border bg-white text-[13px] font-medium leading-[1.5] text-rn-text " +
  "enabled:hover:bg-rn-surface-soft disabled:cursor-not-allowed disabled:opacity-55 max-[768px]:min-h-10 ";

const chipBase =
  "rounded-[2px] border border-rn-border bg-white px-2.5 py-[5px] text-[12px] font-medium leading-[1.4] text-rn-text ";

const tagBase = "rounded-[2px] border border-rn-border px-2 py-0.5 text-[11px] font-medium leading-[1.5] text-rn-muted";

export const sx = {
  // ヒーロー直下のデータ概要(13px のメタ行)
  heroStats:
    "mt-4 mb-0 flex list-none flex-wrap gap-x-5 gap-y-1.5 p-0 text-[13px] leading-[1.6] text-rn-meta " +
    "[font-variant-numeric:tabular-nums]",
  heroStatValue: "mr-0.5 font-bold text-rn-text",

  // フィルタ(箱にせず、下のヘアラインで結果と区切る)
  panel: "relative z-30 mt-8 border-b border-rn-border pb-5",
  genderTabs: "flex gap-2",
  genderTabIdle: genderTabBase + "border-rn-border bg-white text-rn-text hover:bg-rn-surface-soft",
  genderTabActive: genderTabBase + "border-rn-text bg-rn-text text-white",
  filters: "my-4 grid gap-2.5",
  filterRow:
    "grid grid-cols-[repeat(4,minmax(170px,1fr))] gap-2.5 max-[768px]:grid-cols-[repeat(2,minmax(0,1fr))]",
  filterRowSecondary:
    "grid grid-cols-[repeat(4,minmax(170px,1fr))] gap-2.5 pt-2.5 max-[768px]:grid-cols-[repeat(2,minmax(0,1fr))]",
  secondaryWrap: "mt-1 grid gap-1.5",
  advHeader: "flex items-center",
  advToggle:
    "inline-flex w-full cursor-pointer items-center gap-2 border-y border-rn-border bg-white px-0 py-3 " +
    "text-[14px] font-medium leading-[1.5] text-rn-text hover:underline",
  advMeta: "ml-auto text-[12px] font-normal text-rn-meta",
  advCaret: "text-[11px] text-rn-meta",
  secondaryPanel:
    "-translate-y-[2px] max-h-0 overflow-hidden opacity-0 " +
    "[transition:max-height_0.22s_ease,opacity_0.18s_ease,transform_0.2s_ease] motion-reduce:transition-none",
  secondaryPanelOpen:
    "max-h-[360px] translate-y-0 overflow-hidden opacity-100 " +
    "[transition:max-height_0.22s_ease,opacity_0.18s_ease,transform_0.2s_ease] motion-reduce:transition-none",
  control,
  select: control + " appearance-none pr-[34px]",

  // 団体コンボボックス(重なる候補リストは枠線だけで区別する)
  combobox: "relative",
  comboboxOpen: "relative z-[80]",
  comboboxMenu:
    "absolute inset-x-0 top-[calc(100%+4px)] z-[90] flex max-h-[260px] flex-col overflow-y-auto " +
    "border border-rn-border bg-white py-1",
  comboboxOption: comboboxOptionBase + "bg-transparent text-rn-text hover:bg-rn-surface-soft",
  comboboxOptionActive: comboboxOptionBase + "bg-rn-surface-soft font-bold text-rn-text",
  comboboxNoMatch: "px-3 py-2.5 text-[13px] text-rn-meta",
  comboboxHint: "mx-0.5 mb-0 mt-1.5 text-[12px] font-medium text-rn-muted",

  // フィルタ操作列・チップ
  filterActions: "flex items-center justify-end gap-3 max-[768px]:flex-wrap max-[768px]:gap-2",
  filterActionBtn:
    "cursor-pointer border-0 bg-transparent px-1 py-2 text-[14px] font-medium leading-[1.5] text-rn-text underline " +
    "hover:no-underline disabled:cursor-not-allowed disabled:opacity-55 max-[768px]:ml-auto",
  // 主ボタン(1画面に1つ): 墨地白文字
  resultsJump:
    "mr-auto inline-flex min-h-10 items-center rounded-rn-control border border-rn-text bg-rn-text px-5 py-2 " +
    "text-[14px] font-medium leading-[1.5] text-white no-underline hover:bg-rn-text-body hover:border-rn-text-body " +
    "hover:no-underline max-[768px]:mr-0 max-[768px]:w-full max-[768px]:justify-center",
  chips: "mt-3 flex flex-wrap gap-2",
  chipClearable: chipBase + "inline-flex cursor-pointer items-center gap-1.5 hover:border-rn-text",
  chipEmpty: chipBase + "border-transparent px-0 text-rn-meta",
  chipClear: "inline-flex h-4 w-4 items-center justify-center leading-none text-rn-meta",

  // 空状態ガイド(上罫線+1文+小さなボタン。箱にしない)
  guide: "mt-6 border-t border-rn-border pt-4",
  guideTitle: "m-0 text-[16px] font-bold leading-[1.5] text-rn-text",
  guideText: "mb-0 mt-1.5 text-[13px] leading-[1.6] text-rn-meta",
  guideActions: "mt-3 flex flex-wrap gap-2 max-[768px]:flex-col max-[768px]:items-stretch",
  guideBtn: smallBtnBase + "px-3 py-1.5 max-[768px]:w-full max-[768px]:px-2.5 max-[768px]:py-2",

  // グラフ(モバイルは折りたたみ)
  chartsToggleWrap: "hidden max-[768px]:mt-4 max-[768px]:block",
  chartsToggle:
    "w-full cursor-pointer border-y border-rn-border bg-white px-0 py-3 text-left text-[14px] font-medium " +
    "leading-[1.5] text-rn-text hover:underline",
  cards:
    "relative z-[1] mt-10 grid grid-cols-[repeat(12,minmax(0,1fr))] items-start gap-x-10 gap-y-10 " +
    "transition-[opacity,transform] duration-200 motion-reduce:transition-none max-[768px]:grid-cols-1",
  chartCard: chartBlockBase + "col-[span_6]",
  winnerTrendCard: chartBlockBase + "col-span-full",
  chartCardHead: "flex items-baseline justify-between gap-2.5",
  chartCardTitle: "mb-3 mt-0 text-[16px] font-bold leading-[1.5] text-rn-text",
  chartCardCaption: "text-[13px] font-normal text-rn-meta",
  chartWrap: "relative h-[260px] w-full max-[768px]:h-[228px]",
  winnerTrendWrap: "relative h-[260px] w-full max-[768px]:h-[210px]",
  winnerTrendWrapNoData: "relative h-[120px] w-full max-[768px]:h-[110px]",
  chartEmpty: "grid h-full w-full place-items-center text-[13px] text-rn-meta",
  chartEmptyNoData: "whitespace-normal text-center max-[768px]:text-[12px]",
  chartSinglePoint: "gap-1.5 p-3",
  singlePointValue: "m-0 text-center text-[15px] text-rn-text",
  singlePointStrong: "text-[1.3em] font-bold text-rn-text [font-variant-numeric:tabular-nums]",
  singlePointHint: "m-0 text-center text-[12px] font-normal text-rn-meta",
  chartLoading:
    "pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 " +
    "bg-[rgba(255,255,255,0.6)] text-[13px] font-medium text-rn-text",
  chartSpinner:
    "h-[18px] w-[18px] animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-rn-primary-soft " +
    "border-t-rn-primary motion-reduce:animate-none",

  // 結果テーブル(箱にせず、見出し行の下罫線と表の上罫線で区切る)
  tableCard: "mt-12 scroll-mt-16 transition-[opacity,transform] duration-200 motion-reduce:transition-none",
  tableHead:
    "mb-3 flex items-baseline justify-between gap-3 " +
    "max-[768px]:flex-col max-[768px]:items-start max-[768px]:gap-2",
  tableTitle: "m-0 text-[18px] font-bold leading-[1.5] text-rn-text [font-variant-numeric:tabular-nums]",
  perPage: "inline-flex items-center gap-2 whitespace-nowrap",
  perPageLabel: "text-[12px] font-normal text-rn-meta",
  perPageSelect:
    "h-[34px] rounded-rn-control border border-rn-border bg-white px-2.5 py-1 text-[13px] text-rn-text " +
    "focus-visible:outline-2 focus-visible:outline-rn-primary",
  tableScroll: "overflow-x-auto max-[768px]:hidden",
  th: "whitespace-nowrap",
  tr: "",
  tdHover: "",
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
  tableEmpty: "px-2.5 py-[18px] text-center text-rn-meta",
  emptyResults: "flex flex-col items-center gap-2.5 py-1.5",
  emptyResultsText: "m-0",
  emptyResultsBtn: smallBtnBase + "px-3.5 py-2",

  // モバイル結果カード(行として積む。箱にしない)
  mobileCards: "hidden max-[768px]:block max-[768px]:border-t max-[768px]:border-rn-border-strong",
  resultCardEmpty: "px-0 py-4 text-center text-[13px] text-rn-meta",
  resultCard: "border-b border-rn-border py-3",
  resultCardHead: "mb-1.5 flex items-center gap-2",
  resultCardTag: tagBase,
  resultCardEvent: "m-0 text-[15px] font-bold leading-[1.5] text-rn-text",
  resultCardCompetition: "mb-2 mt-0.5 line-clamp-2 text-[12px] leading-[1.5] text-rn-meta",
  resultCardMeta: "m-0 grid gap-1",
  resultCardMetaRow: "grid grid-cols-[44px_1fr] items-start gap-2",
  resultCardMetaDt: "m-0 text-[11px] font-normal leading-[1.5] text-rn-meta",
  resultCardMetaDd: "m-0 text-[13px] leading-[1.5] text-rn-text [font-variant-numeric:tabular-nums]",

  // ページネーション
  pagination:
    "mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-rn-border pt-3 " +
    "max-[768px]:justify-center",
  pagBtn: smallBtnBase + "px-[11px] py-[7px]",
  pageNum: smallBtnBase + "h-[34px] min-w-[34px] px-2 py-0 [font-variant-numeric:tabular-nums]",
  pageNumActive:
    "h-[34px] min-w-[34px] cursor-pointer rounded-rn-control border border-rn-text bg-rn-text px-2 py-0 " +
    "text-[13px] font-medium text-white [font-variant-numeric:tabular-nums] disabled:cursor-not-allowed " +
    "disabled:opacity-55 max-[768px]:min-h-10",
  pagPages: "flex items-center gap-1.5",
  pagEmpty: "text-[13px] font-medium text-rn-meta",
  pagEllipsis: "px-0.5 text-rn-meta",
  pagJump: "ml-1 inline-flex items-center gap-1.5",
  pagJumpLabel: "text-[12px] font-normal text-rn-meta",
  pagJumpInput:
    "h-[34px] w-[68px] rounded-rn-control border border-rn-border px-2 py-1 text-[13px] text-rn-text " +
    "[font-variant-numeric:tabular-nums] focus-visible:border-rn-primary focus-visible:outline-2 " +
    "focus-visible:outline-rn-primary"
};
