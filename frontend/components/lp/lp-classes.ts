// 静的LP(about/sponsor/contact/legal/privacy)コンポーネントのTailwindクラス。
// 日経ビジュアルデータ寄り(docs/design-rules.md、2026-10-20):
//  - 箱・影・pill を作らない。ブロックの区切りは上罫線(墨か灰)と余白。
//  - 文字は墨(rn-text)、本文は rn-text-body、ラベルは rn-meta。青は使わない。
//  - named text-* は line-height を束ねるため使わず、text-[Npx] + leading-[..] で指定。
//  - グローバル legacy の p/ul/dl/dd margin を打ち消すため mb-0 等を明示。
//  - 900px 以下のレイアウト切替は max-[900px]: バリアント。
// ヒーローの外装(lp-hero/lp-lead/lp-section-title 等)は記事とも共有のため legacy(globals.css)側にある。

// ---- 2カラム詳細(main + side) ----
export const lpDetail = "grid grid-cols-[1.4fr_1fr] gap-x-10 gap-y-6 max-[900px]:grid-cols-1";
// lp-detail 直下の .lp-section-title に付ける(全幅 + 余白詰め)
export const lpDetailTitle = "col-span-full mb-0";
export const lpDetailCard = "border-t border-rn-border pt-5";
export const lpDetailList = "mt-2.5 mb-0 pl-[18px] text-[15px] leading-[1.9] text-rn-text-body";

// ---- 要約リスト(dl) ----
export const lpSummaryList = "mt-2.5 mb-0 grid gap-4";
export const lpSummaryItem = "m-0";
export const lpSummaryDt = "m-0 text-[15px] font-bold leading-[1.5] text-rn-text";
export const lpSummaryDd = "mt-1 mb-0 ml-0 text-[15px] leading-[1.85] text-rn-text-body";
export const lpSummaryDdList = "mt-1.5 mb-0 pl-[18px]";

// ---- 著者/連絡先ブロック ----
export const lpAuthor = "border-t border-rn-border pt-5";
export const lpAuthorBody = "mt-2.5 mb-0 text-[15px] leading-[1.9] text-rn-text-body";
export const lpAuthorMeta = "mt-4 mb-0 grid gap-2";
export const lpAuthorMetaRow = "flex items-baseline gap-2.5";
export const lpAuthorMetaDt = "m-0 flex-[0_0_64px] text-[12px] font-medium leading-[1.8] text-rn-meta";
export const lpAuthorMetaDd = "m-0 flex-auto text-[15px] leading-[1.8] text-rn-text";
// 複数行になる dd 用(経歴など)
export const lpAuthorMetaDdMultiline = "m-0 flex-auto text-[15px] leading-[1.8] text-rn-text";
export const lpAuthorMetaLink = "text-rn-text underline hover:no-underline";

// ---- 問い合わせフォーム ----
export const lpContactForm = "mt-3.5 grid gap-3";
export const lpContactGrid = "grid grid-cols-2 gap-3 max-[900px]:grid-cols-1";
export const lpContactLabel = "grid gap-1.5 text-[13px] font-medium leading-[1.5] text-rn-text";
export const lpContactInput =
  "w-full rounded-rn-control border border-rn-border bg-white px-[11px] py-2 text-[14px] leading-[1.5] text-rn-text " +
  "focus-visible:border-rn-primary focus-visible:outline-2 focus-visible:outline-rn-primary";
export const lpContactTextarea = `${lpContactInput} resize-y`;
export const lpContactActions = "flex justify-start";

// ---- ファクトブロック(データについて等。上罫線の墨で項目を区切る) ----
export const lpFactGrid = "grid gap-x-10 gap-y-7 md:grid-cols-2";
export const lpFactBlock = "border-t border-rn-border-strong pt-3.5";
export const lpFactLabel = "m-0 text-[16px] font-bold leading-[1.5] text-rn-text";
export const lpFactBody = "mb-0 mt-2 text-[15px] leading-[1.85] text-rn-text-body";
export const lpFactList = "mb-0 mt-2 list-disc pl-[18px] text-[15px] leading-[1.9] text-rn-text-body";

// ---- ヒーロー内の小物 ----
export const lpKicker = "m-0 text-[13px] font-normal leading-[1.6] text-rn-meta";
export const lpH1Line = "inline-block";
