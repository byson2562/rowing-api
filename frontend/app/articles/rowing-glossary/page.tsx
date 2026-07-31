import type { Metadata } from "next";
import Link from "next/link";

import { allResults } from "../../../lib/results-data";
import { getArticle } from "../../../lib/articles";
import { siteUrl } from "../../../lib/site-url";
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

const meta = getArticle("rowing-glossary")!;

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
        url: `${siteUrl}/og?title=${encodeURIComponent("ローイング用語集")}&subtitle=${encodeURIComponent("種目・大会・練習でよく出る言葉")}`,
        width: 1200,
        height: 630,
        alt: meta.title
      }
    ]
  }
};

// 記事で解説する主要13種目。人数・オールの本数・舵手の有無をここで持つ
const EVENTS = [
  { name: "男子エイト", crew: "8人", oar: "スイープ", cox: true },
  { name: "女子エイト", crew: "8人", oar: "スイープ", cox: true },
  { name: "男子舵手つきフォア", crew: "4人+舵手", oar: "スイープ", cox: true },
  { name: "女子舵手つきフォア", crew: "4人+舵手", oar: "スイープ", cox: true },
  { name: "男子フォア", crew: "4人", oar: "スイープ", cox: false },
  { name: "男子クォドルプル", crew: "4人", oar: "スカル", cox: false },
  { name: "女子クォドルプル", crew: "4人", oar: "スカル", cox: false },
  { name: "男子ダブルスカル", crew: "2人", oar: "スカル", cox: false },
  { name: "女子ダブルスカル", crew: "2人", oar: "スカル", cox: false },
  { name: "男子ペア", crew: "2人", oar: "スイープ", cox: false },
  { name: "女子ペア", crew: "2人", oar: "スイープ", cox: false },
  { name: "男子シングルスカル", crew: "1人", oar: "スカル", cox: false },
  { name: "女子シングルスカル", crew: "1人", oar: "スカル", cox: false }
];

