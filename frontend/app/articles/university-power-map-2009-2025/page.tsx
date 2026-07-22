import type { Metadata } from "next";
import Link from "next/link";

import { allResults, organizationSlug } from "../../../lib/results-data";
import { getArticle } from "../../../lib/articles";
import { siteUrl } from "../../../lib/site-url";
import {
  articleBarFill,
  articleBarLabel,
  articleBarRow,
  articleBarTrack,
  articleBarValue,
  articleChart,
  articleEraCard,
  articleEraCardList,
  articleEraCardTitle,
  articleEraGrid,
  articleMeta,
  articleNote,
  articleNoteList,
  articleNoteTitle,
  articleTable,
  articleTableWrap,
  articleTbody,
  articleTd,
  articleTdYear,
  articleTh,
  articleThead,
  articleTr
} from "../../../components/article/article-classes";

const meta = getArticle("university-power-map-2009-2025")!;

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
        url: `${siteUrl}/og?title=${encodeURIComponent("大学ボートの勢力図 2009-2025")}&subtitle=${encodeURIComponent("金メダル202個を男女別に集計")}`,
        width: 1200,
        height: 630,
        alt: meta.title
      }
    ]
  }
};

// 分析対象は2009-2025で固定する(データ追加で本文の数字と集計がずれないように)
const FROM_YEAR = 2009;
const TO_YEAR = 2025;
const ERA_SPLIT = 2018; // 前期: 2009-2017 / 後期: 2018-2025

const isUnivChampionship = (name: string) => /大学(ローイング)?選手権/.test(name);
const isUniversity = (org: string) => /大学$/.test(org);

type GoldRow = Awaited<ReturnType<typeof allResults>>[number];

