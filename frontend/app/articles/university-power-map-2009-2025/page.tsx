import type { Metadata } from "next";
import Link from "next/link";

import { allResults, organizationSlug } from "../../../lib/results-data";
import { getArticle } from "../../../lib/articles";
import { siteUrl } from "../../../lib/site-url";

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
        url: `${siteUrl}/og?title=${encodeURIComponent("大学ボートの勢力図 2009-2025")}&subtitle=${encodeURIComponent("金メダル202個のデータ分析")}`,
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

  const countBy = (filtered: typeof golds) => {
    const map = new Map<string, number>();
    filtered.forEach((r) => map.set(r.organization, (map.get(r.organization) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };

  const totalRanking = countBy(golds).slice(0, 10);
  const maxTotal = totalRanking[0]?.[1] ?? 1;
  const eraFirst = countBy(golds.filter((r) => r.year < ERA_SPLIT)).slice(0, 5);
  const eraSecond = countBy(golds.filter((r) => r.year >= ERA_SPLIT)).slice(0, 5);

  const yearlyTop: { year: number; entries: [string, number][] }[] = [];
  for (let y = FROM_YEAR; y <= TO_YEAR; y++) {
    const entries = countBy(golds.filter((r) => r.year === y)).slice(0, 2);
    if (entries.length > 0) yearlyTop.push({ year: y, entries });
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
    <main className="container lp-page article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="article-body">
        <header className="article-header">
          <p className="article-card-meta">
            <time dateTime={meta.publishedAt}>2026年7月21日</time> · レガッタナビ編集(中村匠)
          </p>
          <h1>データで見る大学ボートの勢力図 2009-2025</h1>
          <p className="lp-lead">
            全日本大学ローイング選手権のFinal A優勝、17年分・202件。レガッタナビの収録データを大学別に集計すると、「日大一強」だけでは説明できない変化が見えてきました。
          </p>
        </header>

        <h2>集計の前提</h2>
        <p>
          対象は{FROM_YEAR}年から{TO_YEAR}
          年までの全日本大学ローイング選手権(旧・全日本大学選手権)で、Final
          Aを1位で終えたクルーを「金メダル」として数えています。合同開催のレガッタに出場した社会人クルーなどは除き、大学のクルーだけを集計対象にしました。元データはこのサイトの
          <Link href="/results">大会結果アーカイブ</Link>
          と同じものなので、気になる数字があれば個別のレースまで遡って確認できます。
        </p>

        <h2>累計ランキング: 日本大学が67個で頭ひとつ抜けている</h2>
        <p>
          まず17年分をまとめて見ると、<Link href={`/organizations/${organizationSlug("日本大学")}`}>日本大学</Link>
          が67個。2位の<Link href={`/organizations/${organizationSlug("早稲田大学")}`}>早稲田大学</Link>
          (36個)にほぼダブルスコアをつけています。
        </p>
        <div className="article-chart" role="img" aria-label="大学別の金メダル累計ランキング">
          {totalRanking.map(([org, count]) => (
            <div className="article-bar-row" key={org}>
              <span className="article-bar-label">{org.replace(/大学$/, "大")}</span>
              <span className="article-bar-track">
                <span className="article-bar-fill" style={{ width: `${(count / maxTotal) * 100}%` }} />
              </span>
              <span className="article-bar-value">{count}</span>
            </div>
          ))}
        </div>

        <h2>前期と後期で分けると、景色が変わる</h2>
        <p>
          ところが{ERA_SPLIT}年を境に前後半へ分けると、印象はかなり違います。前期(2009-2017)の日本大学は9年で47個。年平均5個以上を獲り続けた、文字どおりの一強時代です。後期(2018-2025)も日本大学が20個で首位は守っているものの、ペースは半分以下に落ちました。
        </p>
        <div className="article-era-grid">
          <div>
            <h3>2009-2017</h3>
            <ol>
              {eraFirst.map(([org, count]) => (
                <li key={org}>
                  {org} <strong>{count}</strong>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3>2018-2025</h3>
            <ol>
              {eraSecond.map(([org, count]) => (
                <li key={org}>
                  {org} <strong>{count}</strong>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <p>
          後期の2位に入ったのは<Link href={`/organizations/${organizationSlug("仙台大学")}`}>仙台大学</Link>
          です。前期はわずか2個だったのが後期は14個。2019年・2023年・2025年には年間最多金メダル校になっています。
          <Link href={`/organizations/${organizationSlug("立命館大学")}`}>立命館大学</Link>や
          <Link href={`/organizations/${organizationSlug("立教大学")}`}>立教大学</Link>
          も後期に数字を伸ばした一方、前期3位だった明治大学は14個から5個へ。関東の伝統校が上位を占める構図から、地方・関西勢を含めた分散へと移っています。
        </p>

        <h2>年別の最多金メダル校: 「7個」の時代は終わった</h2>
        <p>
          年ごとの最多校を並べると、分散の進み方がはっきりします。2009年と2012年の日本大学は1校で7個。近年は最多校でも3〜5個で、2021年のように最多が2個という年もありました。1校が種目を総なめにする時代は、データ上はすでに終わっています。
        </p>
        <table className="article-table">
          <thead>
            <tr>
              <th scope="col">年</th>
              <th scope="col">最多金メダル校(個数)</th>
            </tr>
          </thead>
          <tbody>
            {yearlyTop.map(({ year, entries }) => (
              <tr key={year}>
                <td>
                  <Link href={`/results/${year}`}>{year}</Link>
                </td>
                <td>{entries.map(([org, count]) => `${org}(${count})`).join(" / ")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>まとめ: 勢力図は「一強」から「群雄割拠」へ</h2>
        <p>
          累計では今も日本大学の存在感が圧倒的です。ただ、直近8年に限れば首位のリードは縮み、仙台大学をはじめ新しい常連校が増えました。個人的には、2019年に仙台大学が初めて年間最多に立った年が転換点だったと見ています。
        </p>
        <p>
          このあたりの変化は、大会や種目を絞って眺めるとさらに面白くなります。
          <Link href="/">検索ページ</Link>で年度や団体を指定すれば、この記事の集計の元になった個々のレース結果をそのまま確認できます。
          <Link href="/organizations">団体別ページ</Link>には各大学のメダル推移もあります。
        </p>

        <aside className="article-note">
          <h3>データについての注記</h3>
          <ul>
            <li>集計対象はFinal Aの1位のみ。同一年に複数種目で優勝した場合はその数だけ数えています。</li>
            <li>本サイトの収録範囲はFinal B以上です。2021年など、開催形態が特殊な年は種目数自体が少ないことがあります。</li>
            <li>大会名の表記は年により異なります(全日本大学選手権/全日本大学ローイング選手権)。両方を対象にしています。</li>
          </ul>
        </aside>
      </article>
    </main>
  );
}
