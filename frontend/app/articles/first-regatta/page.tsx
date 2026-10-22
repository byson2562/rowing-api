import type { Metadata } from "next";
import Link from "next/link";

import { allResults, competitionCategoryOf } from "../../../lib/results-data";
import { getArticle } from "../../../lib/articles";
import { siteUrl } from "../../../lib/site-url";
import { ogImages } from "../../../lib/og-image";
import { articleOg } from "../../../lib/og-targets";
import {
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

const meta = getArticle("first-regatta")!;

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
    images: ogImages(articleOg(meta))
  }
};

// タイムの目安に使う代表種目。人数の違う艇を男女から選ぶ
const SAMPLE_EVENTS = ["男子エイト", "男子舵手つきフォア", "男子シングルスカル", "女子舵手つきクォドルプル", "女子シングルスカル"];

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

// 秒を「6分01秒」の形に
function formatMinSec(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const sec = Math.round(seconds - m * 60);
  return `${m}分${String(sec).padStart(2, "0")}秒`;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export default async function FirstRegattaArticle() {
  const rows = await allResults();

  // 最速と中央値を出す。最下位は艇のトラブルなどで年に数件だけ8分台が混じり、
  // 目安として示すには外れ値の影響が大きすぎるため使わない
  const range = new Map<string, { fastest: string; median: string; gapSeconds: number; n: number }>();
  for (const name of SAMPLE_EVENTS) {
    const timed = rows
      .filter((r) => r.event_name === name && r.time_seconds > 0)
      .sort((a, b) => a.time_seconds - b.time_seconds);
    if (timed.length > 0) {
      const mid = timed[Math.floor(timed.length / 2)];
      range.set(name, {
        fastest: timed[0].time_display,
        median: mid.time_display,
        gapSeconds: mid.time_seconds - timed[0].time_seconds,
        n: timed.length
      });
    }
  }
  const eightGap = range.get("男子エイト")?.gapSeconds ?? 0;

  // 男子エイトの「まん中の記録」が年ごとにどれだけ動くか
  const eightByYear = new Map<number, number[]>();
  rows
    .filter((r) => r.event_name === "男子エイト" && r.time_seconds > 0)
    .forEach((r) => eightByYear.set(r.year, [...(eightByYear.get(r.year) ?? []), r.time_seconds]));
  const eightMedians = [...eightByYear.values()].map(median);
  const eightMedianMin = Math.min(...eightMedians);
  const eightMedianMax = Math.max(...eightMedians);

  const finalBCount = rows.filter((r) => r.final_group === "Final B").length;
  const firstYear = Math.min(...rows.map((r) => r.year));
  const categoryCount = new Set(rows.map((r) => competitionCategoryOf(r.competition_name)).filter(Boolean)).size;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "記事", item: `${siteUrl}/articles` },
          { "@type": "ListItem", position: 3, name: meta.title, item: `${siteUrl}/articles/${meta.slug}` }
        ]
      },
      {
        "@type": "Article",
        headline: meta.title,
        description: meta.description,
        datePublished: meta.publishedAt,
        dateModified: meta.updatedAt ?? meta.publishedAt,
        author: { "@type": "Person", name: "中村匠" },
        publisher: { "@type": "Organization", name: "レガッタナビ", url: siteUrl },
        mainEntityOfPage: `${siteUrl}/articles/${meta.slug}`
      }
    ]
  };

  return (
    <main className="site-container lp-page article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="breadcrumbs" aria-label="パンくずリスト">
        <Link href="/">ホーム</Link>
        <span aria-hidden="true">›</span>
        <Link href="/articles">記事</Link>
        <span aria-hidden="true">›</span>
        <span>はじめてのボート大会</span>
      </nav>
      <article className="article-body">
        <header className="article-header">
          <p className={articleMeta}>
            <time dateTime={meta.publishedAt}>{formatDate(meta.publishedAt)}</time> · レガッタナビ編集
          </p>
          <h1>はじめてのボート大会</h1>
          <p className="lp-lead">
            大会の当日は、集合と受付、艇の準備、アップ、スタート地点への移動、レース、片付けの順に進みます。結果は当日は主催者の速報、終わったあとは当サイトの大会結果で見られます。この記事は初めてレースに出る人向けに、エントリーから当日の流れ、予選から決勝への組み方、終わったあとのタイムの見方をまとめました。見に行く家族や友人の方は、
            <a href="#progression">予選から決勝までの組み方</a>と<a href="#results">結果はどこで見られるか</a>から読めます。言葉は
            <Link href="/articles/rowing-glossary">ローイング用語集</Link>で先に押さえておくと読みやすくなります。
          </p>
        </header>

        <h2>エントリーは自分でやらない</h2>
        <p>
          大会への申し込みは、部やクラブの単位でまとめて行います。1年生が個人で手続きすることはまずありません。
          誰がどの種目に乗るかはコーチや主将が決め、その名簿がそのまま出場クルーになります。
        </p>
        <p>
          自分の名前が入ったら、種目と艇種を確認しておきます。舵手つきフォアなのか舵手なしフォアなのかで、乗る人数も
          レースの進み方も変わります(艇種の違いは<Link href="/articles/rowing-glossary">用語集</Link>にあります)。
        </p>

        <h2>当日の流れ</h2>
        <p>
          コースに着いてからレースが終わるまで、おおまかにはこの順で進みます。細かい時間は大会の要項と競漕日程で決まっています。主な大会の日程と要項の入口は
          <Link href="/articles/university-championship-guide">インカレのガイド</Link>と
          <Link href="/articles/freshman-championship-guide">全日本新人選手権のガイド</Link>にまとめてあります。
        </p>
        <ol className="mb-0 mt-[1.2em] pl-[1.4em] leading-[1.95]">
          <li>
            <strong>集合と受付</strong>。チームで集まり、当日の連絡事項を確認します。艇やオールの積み降ろしもここで。
          </li>
          <li>
            <strong>艇の準備</strong>。リギング(オールの取り付け位置の調整)を合わせ、シートやストレッチャー(足を固定する台)を自分の位置に調整します。忘れると
            レース直前に慌てることになります。
          </li>
          <li>
            <strong>アップ</strong>。陸で体を動かしてから乗艇します。水上に出る時間も大会側で管理されていることが多いです。
          </li>
          <li>
            <strong>スタート地点へ移動</strong>。発艇時刻(レースが始まる時刻)から逆算して、余裕を持ってコースを上ります。ここで焦らないための
            時間配分が、初めてのうちはいちばん分かりにくいところです。
          </li>
          <li>
            <strong>レース</strong>。多くの大会は2000mです。距離は要項に書いてあります。
          </li>
          <li>
            <strong>帰着と片付け</strong>。艇を上げて洗い、次のクルーに渡すか積み込みます。自分のレースが終わっても
            チームの1日は終わりません。
          </li>
        </ol>
        <p>
          レース前の食事に決まりはありませんが、発艇の直前に固形物を入れると苦しくなります。チームで指示が出ることが多いので、
          先輩に確かめてください。
        </p>

        <h2 id="progression">予選から決勝までの組み方</h2>
        <p>
          出場クルーが多い種目では、1回のレースで順位が決まりません。予選を走り、上位が決勝へ、残りが敗者復活戦(レペチャージ。
          <Link href="/articles/rowing-glossary">用語集</Link>)へ回るのが基本の形です。何艇が勝ち上がるかは大会と種目で変わるので、要項の組み合わせ表を見るのが確実です。
        </p>
        <p>
          決勝は成績順にA、B、Cと分かれていきます(段数は大会や種目で違います)。いちばん上がFinal A、その次がFinal Bです。B決勝は、A決勝に届かなかったという意味では負けですが、予選を勝ち上がった結果としてB決勝に進んでいます。
          収録データでもFinal Bは{finalBCount.toLocaleString("ja-JP")}件あり、そこにも順位とタイムが残ります。この区別は
          <Link href="/articles/rowing-glossary">用語集のFinal AとFinal B</Link>で説明しています。
        </p>

        <h2 id="results">結果はどこで見られるか</h2>
        <p>
          大会当日は、主催者が速報を出します。日本ローイング協会の大会なら大会ページの「レース結果」で、インカレなら
          <Link href="/articles/university-championship-guide">インカレのガイド</Link>に、全日本新人選手権なら
          <Link href="/articles/freshman-championship-guide">全日本新人選手権のガイド</Link>に、その大会ページへのリンクがあります。
        </p>
        <p>
          終わったあとの記録は、当サイトの<Link href="/results">大会結果</Link>から年度と大会をたどって探せます。
          学校名で追うなら<Link href="/organizations">団体別ページ</Link>、種目ごとの歴代の記録なら<Link href="/records">歴代記録</Link>が早いです。
          収録は全日本級の大会で、Final B以上の着順とタイムです。
        </p>

        <h2>自分のタイムをどう見るか</h2>
        <p>
          初めてのレースで出たタイムが速いのか遅いのか、その場では判断がつきません。風と水面で大きく変わるので、
          別の日のタイムと単純に比べても意味が薄いからです。
        </p>
        <p>
          目安として、全日本級の大会でどのあたりに落ち着くかを載せます。収録している{firstYear}年以降の全期間でもっとも速い記録と、
          全記録を並べたときの中央値(真ん中の記録)です。新人戦に出る人は、
          <Link href="/articles/freshman-championship-guide">全日本新人選手権のガイド</Link>に種目別の優勝タイムがあります。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>種目</th>
                <th scope="col" className={articleTh}>最速</th>
                <th scope="col" className={articleTh}>中央値</th>
                <th scope="col" className={articleTh}>収録数</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {SAMPLE_EVENTS.map((name) => {
                const r = range.get(name);
                return (
                  <tr key={name} className={articleTr}>
                    <td data-label="種目" className={`${articleTd} ${articleTdYear}`}>
                      <Link href={`/records/${encodeURIComponent(name)}`}>{name}</Link>
                    </td>
                    <td data-label="最速" className={articleTd}>{r?.fastest ?? "-"}</td>
                    <td data-label="中央値" className={articleTd}>{r?.median ?? "-"}</td>
                    <td data-label="収録数" className={articleTd}>{r ? `${r.n}件` : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p>
          男子エイトでは、最速と中央値で{Math.round(eightGap)}秒ほど開きます。全日本級の決勝に残ったクルーだけを集めてもこれだけ差が出るので、
          最初の1回で出たタイムを歴代最速と比べても意味がありません。年ごとの差も小さくなく、男子エイトの中央値は収録範囲で
          {formatMinSec(eightMedianMin)}から{formatMinSec(eightMedianMax)}のあいだで動いています。比べるなら<Link href="/search">検索</Link>で
          同じ種目・同じ年に絞り、順位帯ごとのタイムを見るのが早いです。次に読むなら、種目や用語を確かめられる
          <Link href="/articles/rowing-glossary">ローイング用語集</Link>です。
        </p>

        <aside className={articleNote}>
          <h3 className={articleNoteTitle}>この記事について</h3>
          <ul className={articleNoteList}>
            <li>当日の進行や勝ち上がりの条件は大会ごとに違います。必ず自分が出る大会の要項を確認してください。</li>
            <li>タイムは当サイトが収録する{firstYear}年以降・全日本級{categoryCount}大会の範囲での数字です。国内の公式記録ではありません。</li>
            <li>収録範囲はFinal B以上のため、予選や敗者復活戦の記録は含みません。</li>
          </ul>
        </aside>
      </article>
    </main>
  );
}
