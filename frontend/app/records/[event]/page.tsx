import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ShareXLink } from "../../components/share-x-link";
import {
  getFilteredResults,
  isAthleteRecord,
  listRecordEventNames,
  organizationSlug
} from "../../../lib/results-data";
import { siteUrl } from "../../../lib/site-url";

type Params = { event: string };

export const dynamicParams = true;

const RANKING_SIZE = 20;

function decodeEvent(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateStaticParams(): Promise<Params[]> {
  const events = await listRecordEventNames();
  return events.map((event) => ({ event }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const event = decodeEvent(params.event);
  const events = await listRecordEventNames();
  if (!events.includes(event)) return {};

  const rows = await getFilteredResults({ event });
  const best = [...rows].sort((a, b) => a.time_seconds - b.time_seconds)[0];
  const path = `/records/${encodeURIComponent(event)}`;
  const title = `${event}の歴代最速タイム｜ローイング・ボート記録`;
  const description = `ローイング（ボート）${event}の歴代最速タイムランキング。現在の最速記録は${best ? `${best.organization}の${best.time_display}（${best.year}年）` : "未収録"}。全日本規模の大会結果からTop${RANKING_SIZE}を掲載しています。`;
  const ogImage = `${siteUrl}/og?title=${encodeURIComponent(`${event} 歴代最速`)}&subtitle=${encodeURIComponent(best ? `${best.time_display} ${best.organization}（${best.year}年）` : "歴代タイムランキング")}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
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

export default async function EventRecordsPage({ params }: { params: Params }) {
  const event = decodeEvent(params.event);
  const events = await listRecordEventNames();
  if (!events.includes(event)) notFound();

  const rows = await getFilteredResults({ event });
  if (rows.length === 0) notFound();

  const ranking = [...rows]
    .sort((a, b) => a.time_seconds - b.time_seconds)
    .slice(0, RANKING_SIZE);
  const best = ranking[0];
  const path = `/records/${encodeURIComponent(event)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "検索", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "歴代最速タイム", item: `${siteUrl}/records` },
          { "@type": "ListItem", position: 3, name: event, item: `${siteUrl}${path}` }
        ]
      },
      {
        "@type": "ItemList",
        name: `${event}の歴代最速タイムランキング`,
        itemListElement: ranking.map((row, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${row.time_display} ${row.crew_name}（${row.organization}・${row.year}年）`
        }))
      }
    ]
  };

  return (
    <main className="container static-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="breadcrumbs" aria-label="パンくずリスト">
        <Link href="/">検索</Link>
        <span aria-hidden="true">›</span>
        <Link href="/records">歴代最速タイム</Link>
        <span aria-hidden="true">›</span>
        <span>{event}</span>
      </nav>
      <header className="hero">
        <div>
          <h1>{event}の歴代最速タイムランキング</h1>
          <p className="subtitle">
            全日本規模の大会結果（2009年以降）から、{event}の歴代最速タイムTop{ranking.length}を掲載しています。
          </p>
          <ShareXLink
            text={`${event}の歴代最速は ${best.time_display}（${best.organization}・${best.year}年） | レガッタナビ`}
            path={path}
            hashtags={["ローイング", "ボート"]}
          />
        </div>
      </header>

      <section className="static-section">
        <h2>歴代最速タイム Top{ranking.length}</h2>
        <div className="static-table-wrap">
          <table className="static-table">
            <caption className="static-table-caption">
              {event}の歴代最速タイム（決勝レース・収録データ内）
            </caption>
            <thead>
              <tr>
                <th>歴代</th>
                <th>タイム</th>
                <th>クルー</th>
                <th>団体</th>
                <th>年</th>
                <th>大会</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((row, index) => (
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td>{row.time_display}</td>
                  <td>
                    {isAthleteRecord(row) ? (
                      <Link href={`/athletes/${encodeURIComponent(row.crew_name)}`}>{row.crew_name}</Link>
                    ) : (
                      row.crew_name
                    )}
                  </td>
                  <td>
                    <Link href={`/organizations/${encodeURIComponent(organizationSlug(row.organization))}`}>
                      {row.organization}
                    </Link>
                  </td>
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

      <p className="static-cta">
        {event}の全レース結果は
        <Link href={`/?${new URLSearchParams({ event }).toString()}`}>記録検索ページでこの種目を開く</Link>
        と確認できます。
      </p>
    </main>
  );
}