function countBy(filtered: GoldRow[]): [string, number][] {
  const map = new Map<string, number>();
  filtered.forEach((r) => map.set(r.organization, (map.get(r.organization) ?? 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function OrgLink({ name }: { name: string }) {
  return <Link href={`/organizations/${organizationSlug(name)}`}>{name}</Link>;
}

function GoldBarChart({ ranking, label }: { ranking: [string, number][]; label: string }) {
  const max = ranking[0]?.[1] ?? 1;
  return (
    <div className={articleChart} role="img" aria-label={label}>
      {ranking.map(([org, count]) => (
        <div className={articleBarRow} key={org}>
          <span className={articleBarLabel}>{org.replace(/大学$/, "大")}</span>
          <span className={articleBarTrack}>
            <span className={articleBarFill} style={{ width: `${(count / max) * 100}%` }} />
          </span>
          <span className={articleBarValue}>{count}</span>
        </div>
      ))}
    </div>
  );
}

function EraGrid({ first, second }: { first: [string, number][]; second: [string, number][] }) {
  return (
    <div className={articleEraGrid}>
      <div className={articleEraCard}>
        <h3 className={articleEraCardTitle}>2009-2017</h3>
        <ol className={articleEraCardList}>
          {first.map(([org, count]) => (
            <li key={org}>
              {org} <strong>{count}</strong>
            </li>
          ))}
        </ol>
      </div>
      <div className={articleEraCard}>
        <h3 className={articleEraCardTitle}>2018-2025</h3>
        <ol className={articleEraCardList}>
          {second.map(([org, count]) => (
            <li key={org}>
              {org} <strong>{count}</strong>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default async function UniversityPowerMapArticle() {
  const rows = await allResults();
  const golds = rows.filter(
    (r) =>
      isUnivChampionship(r.competition_name) &&
      r.final_group === "Final A" &&
      r.rank === 1 &&
      isUniversity(r.organization) &&
      r.year >= FROM_YEAR &&
      r.year <= TO_YEAR
  );

  const men = golds.filter((r) => r.event_name.startsWith("男子"));
  const women = golds.filter((r) => r.event_name.startsWith("女子"));

  const menRanking = countBy(men).slice(0, 8);
  const womenRanking = countBy(women).slice(0, 8);
  const menEraFirst = countBy(men.filter((r) => r.year < ERA_SPLIT)).slice(0, 5);
  const menEraSecond = countBy(men.filter((r) => r.year >= ERA_SPLIT)).slice(0, 5);
  const womenEraFirst = countBy(women.filter((r) => r.year < ERA_SPLIT)).slice(0, 5);
  const womenEraSecond = countBy(women.filter((r) => r.year >= ERA_SPLIT)).slice(0, 5);

  const yearlyTop: { year: number; men: string; women: string }[] = [];
  // 最多と同数のクルーが複数あればすべて併記する(タイ記録を落とさない)
  const topLabel = (entries: [string, number][]) => {
    if (entries.length === 0) return "-";
    const max = entries[0][1];
    return entries
      .filter(([, count]) => count === max)
      .map(([org, count]) => `${org}(${count})`)
      .join(" / ");
  };
  for (let y = FROM_YEAR; y <= TO_YEAR; y++) {
    yearlyTop.push({
      year: y,
      men: topLabel(countBy(men.filter((r) => r.year === y))),
      women: topLabel(countBy(women.filter((r) => r.year === y)))
    });
  }

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
    <main className="site-container lp-page article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="article-body">
        <header className="article-header">
          <p className={articleMeta}>
            <time dateTime={meta.publishedAt}>2026年7月21日</time> · レガッタナビ編集
          </p>
          <h1>データで見る大学ボートの勢力図 2009-2025</h1>
          <p className="lp-lead">
            全日本大学ローイング選手権のFinal
            A優勝は、17年間で202件(男子125・女子77)。男女別に数え直すと、男子は日大が67個で独走、女子は早稲田30個に立命館が0個から10個まで急伸。まったく違う勢力図が見えてきました。
          </p>
        </header>

        <h2>集計の前提</h2>
        <p>
          対象は{FROM_YEAR}年から{TO_YEAR}
          年までの全日本大学ローイング選手権(旧・全日本大学選手権)。Final
          Aを1位で終えたクルーを「金メダル」として数え、男子種目と女子種目を分けて集計しました。合同開催レガッタに出た社会人クルーは除外し、大学のクルーだけが対象です。元データは
          <Link href="/results">大会結果アーカイブ</Link>
          と同じものなので、疑わしい数字は個別のレースまで遡れます。
        </p>

        <h2>男子: 125個中67個。日大の一強は今も続く</h2>
        <p>
          男子の主役は迷いなく<OrgLink name="日本大学" />
          です。17年間の金125個のうち67個、割合にして54%。2位の<OrgLink name="仙台大学" />
          が10個なので、比較の相手がいません。
        </p>
        <GoldBarChart ranking={menRanking} label="男子の大学別金メダル累計ランキング" />
        <p>
          ただ、時期を分けると勢いの変化は見えます。前期(2009-2017)の日大は9年で47個、年平均5個以上。筆者が早稲田で漕いでいた頃、男子のFinal
          Aで日大の金が5個前後に達する年が何度もありました。後期(2018-2025)は20個で、首位のまま半分以下に数を減らしています。空いた分を拾ったのが仙台大(8個)、
          <OrgLink name="富山国際大学" />(5個)、<OrgLink name="日本体育大学" />
          あたりで、2019年と2020年は仙台大が、2023年は富山国際大が日大と並んで年間最多に立ちました。
        </p>
        <EraGrid first={menEraFirst} second={menEraSecond} />

        <h2>女子: 早稲田の牙城に、立命館が0から10個</h2>
        <p>
          女子は男子と勢力図が重なりません。累計首位は<OrgLink name="早稲田大学" />
          の30個で、女子の金77個の約4割。2015年には1年で4個を獲っています。
        </p>
        <GoldBarChart ranking={womenRanking} label="女子の大学別金メダル累計ランキング" />
        <p>
          この8年で最も動いたのは<OrgLink name="立命館大学" />
          です。前期は0個。それが後期だけで10個と、早稲田(後期11個)とほぼ並ぶところまで来ました。
          <OrgLink name="明治大学" />
          が9個から3個に減らした一方、仙台大は女子でも2023年・2025年に年間最多。同じ「勢力図の変化」でも中身は違います。男子は首位の日大自体が数を減らしましたが、女子では早稲田の実数はほぼ変わらず(後期11個)、そこに立命館が新しく食い込んだ形です。
        </p>
        <EraGrid first={womenEraFirst} second={womenEraSecond} />

        <h2>年別の最多校を並べる</h2>
        <p>
          年ごとの最多校です。男子は2009年・2012年に日大が7個。この「1校で7個」は後期には一度も出ていません。女子は2015年の早稲田4個が最多で、近年は男女とも2〜3個で最多が決まる年が続きます。
        </p>
        <div className={articleTableWrap}>
        <table className={articleTable}>
          <thead className={articleThead}>
            <tr>
              <th scope="col" className={articleTh}>年</th>
              <th scope="col" className={articleTh}>男子の最多校(個数)</th>
              <th scope="col" className={articleTh}>女子の最多校(個数)</th>
            </tr>
          </thead>
          <tbody className={articleTbody}>
            {yearlyTop.map(({ year, men: m, women: w }) => (
              <tr key={year} className={articleTr}>
                <td data-label="年" className={`${articleTd} ${articleTdYear}`}>
                  <Link href={`/results/${year}`}>{year}</Link>
                </td>
                <td data-label="男子" className={articleTd}>{m}</td>
                <td data-label="女子" className={articleTd}>{w}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <h2>まとめ</h2>
        <p>
          男子は「日大の一強が緩みつつ続く」、女子は「早稲田の牙城に立命館と仙台大が食い込んだ」。この2つの流れが重なる場所に立っているのが仙台大です。金メダルは前期の男子2個・女子0個から、後期は男子8個・女子6個。後期の男女合計14個は、日大(20個)に次ぐ数字です。日大と早稲田が巻き返すのか、仙台大の時代が定着するのか。次の大学選手権は、この表を手元に置いて見るとひと味変わるはずです。
        </p>
        <p>
          気になった大学があれば、<Link href="/organizations">団体別ページ</Link>
          でメダル推移を、<Link href="/search">検索ページ</Link>
          で個々のレース結果を確認できます。この記事の集計は全部そこから再現できます。
        </p>

        <aside className={articleNote}>
          <h3 className={articleNoteTitle}>データについての注記</h3>
          <ul className={articleNoteList}>
            <li>集計対象はFinal Aの1位のみ。同一年に複数種目で優勝した場合はその数だけ数えています。</li>
            <li>本サイトの収録範囲はFinal B以上です。2021年など開催形態が特殊な年は、種目数自体が少ないことがあります。</li>
            <li>大会名の表記は年により異なります(全日本大学選手権/全日本大学ローイング選手権)。両方を対象にしています。</li>
          </ul>
        </aside>
      </article>
    </main>
  );
}
