import type { Metadata } from "next";
import Link from "next/link";

import { allResults, organizationSlug } from "../../../lib/results-data";
import { getArticle } from "../../../lib/articles";
import { siteUrl } from "../../../lib/site-url";

const meta = getArticle("university-championship-guide")!;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: {
    canonical: `/articles/${meta.slug}`
  },
  openGraph: {
    title: meta.title,
    description: meta.description,
    type: "article",
    url: `/articles/${meta.slug}`,
    images: [
      {
        url: `${siteUrl}/og?title=${encodeURIComponent("全日本大学ローイング選手権ガイド")}&subtitle=${encodeURIComponent("2026年は8月26日〜30日・戸田で開催")}`,
        width: 1200,
        height: 630,
        alt: meta.title
      }
    ]
  }
};

// 直近大会の優勝校テーブルは2025年で固定(2026年データ追加時は本文ごと更新する)
const LATEST_YEAR = 2025;
const isUnivChampionship = (name: string) => /大学(ローイング)?選手権/.test(name);

function OrgLink({ name }: { name: string }) {
  return <Link href={`/organizations/${organizationSlug(name)}`}>{name}</Link>;
}

export default async function UniversityChampionshipGuide() {
  const rows = await allResults();
  const univGolds = rows.filter(
    (r) => isUnivChampionship(r.competition_name) && r.final_group === "Final A" && r.rank === 1
  );

  // 2025年の種目別優勝(JO種目=社会人含むオープン枠は除く)
  const eventOrder = [
    "男子エイト",
    "女子エイト",
    "男子舵手つきフォア",
    "女子舵手つきフォア",
    "男子フォア",
    "男子クォドルプル",
    "女子クォドルプル",
    "男子ダブルスカル",
    "女子ダブルスカル",
    "男子ペア",
    "女子ペア",
    "男子シングルスカル",
    "女子シングルスカル"
  ];
  const champs2025 = univGolds
    .filter((r) => r.year === LATEST_YEAR && !r.event_name.startsWith("JO"))
    .sort((a, b) => eventOrder.indexOf(a.event_name) - eventOrder.indexOf(b.event_name));

  // 男子エイトの歴代優勝(2009-2025)
  const menEight = univGolds
    .filter((r) => r.event_name === "男子エイト" && r.year >= 2009 && r.year <= 2025)
    .sort((a, b) => b.year - a.year);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.description,
    datePublished: meta.publishedAt,
    dateModified: meta.updatedAt ?? meta.publishedAt,
    author: { "@type": "Person", name: "中村匠" },
    publisher: { "@type": "Organization", name: "レガッタナビ", url: siteUrl },
    mainEntityOfPage: `${siteUrl}/articles/${meta.slug}`
  };

  return (
    <main className="container lp-page article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="article-body">
        <header className="article-header">
          <p className="article-card-meta">
            <time dateTime={meta.publishedAt}>2026年7月22日</time> · レガッタナビ編集
          </p>
          <h1>全日本大学ローイング選手権(インカレ)とは</h1>
          <p className="lp-lead">
            大学ボートの日本一を決める、年に一度の対抗戦。2026年は8月26日(水)から30日(日)まで、埼玉・戸田ボートコースで開かれます。種目の構成、去年の優勝校、そして今年の見どころを、当サイトの収録データからまとめました。
          </p>
        </header>

        <h2>どんな大会か</h2>
        <p>
          正式名称は「全日本大学ローイング選手権大会」。ボート関係者は「インカレ」や「全日本大学選手権」と呼びます。出場できるのは大学のクルーだけで、各校が対抗エイトを筆頭に部の総力を注ぎ込む、大学ボートのシーズン最大の目標です。近年はオックスフォード盾レガッタ(1年生中心のレース)とジャパンオープンレガッタが同じ水域で併催されています。
        </p>
        <p>
          2026年の第53回大会は<strong>8月26日(水)〜30日(日)</strong>
          、会場は埼玉県戸田市の戸田ボートコース。日程や要項の一次情報は
          <a href="https://www.jara.or.jp/race/current/" target="_blank" rel="noopener noreferrer">
            日本ローイング協会の大会日程ページ
          </a>
          で確認できます。
        </p>

        <h2>種目構成</h2>
        <p>
          2025年大会でFinal
          Aが行われたのは13種目。男子が7種目(エイト、舵手つきフォア、フォア、クォドルプル、ダブルスカル、ペア、シングルスカル)、女子が6種目(男子からフォアを除いた構成)です。花形はやはり男女のエイトで、大会最終日のメインレースになります。
        </p>

        <h2>2025年の種目別優勝校</h2>
        <p>
          まず前回大会の結果から。13種目の優勝は9校に分かれました。1校が種目を総なめにする大会ではなくなっている、というのが近年の実態です。年ごとの流れは
          <Link href="/articles/university-power-map-2009-2025">勢力図の分析記事</Link>
          で17年分を追っています。
        </p>
        <div className="article-table-wrap">
          <table className="article-table">
            <thead>
              <tr>
                <th scope="col">種目</th>
                <th scope="col">優勝</th>
                <th scope="col">タイム</th>
              </tr>
            </thead>
            <tbody>
              {champs2025.map((r) => (
                <tr key={r.event_name}>
                  <td data-label="種目" className="article-table-year">{r.event_name}</td>
                  <td data-label="優勝">
                    <OrgLink name={r.organization} />
                  </td>
                  <td data-label="タイム">{r.time_display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>男子エイトの歴代優勝(2009-2025)</h2>
        <p>
          対抗戦の頂点、男子エイトの優勝校を並べます。この17年では<OrgLink name="日本大学" />
          が12回と圧倒的。残る5年は<OrgLink name="早稲田大学" />(2015年・2025年)、
          <OrgLink name="中央大学" />(2019年)、<OrgLink name="仙台大学" />
          (2020年)、そして全日本選手権と合併開催だった2021年のNTT東日本(注記参照)です。2025年は早稲田が10年ぶりに勝ちました。
        </p>
        <div className="article-table-wrap">
          <table className="article-table">
            <thead>
              <tr>
                <th scope="col">年</th>
                <th scope="col">優勝</th>
                <th scope="col">タイム</th>
              </tr>
            </thead>
            <tbody>
              {menEight.map((r) => (
                <tr key={r.year}>
                  <td data-label="年" className="article-table-year">
                    <Link href={`/results/${r.year}`}>{r.year}</Link>
                  </td>
                  <td data-label="優勝">{r.organization}</td>
                  <td data-label="タイム">{r.time_display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          女子エイトは収録データではFinal Aの記録がある年が限られますが、直近は<OrgLink name="仙台大学" />
          が2023年から3連覇中。2026年に4連覇へ挑む形です。
        </p>

        <h2>2026年の見どころ</h2>
        <p>
          データから見た注目点は3つあります。ひとつめは男子エイト。早稲田が連覇するのか、12回優勝の日大が奪い返すのか。ふたつめは女子エイトの仙台大の4連覇。最後に種目数の争いです。直近8年、男女合計の金メダル数で日大に次ぐ位置まで来た仙台大が、今年どこまで種目を取るか。勢力図が動くとすれば、その最前線はここだと見ています。
        </p>

        <h2>結果の調べ方</h2>
        <p>
          過去の結果は当サイトで検索できます。
          <Link href={`/results/${LATEST_YEAR}`}>{LATEST_YEAR}年の大会結果</Link>
          から種目ごとの着順とタイムを、<Link href="/organizations">団体別ページ</Link>
          から各校のメダル推移を確認できます。大会期間中の公式速報は
          <a href="https://www.jara.or.jp/" target="_blank" rel="noopener noreferrer">
            日本ローイング協会
          </a>
          が出します。当サイトへの結果反映は大会後になります。
        </p>

        <aside className="article-note">
          <h3>データについての注記</h3>
          <ul>
            <li>優勝はFinal Aの1位。収録範囲はFinal B以上です。</li>
            <li>2021年の男子エイトは全日本選手権との合併開催で、優勝は社会人のNTT東日本でした(歴代表にもそのまま載せています)。</li>
            <li>JO(ジャパンオープン)種目は社会人クルーも出場するオープン枠のため、種目別優勝の表から除いています。</li>
            <li>2026年の開催情報は日本ローイング協会の公表(2026年7月時点)に基づきます。</li>
          </ul>
        </aside>
      </article>
    </main>
  );
}
