import type { Metadata } from "next";
import Link from "next/link";

import ButtonLink from "../../components/ui/ButtonLink";
import {
  lpAuthor,
  lpAuthorBody,
  lpAuthorMeta,
  lpAuthorMetaDdMultiline,
  lpAuthorMetaDt,
  lpAuthorMetaRow,
  lpDetailCard,
  lpH1Line,
  lpSummaryDd,
  lpSummaryDdList,
  lpSummaryDt,
  lpSummaryItem,
  lpSummaryList
} from "../../components/lp/lp-classes";
import { getDatasetSummary } from "../../lib/results-data";

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

export default async function AboutPage() {
  const summary = getDatasetSummary();
  const totalCountLabel = new Intl.NumberFormat("ja-JP").format(summary.totalCount);
  const coverageLabel =
    summary.minYear !== null && summary.maxYear !== null
      ? `${summary.minYear}年から${summary.maxYear}年まで`
      : "主要大会";

  return (
    <main className="site-container lp-page">
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-top">
            <h1>
              <span className={lpH1Line}>ローイングの</span>
              <span className={lpH1Line}>大会結果と記録の</span>
              <span className={lpH1Line}>データベース。</span>
            </h1>
            <p className="lp-lead">
              全日本級{summary.competitionCategoryCount}大会・{coverageLabel}の{totalCountLabel}
              レースを収録。最新の大会結果から、条件検索、歴代記録、データ分析記事まで、日本のローイングを数字でたどれます。
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

      <section aria-labelledby="about-data-heading">
        <h2 id="about-data-heading" className="lp-section-title">データについて</h2>
        <div className={lpDetailCard}>
          <dl className={lpSummaryList}>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>収録範囲</dt>
              <dd className={lpSummaryDd}>
                {coverageLabel}の{totalCountLabel}レース（Final B以上）を掲載しています。
              </dd>
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
              <dd className={lpSummaryDd}>大会期間中はできるだけリアルタイム（1週間以内）を目安に反映します（結果の公開状況により遅れる場合があります）。</dd>
            </div>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>探し方</dt>
              <dd className={lpSummaryDd}>
                年度別の<Link href="/results">大会結果一覧</Link>のほか、
                <Link href="/search">検索</Link>・<Link href="/organizations">団体別</Link>・
                <Link href="/athletes">選手別</Link>・<Link href="/records">歴代記録</Link>
                の各ページからたどれます。
              </dd>
            </div>
          </dl>
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
              <dd className={lpAuthorMetaDdMultiline}>
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