export default async function RowingGlossary() {
  const rows = await allResults();

  // 種目ごとの最速タイム(収録データ内。Final A/B を問わず全レコードから)
  const fastest = new Map<string, { time: string; org: string; year: number; seconds: number }>();
  for (const row of rows) {
    if (row.time_seconds <= 0) continue;
    const current = fastest.get(row.event_name);
    if (!current || row.time_seconds < current.seconds) {
      fastest.set(row.event_name, {
        time: row.time_display,
        org: row.organization,
        year: row.year,
        seconds: row.time_seconds
      });
    }
  }

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
        <span>ローイング用語集</span>
      </nav>
      <article className="article-body">
        <header className="article-header">
          <p className={articleMeta}>
            <time dateTime={meta.publishedAt}>2026年7月29日</time> · レガッタナビ編集
          </p>
          <h1>ローイング用語集</h1>
          <p className="lp-lead">
            入部して最初のひと月は、先輩が何を言っているのか半分も分かりません。「今日フォア乗って」「レート22で」「B決勝からな」。自分も1年生の春はそうでした。ここでは、艇の上と陸で飛び交う言葉を一通り並べます。
          </p>
        </header>

        <h2>スイープとスカル</h2>
        <p>
          1人でオールを<strong>1本</strong>持つのがスイープ、
          <strong>2本</strong>持つのがスカル。種目名はほぼこの区別でできています。
        </p>
        <p>
          エイト、フォア、ペアはスイープ。シングルスカル、ダブルスカル、クォドルプルはスカル。名前に「スカル」と付いていないのにスカル種目なのがクォドルプル(舵手つきクォドルプルも同じ)。ここは最初に戸惑うところです。
        </p>

        <h2>種目の一覧</h2>
        <p>
          全日本級の大会で行われる主な13種目です。タイムは当サイトが収録している2009年以降・全日本級5大会の中での最速。国内の公式記録ではなく、あくまで収録範囲での数字です。種目名をクリックすると歴代の記録一覧に飛べます。
        </p>
        <div className={articleTableWrap}>
          <table className={articleTable}>
            <thead className={articleThead}>
              <tr>
                <th scope="col" className={articleTh}>種目</th>
                <th scope="col" className={articleTh}>人数</th>
                <th scope="col" className={articleTh}>オール</th>
                <th scope="col" className={articleTh}>収録内の最速</th>
              </tr>
            </thead>
            <tbody className={articleTbody}>
              {EVENTS.map((e) => {
                const best = fastest.get(e.name);
                return (
                  <tr key={e.name} className={articleTr}>
                    <td data-label="種目" className={`${articleTd} ${articleTdYear}`}>
                      <Link href={`/records/${encodeURIComponent(e.name)}`}>{e.name}</Link>
                    </td>
                    <td data-label="人数" className={articleTd}>{e.crew}</td>
                    <td data-label="オール" className={articleTd}>{e.oar}</td>
                    <td data-label="収録内の最速" className={articleTd}>
                      {best ? `${best.time}（${best.org}・${best.year}年）` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p>
          このほか、舵手つきクォドルプル、舵手つきペア、パラローイング(PR1・PR3)、マスターズの年齢別種目も大会によって行われます。
        </p>

        <h2>舵手(コックス)</h2>
        <p>
          漕がずに舵を取り、コールでクルーを動かす役。英語のcoxswainを略してコックス、あるいは略さず舵手と呼びます。エイトには必ず乗り、フォアには乗る種目と乗らない種目の両方があります。
        </p>
        <p>
          種目名で「舵手つきフォア」とあれば舵手あり、単に「フォア」なら舵手なし。海外表記だと「4+」と「4-」で、プラスが舵手つき、マイナスが舵手なしです。数字は漕手の人数なので、4+は舵手を入れて5人が乗ります。当サイトでは<strong>舵手なしの種目名から「舵手なし」を省いて</strong>「男子フォア」「男子ペア」のように表記しています。
        </p>

        <h2>ポジション(乗る位置)</h2>
        <p>
          漕手の位置は舳先(へさき)側から数えます。先頭が<strong>バウ</strong>で1番、艫(とも)に向かって2番、3番と続き、
          一番艫側に座るのが<strong>ストローク</strong>。日本語では整調(せいちょう)と呼びます。エイトなら整調が8番、フォアなら4番です。
        </p>
        <p>整調がリズムを作り、ほかの漕手はその漕ぎに合わせます。</p>

        <h2>ストロークサイドとバウサイド</h2>
        <p>
          スイープでは1人が左右どちらか一方にオールを出します。この左右にも名前があり、進行方向に向かって
          左舷が<strong>ストロークサイド</strong>、右舷が<strong>バウサイド</strong>。漕手は進行方向に背を向けて座るので、
          ストロークサイドは自分の右手側になります。
        </p>
        <p>
          名前のとおり整調がストロークサイドに入るのが基本ですが、整調をバウサイドに置く
          <strong>バウサイド整調</strong>の組み方もあります。どちらであっても、漕手は左右交互に並びます。
        </p>
        <p>
          「バウサイドだけ漕いで」のように片舷へ指示が飛ぶことがよくあるので、自分がどちら側かは最初に覚えることになります。
        </p>

        <h2>艇まわりの言葉</h2>
        <p>
          <strong>リガー</strong>は艇の外に張り出した金属の枠で、ここにオールを固定します。
          <strong>シート</strong>は座席で、レールの上を前後に滑ります(スライド)。足を固定する台が
          <strong>ストレッチャー</strong>、オールの先端、水を掻く平たい部分が<strong>ブレード</strong>。
        </p>

        <h2>軽量級</h2>
        <p>
          体重制限のあるクラスです。国際規定では男子が個人72.5kg以下・クルー平均70.0kg以下、女子が個人59.0kg以下・クルー平均57.0kg以下。ただし国内大会は規定が異なる年もあるので、出る前に必ず要項を見てください。計量はレースの1〜2時間前に行われるのが一般的です。
        </p>

        <h2>Final AとFinal B</h2>
        <p>
          エントリーが多い種目は、予選を勝ち上がった上位6艇でFinal A(A決勝)を漕ぎます。優勝が決まるのはここ。次の6艇がFinal B(B決勝)で7〜12位を争います。
        </p>
        <p>
          予選で敗れた艇にもう一度チャンスを与えるレースを<strong>敗者復活戦(レペチャージ)</strong>と呼びます。当サイトが収録しているのはFinal AとFinal Bの結果で、予選と敗者復活は含めていません。全レースを見たいときは
          <a href="https://www.jara.or.jp/" target="_blank" rel="noopener noreferrer">日本ローイング協会</a>
          の公式リザルトが一次情報です。
        </p>

        <h2>練習で毎日出てくる言葉</h2>
        <p>
          <strong>エルゴ</strong>は室内のローイングマシン(ローイングエルゴメーター)。冬場の陸トレの主役で、2000mのタイムが実力の物差しとして使われます。「エルゴ何分?」は自己紹介みたいなものです。
        </p>
        <p>
          <strong>レート</strong>は1分間に漕ぐ回数(spm)。レース中は艇種にもよりますが32〜40くらい、練習の低レートメニューだと18〜22あたり。「レート20で1時間」と言われたら長い練習の合図です。
        </p>
        <p>
          1本の漕ぎは、オールを水に入れる<strong>キャッチ</strong>、水中で押す<strong>ドライブ</strong>、抜く
          <strong>フィニッシュ</strong>、戻る<strong>リカバリー</strong>の4つに分けて説明されます。「キャッチが遅い」と言われたら、ブレードを入れる動作そのものが遅いか、周りとタイミングがずれているかのどちらかです。
        </p>
        <p>
          強度の呼び方は<strong>パドル</strong>(全力に近い)と<strong>コンスタント</strong>(一定ペース)が基本。レース終盤に上げるのが<strong>スパート</strong>です。
        </p>

        <h2>よくある質問</h2>
        <p>
          <strong>レースは何メートル?</strong>
          <br />
          全日本級の大会は2000mです。当サイトが収録している5大会は、マスターズやパラローイングの種目も含めてすべて2000m。
          高校の大会は1000mで行われるのが一般的です。
        </p>
        <p>
          <strong>「4+」と「4-」の違いは?</strong>
          <br />
          舵手がいるかどうか。+が舵手つき、-が舵手なしです。
        </p>
        <p>
          <strong>レートを上げれば速くなる?</strong>
          <br />
          基本的には上がります。ただし艇速は「レート×1本あたりの進み」で決まるので、レートを上げた分だけ1本の質が落ちると、かえって速くなりません。低レートで1本の進みを伸ばす練習が多いのはそのためです。
        </p>

        <div className={articleNote}>
          <p className={articleNoteTitle}>この記事について</p>
          <ul className={articleNoteList}>
            <li>タイムは当サイト収録の全日本級5大会・2009年以降のデータ内での最速です。国内公式記録ではありません。</li>
            <li>軽量級の体重規定と大会の実施種目は年度によって変わります。出場前に大会要項で確認してください。</li>
            <li>用語の呼び方は地域や学校によって差があります。ここに書いたのは戸田周辺で一般的なものです。</li>
          </ul>
        </div>

        <p>
          用語が分かると、リザルトが読めるようになります。読めるようになると、他大学の艇速が気になってくる。そこまで来たらもう抜けられません。
          <Link href="/results">大会結果</Link>から、まず自分の学校・団体を探してみてください。
        </p>
      </article>
    </main>
  );
}
