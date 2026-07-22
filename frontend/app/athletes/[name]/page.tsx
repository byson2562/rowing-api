import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ShareXLink } from "../../components/share-x-link";
import {
  getAthleteResults,
  listAthletes,
  organizationSlug,
  type ResultRecord
} from "../../../lib/results-data";
import { siteUrl } from "../../../lib/site-url";

type Params = { name: string };

export const dynamicParams = true;

function decodeName(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateStaticParams(): Promise<Params[]> {
  const athletes = await listAthletes();
  return athletes.map((name) => ({ name }));
}

function bestOf(rows: ResultRecord[]): ResultRecord {
  return [...rows].sort((a, b) => a.time_seconds - b.time_seconds)[0];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const name = decodeName(params.name);
  const rows = await getAthleteResults(name);
  if (rows.length === 0) return {};

  const best = bestOf(rows);
  const wins = rows.filter((row) => row.final_group === "Final A" && row.rank === 1).length;
  const path = `/athletes/${encodeURIComponent(name)}`;
  const title = `${name}選手のシングルスカル記録（ローイング・ボート）`;
  const description = `${name}選手（${best.organization}）のローイング・シングルスカル成績。自己ベストは${best.time_display}（${best.year}年 ${best.competition_name}）${wins > 0 ? `、全日本規模の大会で優勝${wins}回` : ""}。年度別の全成績を掲載しています。`;
  const ogImage = `${siteUrl}/og?title=${encodeURIComponent(name)}&subtitle=${encodeURIComponent(`${best.event_name} ${best.time_display}（${best.year}年）`)}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "profile",
      locale: "ja_JP",
      url: path,
      siteName: "レガッタナビ",
      title: `${title} | レガッタナビ`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | レガッタナビ`,
      description,
      images: [ogImage]
    }
  };
}

export default async function AthletePage({ params }: { params: Params }) {
  const name = decodeName(params.name);
  const rows = await getAthleteResults(name);
  if (rows.length === 0) notFound();

  const best = bestOf(rows);
  const wins = rows.filter((row) => row.final_group === "Final A" && row.rank === 1).length;
  const organizations = Array.from(new Set(rows.map((row) => row.organization)));
  const path = `/athletes/${encodeURIComponent(name)}`;

  // 種目別自己ベスト（男子/女子/軽量級/PR1などスカル種目の内訳）
  const bestByEvent = new Map<string, ResultRecord>();
  rows.forEach((row) => {
    const current = bestByEvent.get(row.event_name);
    if (!current || row.time_seconds < current.time_seconds) {
      bestByEvent.set(row.event_name, row);
    }
  });
  const bestRows = Array.from(bestByEvent.values()).sort((a, b) =>
    a.event_name.localeCompare(b.event_name, "ja")
  );

  const history = [...rows].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.competition_name !== b.competition_name)
      return a.competition_name.localeCompare(b.competition_name, "ja");
    return a.rank - b.rank;
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "選手別成績", item: `${siteUrl}/athletes` },
          { "@type": "ListItem", position: 3, name, item: `${siteUrl}${path}` }
        ]
      },
      {
        "@type": "Person",
        name,
        affiliation: organizations,
        url: `${siteUrl}${path}`
      }
    ]
  };

  return (
    <main className="site-container static-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="breadcrumbs" aria-label="パンくずリスト">
        <Link href="/">ホーム</Link>
        <span aria-hidden="true">›</span>
        <Link href="/athletes">選手別成績</Link>
        <span aria-hidden="true">›</span>
        <span>{name}</span>
      </nav>
      <header className="hero">
        <div>
          <h1>{name}選手のシングルスカル成績</h1>
          <p className="subtitle">
            {organizations.join("、")}所属・全{rows.length}レース収録。自己ベストは{best.time_display}（{best.year}年）
            {wins > 0 ? `、Final A優勝${wins}回` : ""}です。
          </p>
          <ShareXLink
            text={`${name}選手のシングルスカル自己ベストは ${best.time_display}（${best.year}年） | レガッタナビ`}
            path={path}
            hashtags={["ローイング", "ボート"]}
          />
        </div>
      </header>

      <section className="static-section">
        <h2>種目別自己ベスト</h2>
        <div className="static-table-wrap">
          <table className="static-table">
            <caption className="static-table-caption">{name}選手の種目別自己ベスト（収録データ内）</caption>
            <thead>
              <tr>
                <th>種目</th>
                <th>自己ベスト</th>
                <th>年</th>
                <th>大会</th>
              </tr>
            </thead>
            <tbody>
              {bestRows.map((row) => (
                <tr key={row.event_name}>
                  <td>
                    <Link href={`/records/${encodeURIComponent(row.event_name)}`}>{row.event_name}</Link>
                  </td>
                  <td>{row.time_display}</td>
                  <td>{row.year}</td>
                  <td>
                    <Link href={`/results/${row.year}/${encodeURIComponent(row.competition_name)}`}>
                      {row.competition_name}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="static-section">
        <h2>出場レース一覧</h2>
        <div className="static-table-wrap">
          <table className="static-table">
            <caption className="static-table-caption">{name}選手の出場レース（新しい順）</caption>
            <thead>
              <tr>
                <th>年</th>
                <th>大会</th>
                <th>種目</th>
                <th>組</th>
                <th>順位</th>
                <th>タイム</th>
                <th>所属</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id}>
                  <td>{row.year}</td>
                  <td>
                    <Link href={`/results/${row.year}/${encodeURIComponent(row.competition_name)}`}>
                      {row.competition_name}
                    </Link>
                  </td>
                  <td>{row.event_name}</td>
                  <td>{row.final_group}</td>
                  <td>{row.rank}</td>
                  <td>{row.time_display}</td>
                  <td>
                    <Link href={`/organizations/${encodeURIComponent(organizationSlug(row.organization))}`}>
                      {row.organization}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="static-note">
        ※ 個人名が記録されているシングルスカル種目のみを収録しています。団体種目（ペア〜エイト）の出場歴は含まれません。
        また同姓同名の選手が同一ページに集約される場合があります。
      </p>

      <p className="static-cta">
        個別のレース結果は
        <Link href={`/?${new URLSearchParams({ q: name }).toString()}`}>記録検索ページで{name}選手を検索する</Link>
        と確認できます。
      </p>
    </main>
  );
}
