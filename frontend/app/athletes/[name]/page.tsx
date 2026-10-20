import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ShareXLink } from "../../components/share-x-link";
import { RankTimeline } from "../../../components/results/rank-timeline";
import * as rc from "../../../components/results/results-classes";
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

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params;
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

export default async function AthletePage(props: { params: Promise<Params> }) {
  const params = await props.params;
  const name = decodeName(params.name);
  const rows = await getAthleteResults(name);
  if (rows.length === 0) notFound();

  const best = bestOf(rows);
  const finalA = rows.filter((row) => row.final_group === "Final A");
  const wins = finalA.filter((row) => row.rank === 1).length;
  const podiums = finalA.filter((row) => row.rank <= 3).length;
  const organizations = Array.from(new Set(rows.map((row) => row.organization)));
  const events = Array.from(new Set(rows.map((row) => row.event_name))).sort((a, b) => a.localeCompare(b, "ja"));
  const path = `/athletes/${encodeURIComponent(name)}`;

  // 所属履歴(新しい順)。同じ団体は在籍年の範囲にまとめる
  const affiliations = organizations
    .map((organization) => {
      const years = rows.filter((row) => row.organization === organization).map((row) => row.year);
      const from = Math.min(...years);
      const to = Math.max(...years);
      return { organization, from, to, label: from === to ? `${from}年` : `${from}〜${to}年` };
    })
    .sort((a, b) => b.to - a.to || b.from - a.from);

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
      <div className={rc.narrowPage}>
        <nav className="breadcrumbs" aria-label="パンくずリスト">
          <Link href="/">ホーム</Link>
          <span aria-hidden="true">›</span>
          <Link href="/athletes">選手別成績</Link>
          <span aria-hidden="true">›</span>
          <span>{name}</span>
        </nav>

        <header className="mt-6">
          <p className={rc.eyebrow}>選手 · {events.join("・")}</p>
          <h1 className={rc.personName}>{name}</h1>
          <p className={rc.affiliation}>
            {affiliations.map((item, index) => (
              <span key={item.organization}>
                {index > 0 ? " / " : ""}
                <Link href={`/organizations/${encodeURIComponent(organizationSlug(item.organization))}`}>
                  {item.organization}
                </Link>
                <span className="[font-variant-numeric:tabular-nums]">({item.label})</span>
              </span>
            ))}
          </p>
          <p className={rc.lead}>
            収録データ内の自己ベストは{best.time_display}({best.year}年 {best.competition_name})。
            {wins > 0
              ? `全日本規模の大会のFinal Aで${wins}回優勝している。`
              : podiums > 0
                ? `Final Aで${podiums}回、3位以内に入っている。`
                : `Final A・Bあわせて${rows.length}レースを収録している。`}
          </p>
          <ShareXLink
            text={`${name}選手のシングルスカル自己ベストは ${best.time_display}（${best.year}年） | レガッタナビ`}
            path={path}
            hashtags={["ローイング", "ボート"]}
          />
        </header>

        <dl className={rc.statsDl}>
          <div className={rc.statsItem}>
            <dt className={rc.statsKey}>Final A 出場</dt>
            <dd className={rc.statsValue}>
              {finalA.length}
              <span className={rc.statsUnit}>回</span>
            </dd>
          </div>
          <div className={rc.statsItem}>
            <dt className={rc.statsKey}>優勝</dt>
            <dd className={rc.statsValue}>
              {wins}
              <span className={rc.statsUnit}>回</span>
            </dd>
          </div>
          <div className={rc.statsItem}>
            <dt className={rc.statsKey}>3位以内</dt>
            <dd className={rc.statsValue}>
              {podiums}
              <span className={rc.statsUnit}>回</span>
            </dd>
          </div>
        </dl>

        {finalA.length >= 2 ? (
          <figure className={rc.figure}>
            <figcaption>
              <span className={`block ${rc.figureTitle}`}>Final Aの順位の推移</span>
              <span className={`block ${rc.figureSub}`}>左から古い順。上ほど上位</span>
            </figcaption>
            <RankTimeline races={finalA} label={`${name}選手のFinal Aの順位`} />
          </figure>
        ) : null}

        {bestRows.length > 1 ? (
          <section className="static-section">
            <h2>種目別自己ベスト</h2>
            <div className="static-table-wrap">
              <table className="static-table">
                <caption className="static-table-caption">{name}選手の種目別自己ベスト(収録データ内)</caption>
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
                      <td data-label="種目">
                        <Link href={`/records/${encodeURIComponent(row.event_name)}`}>{row.event_name}</Link>
                      </td>
                      <td data-label="自己ベスト">{row.time_display}</td>
                      <td data-label="年">{row.year}</td>
                      <td data-label="大会">
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
        ) : null}

        <section className="static-section">
          <h2>出場したレース</h2>
          <div className="static-table-wrap">
            <table className="static-table">
              <caption className="static-table-caption">{name}選手の出場レース(新しい順)</caption>
              <thead>
                <tr>
                  <th>年</th>
                  <th>大会</th>
                  <th>順位</th>
                  <th className="text-right">タイム</th>
                  <th>所属</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id}>
                    <td data-label="年" className="text-rn-muted">
                      {row.year}
                    </td>
                    <td data-label="大会" className="!whitespace-normal">
                      <Link href={`/results/${row.year}/${encodeURIComponent(row.competition_name)}`}>
                        {row.competition_name}
                      </Link>
                      <span className="block text-[12px] leading-[1.6] text-rn-meta">
                        {row.event_name} · {row.final_group}
                      </span>
                    </td>
                    <td data-label="順位">
                      {row.final_group === "Final A" ? (
                        <span className={rc.rankBadgeClass(row.rank)}>{row.rank}</span>
                      ) : (
                        <span className="text-rn-muted">{row.rank}</span>
                      )}
                    </td>
                    <td data-label="タイム" className="text-right">
                      {row.time_display}
                    </td>
                    <td data-label="所属">
                      <Link href={`/organizations/${encodeURIComponent(organizationSlug(row.organization))}`}>
                        {row.organization}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={rc.figureNote}>
            タイムは風や水面で大きく変わるため、大会をまたいだ比較には向かない。順位の推移で見るほうが確か。
          </p>
        </section>

        <p className="static-note">
          ※ 個人名が記録されているシングルスカル種目のみを収録しています。団体種目(ペア〜エイト)の出場歴は含まれません。
          また同姓同名の選手が同一ページに集約される場合があります。
        </p>

        <p className="static-cta">
          個別のレース結果は
          <Link href={`/search?${new URLSearchParams({ q: name }).toString()}`}>記録検索ページで{name}選手を検索する</Link>
          と確認できます。
        </p>
      </div>
    </main>
  );
}
