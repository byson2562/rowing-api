// 静的LP(about/support/privacy)コンポーネントのTailwindクラス
// (旧 globals.css の .lp-hero-strip/.lp-value-*/.lp-detail*/.lp-summary-list/
//  .lp-author*/.lp-archive-*/.lp-faq-*/.lp-support-*/.lp-contact-* を移行)。
// 方針は article-classes.ts と同じ:
//  - rn-* トークンが一致する箇所のみトークン、固有色は arbitrary 値で保持(視覚ゼロ変更)。
//  - named text-* は line-height を束ねるため使わず、text-[Npx] + leading-[..] で指定。
//  - グローバル legacy の p/ul/dl/dd margin を打ち消すため mb-0 等を明示。
//  - 900px 以下のレイアウト切替は max-[900px]: バリアント。
// ヒーローの外装(lp-hero/lp-lead/lp-section-title 等)は記事とも共有のため legacy 据え置き。

// ---- ヒーロー直下の帯(タグ + メトリクス) ----
export const lpHeroStrip =
  "grid gap-3 rounded-xl border border-rn-border bg-white px-4 py-3.5 max-[900px]:p-3";
export const lpHeroTags = "m-0 flex list-none flex-wrap gap-[7px] p-0";
export const lpHeroTag =
  "rounded-[999px] border border-[#c2d7f4] bg-[rgba(255,255,255,0.94)] px-[11px] py-[5px] text-[12px] font-bold text-[#24466e]";
export const lpHeroMetrics =
  "m-0 grid list-none grid-cols-3 gap-2.5 p-0 max-[900px]:grid-cols-2 max-[900px]:gap-2";
export const lpHeroMetric =
  "grid gap-1 rounded-xl border border-[#d6e3f4] bg-[#f8fbff] px-3 py-[11px] " +
  "max-[900px]:last:col-span-full";
export const lpHeroMetricLabel = "text-[11px] font-bold text-[#4c678b]";
export const lpHeroMetricValue = "text-[15px] leading-[1.2] text-[#0f2f54]";

// ---- 特徴カード ----
export const lpValueGrid =
  "grid grid-cols-[1.2fr_1fr_1fr] gap-3.5 max-[900px]:grid-cols-1";
export const lpValueCard =
  "rounded-xl border border-rn-border bg-white px-[17px] py-4 " +
  "transition-[border-color,box-shadow] duration-[220ms] " +
  "hover:border-[#bdd2ee] hover:shadow-[0_8px_18px_rgba(60,110,200,0.1)] " +
  "motion-reduce:transition-none";
export const lpValueCardBody = "mt-2 mb-0 leading-[1.6] text-rn-muted";

// ---- 2カラム詳細(main + side) ----
export const lpDetail = "grid grid-cols-[1.4fr_1fr] gap-3 max-[900px]:grid-cols-1";
// lp-detail 直下の .lp-section-title に付ける(全幅 + 余白詰め)
export const lpDetailTitle = "col-span-full mb-0";
export const lpDetailCard =
  "rounded-xl border border-rn-border bg-white p-[18px]";
export const lpDetailList = "mt-2.5 mb-0 pl-[18px] leading-[1.8]";

// ---- 要約リスト(dl) ----
export const lpSummaryList = "mt-2.5 mb-0 grid gap-2.5";
export const lpSummaryItem = "m-0 border-l-[3px] border-l-[#d7e2f2] pl-2.5";
export const lpSummaryDt = "m-0 text-[13px] font-bold text-[#1f3d64]";
export const lpSummaryDd = "mt-1 mb-0 ml-0 leading-[1.65] text-rn-muted";
export const lpSummaryDdList = "mt-1.5 mb-0 pl-[18px]";

// ---- 著者/連絡先カード ----
export const lpAuthor =
  "rounded-xl border border-rn-border bg-white p-[18px]";
