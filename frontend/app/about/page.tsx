import type { Metadata } from "next";
import Link from "next/link";

import ButtonLink from "../../components/ui/ButtonLink";
import {
  lpArchiveLead,
  lpArchiveLink,
  lpArchiveLinks,
  lpAuthor,
  lpAuthorBody,
  lpAuthorMeta,
  lpAuthorMetaDd,
  lpAuthorMetaDt,
  lpAuthorMetaRow,
  lpDetailCard,
  lpFaqAnswer,
  lpFaqItem,
  lpFaqList,
  lpFaqQuestion,
  lpH1Line,
  lpHeadingIcon,
  lpHeroMetric,
  lpHeroMetricLabel,
  lpHeroMetrics,
  lpHeroMetricValue,
  lpHeroStrip,
  lpSummaryDd,
  lpSummaryDdList,
  lpSummaryDt,
  lpSummaryItem,
  lpSummaryList,
  lpValueCard,
  lpValueCardBody,
  lpValueGrid
} from "../../components/lp/lp-classes";
import {
  availableYears,
  competitionsByRecency,
  getDatasetSummary,
  getFilteredResults
} from "../../lib/results-data";

export const metadata: Metadata = {
  title: "レガッタナビとは（データ範囲・使い方）",
  description:
    "レガッタナビは、全日本選手権・全日本大学選手権など日本の主要ローイング（ボート）大会の結果と記録のデータベースです。最新結果・条件検索・歴代記録・データ分析記事を提供しています。",
  keywords: [
    "ローイング 大会 結果",
    "ローイング 大会結果",
    "ローイング大会結果",
    "ボート 大会 結果"
  ],
  alternates: {
    canonical: "/about"
  },
  openGraph: {
    title: "レガッタナビとは（データ範囲・使い方）",
    description:
      "レガッタナビは、日本の主要ローイング（ボート）大会の結果と記録のデータベースです。最新結果・条件検索・歴代記録・データ分析記事を提供しています。",
    url: "/about"
  }
};

// カード末尾の誘導リンク
const cardLink =
  "mt-2.5 inline-block text-[14px] font-bold text-rn-link no-underline hover:text-rn-primary hover:underline";

