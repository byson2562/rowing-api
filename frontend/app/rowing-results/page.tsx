import type { Metadata } from "next";
import Link from "next/link";
import {
  availableYears,
  competitionsByRecency,
  getDatasetSummary,
  getFilteredResults
} from "../../lib/results-data";

export const metadata: Metadata = {
  title: "レガッタナビとは（データ範囲・使い方）",
  description:
    "ローイング（ボート）記録とローイング大会結果を大会・年度・種目・団体で検索できるレガッタナビの案内ページ。全日本ローイング選手権を含む主要大会結果を横断して確認できます。",
  keywords: [
    "ローイング 大会 結果",
    "ローイング 大会結果",
    "ローイング大会結果",
    "ボート 大会 結果"
  ],
  alternates: {
    canonical: "/rowing-results"
  },
  openGraph: {
    title: "レガッタナビとは（データ範囲・使い方）",
    description:
      "ローイング（ボート）記録とローイング大会結果を大会・年度・種目・団体で検索できるレガッタナビの案内ページ。全日本ローイング選手権を含む主要大会結果に対応。",
    url: "/rowing-results"
  }
};

export default async function RowingResultsPage() {
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
        "レガッタナビの検索ページで、全日本ローイング選手権・全日本大学選手権・全日本新人選手権・全日本軽量級選手権の結果を年度・大会・種目・団体で横断検索できます。年度別の一覧は大会結果一覧ページからもたどれます。",
      answerNode: (
        <>
          レガッタナビの<Link href="/">検索ページ</Link>
          で、全日本ローイング選手権・全日本大学選手権・全日本新人選手権・全日本軽量級選手権の結果を年度・大会・種目・団体で横断検索できます。年度別の一覧は
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
        "検索ページで種目を選択すると、その種目のFinal A優勝タイムの年別推移をグラフで確認できます。年度・団体などの条件と組み合わせた絞り込みも可能です。",
      answerNode: (
        <>
          <Link href="/">検索ページ</Link>
          で種目を選択すると、その種目のFinal
          A優勝タイムの年別推移をグラフで確認できます。年度・団体などの条件と組み合わせた絞り込みも可能です。
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
    <main className="container lp-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-top">
            <h1>
              <span className="lp-h1-line">ローイング記録・</span>
              <span className="lp-h1-line">大会結果を、</span>
              <span className="lp-h1-line">ひとつの画面で。</span>
            </h1>
            <p className="lp-lead">
              年度・大会名・種目・団体を横断して検索し、メダル傾向までまとめて確認。日本の主要大会記録を比較しやすい形で素早くたどれます。
            </p>
            <div className="lp-hero-actions">
              <Link href="/" className="lp-btn lp-btn-primary">
                今すぐ検索を始める
              </Link>
            </div>
          </div>
        </div>
        <Link href="/" className="lp-hero-preview-link" aria-label="検索画面を開く">
          <img
            className="lp-hero-preview"
            src="/lp-fv-screenshot.png"
            alt="レガッタナビ検索画面のプレビュー"
            width={1280}
            height={1060}
          />
        </Link>
      </section>

      <section className="lp-hero-strip" aria-label="サービス要点">
        <ul className="lp-hero-tags" aria-label="機能タグ">
          <li>横断検索</li>
          <li>メダル可視化</li>
          <li>時系列比較</li>
        </ul>
        <ul className="lp-hero-metrics" aria-label="サービス概要">
          <li>
            <span>収録レース</span>
            <strong>{totalCountLabel}</strong>
          </li>
          <li>
            <span>対象期間</span>
            <strong>{periodLabel}</strong>
          </li>
          <li>
            <span>対象大会</span>
            <strong>全日本級 {summary.competitionCategoryCount}大会</strong>
          </li>
        </ul>
      </section>

      <section aria-labelledby="lp-features-heading">
        <h2 id="lp-features-heading" className="lp-section-title">主な特徴</h2>
        <div className="lp-value-grid">
          <article className="lp-value-card">
            <h3><img className="lp-heading-icon" src="/icons/search.svg" alt="" width={18} height={18} />横断検索</h3>
            <p>大会・年・種目・団体の条件を組み合わせて、目的のレース結果を素早く絞り込み。</p>
          </article>
          <article className="lp-value-card">
            <h3><img className="lp-heading-icon" src="/icons/chart.svg" alt="" width={18} height={18} />可視化</h3>
            <p>団体別の金メダル数・メダル数をグラフで確認し、勢力図の変化を把握。</p>
          </article>
          <article className="lp-value-card">
            <h3><img className="lp-heading-icon" src="/icons/trend.svg" alt="" width={18} height={18} />時系列比較</h3>
            <p>種目ごとの優勝タイム推移を追い、記録トレンドを直感的に分析。</p>
          </article>
        </div>
      </section>

      <section className="lp-detail" aria-labelledby="lp-detail-heading">
        <h2 id="lp-detail-heading" className="lp-section-title">機能とデータ概要</h2>
        <div className="lp-detail-main">
          <h3>レガッタナビでできること</h3>
          <ul>
            <li>ローイング記録の検索（年・大会・種目・団体）</li>
            <li>Final A基準での団体別メダル傾向の可視化</li>
            <li>種目別の優勝タイム推移の確認</li>
            <li>ページングで大量データを段階的に閲覧</li>
          </ul>
        </div>
        <aside className="lp-detail-side">
          <h3>データ概要</h3>
          <dl className="lp-summary-list">
            <div>
              <dt>収録データ</dt>
              <dd>現在は{coverageLabel}の大会記録を掲載しています（Final B以上が対象）。</dd>
            </div>
            <div>
              <dt>集計対象大会</dt>
              <dd>
                集計対象は全日本級の大会です。
                <ul>
                  <li>全日本ローイング選手権（全日本選手権）</li>
                  <li>全日本大学ローイング選手権（全日本大学選手権）</li>
                  <li>全日本新人ローイング選手権（全日本新人選手権）</li>
                  <li>全日本軽量級選手権</li>
                </ul>
              </dd>
            </div>
            <div>
              <dt>North Star KPI</dt>
              <dd>週次検索実行数（検索を実行したセッション数）を最重要指標として運用しています。</dd>
            </div>
            <div>
              <dt>データ更新方針</dt>
              <dd>大会期間中は月次更新を目安にデータ反映します（大会公開状況により遅延する場合があります）。</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section aria-labelledby="lp-archive-heading">
        <h2 id="lp-archive-heading" className="lp-section-title">大会結果アーカイブ</h2>
        <p className="lp-archive-lead">
          年度・大会ごとの結果ページを用意しています。最新の結果は以下からご覧いただけます。
        </p>
        <ul className="lp-archive-links">
          <li>
            <Link href="/results">年度別ローイング大会結果一覧</Link>
          </li>
          {latestYear !== null && (
            <li>
              <Link href={`/results/${latestYear}`}>{latestYear}年のローイング大会結果</Link>
            </li>
          )}
          {previousYear !== null && (
            <li>
              <Link href={`/results/${previousYear}`}>{previousYear}年のローイング大会結果</Link>
            </li>
          )}
          {latestYear !== null &&
            latestCompetitions.map((competition) => (
              <li key={competition}>
                <Link href={`/results/${latestYear}/${encodeURIComponent(competition)}`}>
                  {competition}（{latestYear}年）の結果
                </Link>
              </li>
            ))}
        </ul>
      </section>

      <section aria-labelledby="lp-faq-heading">
        <h2 id="lp-faq-heading" className="lp-section-title">よくある質問</h2>
        <div className="lp-faq-list">
          {faqItems.map((item) => (
            <article className="lp-faq-item" key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answerNode ?? item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-author-section" aria-labelledby="lp-author-heading">
        <h2 id="lp-author-heading" className="lp-section-title">開発者について</h2>
        <div className="lp-author">
          <h3>プロフィール</h3>
          <p>
            本サービスは <strong>中村匠</strong> が開発・運営しています。データ整備と検索体験の改善を継続し、
            ローイング記録を調べやすい形で提供することを目指しています。
          </p>
          <dl className="lp-author-meta">
            <div>
              <dt>経歴</dt>
              <dd>
                早稲田大学漕艇部OB（2015年卒）
                <br />
                関東学連OB（2014 - 2015年 水路部長）
              </dd>
            </div>
          </dl>
          <div className="lp-hero-actions">
            <a
              className="lp-btn lp-btn-secondary"
              href="mailto:takumi.nakamura.by@gmail.com?subject=%E3%83%AC%E3%82%AC%E3%83%83%E3%82%BF%E3%83%8A%E3%83%93%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6"
            >
              メールで問い合わせる
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