export const lpAuthorBody = "mt-2.5 mb-0 leading-[1.7] text-rn-muted";
export const lpAuthorMeta = "mt-3 mb-0 grid gap-2";
export const lpAuthorMetaRow = "flex items-baseline gap-2.5";
export const lpAuthorMetaDt =
  "m-0 flex-[0_0_64px] text-[12px] font-bold leading-[18px] text-[#4d6788]";
export const lpAuthorMetaDd = "m-0 flex-auto leading-[18px] text-[#1f3d64]";
// 複数行になる dd 用(経歴など)。1行用の leading-[18px] だと行間が詰まる
export const lpAuthorMetaDdMultiline = "m-0 flex-auto leading-[1.7] text-[#1f3d64]";
export const lpAuthorMetaLink =
  "leading-[18px] text-rn-primary no-underline hover:underline";

// ---- アーカイブリンク ----
export const lpArchiveLead = "mt-0 mb-3.5 text-[14px] text-rn-muted";
export const lpArchiveLinks = "m-0 flex list-none flex-col gap-2.5 p-0";
export const lpArchiveLink =
  "text-[14px] font-bold text-rn-link no-underline hover:text-rn-primary hover:underline";

// ---- FAQ ----
export const lpFaqList = "flex flex-col gap-3.5";
export const lpFaqItem =
  "rounded-xl border border-rn-border bg-white px-5 py-[18px]";
export const lpFaqQuestion = "mt-0 mb-2 text-[15px]";
export const lpFaqAnswer = "m-0 text-[14px] leading-[1.7] text-rn-text";

// ---- サポート(寄付・テンプレ) ----
export const lpSupportNote = "mt-3 mb-0 text-[13px] leading-[1.6] text-[#4f6f93]";
export const lpDonationLinks = "mt-3 flex flex-wrap gap-2";
export const lpSupportTemplate =
  "mt-2.5 mb-0 whitespace-pre-wrap rounded-[10px] border border-rn-border-soft bg-[#f8fbff] p-3 " +
  "text-[13px] leading-[1.7] text-[#1e3d66] " +
  "[font-family:var(--font-inter),var(--font-noto-sans-jp),'Hiragino_Kaku_Gothic_ProN','BIZ_UDPGothic',sans-serif]";
// .lp-page .lp-tech-heading 相当(見出しの上余白)
export const lpTechHeading = "mt-[26px] mb-0";

// ---- 問い合わせフォーム ----
export const lpContactForm = "mt-3.5 grid gap-2.5";
export const lpContactGrid = "grid grid-cols-2 gap-2.5 max-[900px]:grid-cols-1";
export const lpContactLabel = "grid gap-[5px] text-[12px] font-bold text-[#365778]";
export const lpContactInput =
  "w-full rounded-[10px] border border-rn-border bg-white px-2.5 py-2 text-[14px] text-[#1d3557] " +
  "focus-visible:border-rn-primary focus-visible:outline-2 focus-visible:outline-[rgba(29,110,224,0.25)]";
export const lpContactTextarea = `${lpContactInput} resize-y`;
export const lpContactActions = "flex justify-start";

// ---- ファクトブロック(データについて等の項目をカード状に並べる) ----
export const lpFactGrid = "grid gap-3 md:grid-cols-2";
export const lpFactBlock = "rounded-xl border border-rn-border bg-white p-4";
export const lpFactLabel = "m-0 text-[14px] font-bold text-rn-brand";
export const lpFactBody = "mb-0 mt-1.5 text-[14px] leading-[1.7] text-rn-text";
export const lpFactList = "mb-0 mt-1.5 list-disc pl-[18px] text-[14px] leading-[1.8] text-rn-text";

// ---- ヒーロー内の小物 ----
export const lpKicker =
  "m-0 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#365887]";
export const lpH1Line = "inline-block";
export const lpHeadingIcon = "mr-1.5 inline-block h-[18px] w-[18px] align-[-0.18em]";