export default async function AboutPage() {
  const summary = getDatasetSummary();
  const totalCountLabel = new Intl.NumberFormat("ja-JP").format(summary.totalCount);
  const periodLabel =
    summary.minYear !== null && summary.maxYear !== null
      ? `${summary.minYear} - ${summary.maxYear}`
      : "-";
  const coverageLabel =
    summary.minYear !== null && summary.maxYear !== null
      ? `${summary.minYear}年から${summary.maxYear}年まで`
      : "主要大会";

  const years = availableYears();
  const latestYear = years[0] ?? null;
  const previousYear = years[1] ?? null;
  const latestCompetitions =
    latestYear !== null ? competitionsByRecency(await getFilteredResults({ year: String(latestYear) })) : [];

  const faqItems: {
    question: string;
    answer: string;
    answerNode?: React.ReactNode;
  }[] = [
    {
      question: "ローイング（ボート）の大会結果はどこで見られますか？",
      answer:
        "レガッタナビのホームで最新大会の結果を、検索ページで全日本ローイング選手権・全日本大学選手権・全日本新人選手権・全日本軽量級選手権の結果を年度・大会・種目・団体で横断検索できます。年度別の一覧は大会結果一覧ページからもたどれます。",
      answerNode: (
        <>
          <Link href="/">ホーム</Link>で最新大会の結果を、
          <Link href="/search">検索ページ</Link>
          で全日本ローイング選手権・全日本大学選手権・全日本新人選手権・全日本軽量級選手権の結果を年度・大会・種目・団体で横断検索できます。年度別の一覧は
          <Link href="/results">大会結果一覧ページ</Link>からもたどれます。
        </>
      )
    },
    {
      question: "どの期間・どの大会のデータを収録していますか？",
      answer: `${coverageLabel}の全日本級${summary.competitionCategoryCount}大会の記録（Final B以上）を収録しています。新しい大会結果は公開され次第、順次追加されます。`
    },
    {
      question: "過去の優勝タイムの推移は確認できますか？",
      answer:
        "検索ページで種目を選択すると、その種目のFinal A優勝タイムの年別推移をグラフで確認できます。種目ごとの歴代最速記録は歴代記録ページにまとめています。",
      answerNode: (
        <>
          <Link href="/search">検索ページ</Link>
          で種目を選択すると、その種目のFinal
          A優勝タイムの年別推移をグラフで確認できます。種目ごとの歴代最速記録は
          <Link href="/records">歴代記録ページ</Link>にまとめています。
        </>
      )
    },
    {
      question: "データはいつ更新されますか？",
      answer:
        "大会期間中は月次更新を目安にデータを反映しています（大会の結果公開状況により遅延する場合があります）。"
    }
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  return (
    <main className="site-container lp-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-top">
            <h1>
              <span className={lpH1Line}>ローイングの</span>
              <span className={lpH1Line}>大会結果と記録の</span>
              <span className={lpH1Line}>データベース。</span>
            </h1>
            <p className="lp-lead">
              全日本級4大会・{coverageLabel}のレース結果を収録。最新の大会結果から、条件検索、歴代記録、データ分析記事まで、日本のローイングを数字でたどれます。
            </p>
            <div className="lp-hero-actions">
              <ButtonLink href="/">最新の大会結果を見る</ButtonLink>
              <ButtonLink href="/search" variant="secondary">
                記録を検索する
              </ButtonLink>
            </div>
          </div>
        </div>
        <Link href="/search" className="lp-hero-preview-link" aria-label="検索画面を開く">
          <img
            className="lp-hero-preview"
            src="/lp-fv-screenshot.png"
            alt="レガッタナビ検索画面のプレビュー"
            width={1280}
            height={1060}
          />
        </Link>
      </section>

      <section className={lpHeroStrip} aria-label="収録データの概要">
        <ul className={lpHeroMetrics}>
          <li className={lpHeroMetric}>
            <span className={lpHeroMetricLabel}>収録レース</span>
            <strong className={lpHeroMetricValue}>{totalCountLabel}</strong>
          </li>
          <li className={lpHeroMetric}>
            <span className={lpHeroMetricLabel}>対象期間</span>
            <strong className={lpHeroMetricValue}>{periodLabel}</strong>
          </li>
          <li className={lpHeroMetric}>
            <span className={lpHeroMetricLabel}>対象大会</span>
            <strong className={lpHeroMetricValue}>全日本級 {summary.competitionCategoryCount}大会</strong>
          </li>
        </ul>
      </section>

      <section aria-labelledby="about-services-heading">
        <h2 id="about-services-heading" className="lp-section-title">できること</h2>
        <div className={lpValueGrid}>
          <article className={lpValueCard}>
            <h3><img className={lpHeadingIcon} src="/icons/chart.svg" alt="" width={18} height={18} />大会結果を見る</h3>
            <p className={lpValueCardBody}>最新大会の優勝クルーをホームに掲載。過去の結果も年度・大会別のページで確認できます。</p>
            <Link href="/results" className={cardLink}>大会結果一覧 →</Link>
          </article>
          <article className={lpValueCard}>
            <h3><img className={lpHeadingIcon} src="/icons/search.svg" alt="" width={18} height={18} />記録を検索する</h3>
            <p className={lpValueCardBody}>年・大会・種目・団体を組み合わせて検索。メダル数や優勝タイム推移のグラフも表示します。</p>
            <Link href="/search" className={cardLink}>検索ページ →</Link>
          </article>
          <article className={lpValueCard}>
            <h3><img className={lpHeadingIcon} src="/icons/trend.svg" alt="" width={18} height={18} />記録とデータを読む</h3>
            <p className={lpValueCardBody}>種目別の歴代最速記録、団体別・選手別の成績、収録データをもとにした分析記事を掲載しています。</p>
            <Link href="/records" className={cardLink}>歴代記録 →</Link>
          </article>
        </div>
      </section>

      <section aria-labelledby="about-data-heading">
        <h2 id="about-data-heading" className="lp-section-title">データについて</h2>
        <div className={lpDetailCard}>
          <dl className={lpSummaryList}>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>収録範囲</dt>
              <dd className={lpSummaryDd}>{coverageLabel}の大会記録（Final B以上）を掲載しています。</dd>
            </div>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>対象大会</dt>
              <dd className={lpSummaryDd}>
                <ul className={lpSummaryDdList}>
                  <li>全日本ローイング選手権（全日本選手権）</li>
                  <li>全日本大学ローイング選手権（全日本大学選手権）</li>
                  <li>全日本新人ローイング選手権（全日本新人選手権）</li>
                  <li>全日本軽量級選手権</li>
                </ul>
              </dd>
            </div>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>更新方針</dt>
              <dd className={lpSummaryDd}>大会期間中は月次更新を目安に反映します（結果の公開状況により遅れる場合があります）。</dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="lp-archive-heading">
        <h2 id="lp-archive-heading" className="lp-section-title">大会結果アーカイブ</h2>
        <p className={lpArchiveLead}>
          年度・大会ごとの結果ページを用意しています。最新の結果は以下からご覧いただけます。
        </p>
        <ul className={lpArchiveLinks}>
          <li>
            <Link className={lpArchiveLink} href="/results">年度別ローイング大会結果一覧</Link>
          </li>
          {latestYear !== null && (
            <li>
              <Link className={lpArchiveLink} href={`/results/${latestYear}`}>{latestYear}年のローイング大会結果</Link>
            </li>
          )}
          {previousYear !== null && (
            <li>
              <Link className={lpArchiveLink} href={`/results/${previousYear}`}>{previousYear}年のローイング大会結果</Link>
            </li>
          )}
          {latestYear !== null &&
            latestCompetitions.map((competition) => (
              <li key={competition}>
                <Link className={lpArchiveLink} href={`/results/${latestYear}/${encodeURIComponent(competition)}`}>
                  {competition}（{latestYear}年）の結果
                </Link>
              </li>
            ))}
        </ul>
      </section>

      <section aria-labelledby="lp-faq-heading">
        <h2 id="lp-faq-heading" className="lp-section-title">よくある質問</h2>
        <div className={lpFaqList}>
          {faqItems.map((item) => (
            <article className={lpFaqItem} key={item.question}>
              <h3 className={lpFaqQuestion}>{item.question}</h3>
              <p className={lpFaqAnswer}>{item.answerNode ?? item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="lp-author-heading">
        <h2 id="lp-author-heading" className="lp-section-title">開発者について</h2>
        <div className={lpAuthor}>
          <h3>プロフィール</h3>
          <p className={lpAuthorBody}>
            本サービスは <strong>中村匠</strong> が開発・運営しています。データ整備と検索体験の改善を継続し、
            ローイング記録を調べやすい形で提供することを目指しています。
          </p>
          <dl className={lpAuthorMeta}>
            <div className={lpAuthorMetaRow}>
              <dt className={lpAuthorMetaDt}>経歴</dt>
              <dd className={lpAuthorMetaDd}>
                早稲田大学漕艇部OB（2015年卒）
                <br />
                関東学連OB（2014 - 2015年 水路部長）
              </dd>
            </div>
          </dl>
          <div className="lp-hero-actions">
            <ButtonLink
              href="mailto:takumi.nakamura.by@gmail.com?subject=%E3%83%AC%E3%82%AC%E3%83%83%E3%82%BF%E3%83%8A%E3%83%93%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6"
              variant="secondary"
            >
              メールで問い合わせる
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
