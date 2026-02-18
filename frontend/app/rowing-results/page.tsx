import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ローイング記録・大会結果",
  description:
    "ローイング記録を大会・年度・種目・団体で検索できるRowingAPIの案内ページ。日本の主要大会結果を横断して確認できます。",
  alternates: {
    canonical: "/rowing-results"
  },
  openGraph: {
    title: "ローイング記録・大会結果 | RowingAPI",
    description:
      "ローイング記録を大会・年度・種目・団体で検索できるRowingAPIの案内ページ。",
    url: "/rowing-results"
  }
};

export default function RowingResultsPage() {
  return (
    <main className="container lp-page">
      <section className="lp-hero">
        <p className="lp-kicker">Rowing Results Database</p>
        <h1>ローイング記録・大会結果を、ひとつの画面で。</h1>
        <p className="lp-lead">
          年度・大会名・種目・Final・団体を横断して検索し、メダル傾向と優勝タイム推移までまとめて確認できます。
          日本の主要大会記録を、比較しやすい形で素早くたどれます。
        </p>
        <div className="lp-hero-actions">
          <Link href="/" className="lp-btn lp-btn-primary">
            今すぐ検索を始める
          </Link>
        </div>
      </section>

      <section className="lp-value-grid" aria-label="主な特徴">
        <article className="lp-value-card">
          <h2>横断検索</h2>
          <p>大会・年・種目・団体の条件を組み合わせて、目的のレース結果を素早く絞り込み。</p>
        </article>
        <article className="lp-value-card">
          <h2>可視化</h2>
          <p>団体別の金メダル数・メダル数をグラフで確認し、勢力図の変化を把握。</p>
        </article>
        <article className="lp-value-card">
          <h2>時系列比較</h2>
          <p>種目ごとの優勝タイム推移を追い、記録トレンドを直感的に分析。</p>
        </article>
      </section>

      <section className="lp-detail">
        <div className="lp-detail-main">
          <h2>RowingAPIでできること</h2>
          <ul>
            <li>ローイング記録の検索（年・大会・種目・団体）</li>
            <li>Final A基準での団体別メダル傾向の可視化</li>
            <li>種目別の優勝タイム推移の確認</li>
            <li>ページングで大量データを段階的に閲覧</li>
          </ul>
        </div>
        <aside className="lp-detail-side">
          <h3>収録データ</h3>
          <p>現在は2009年から2025年までの大会記録を掲載しています。</p>
          <h3>おすすめの使い方</h3>
          <p>まず「年」と「Final」で絞り込んでから、種目や団体で比較すると探しやすくなります。</p>
        </aside>
      </section>

      <section className="lp-author">
        <h2>開発者について</h2>
        <p>
          本サービスは <strong>中村匠</strong> が開発・運営しています。データ整備と検索体験の改善を継続し、
          ローイング記録を調べやすい形で提供することを目指しています。
        </p>
        <dl className="lp-author-meta">
          <div>
            <dt>連絡先</dt>
            <dd>
              <a href="mailto:takumi.nakamura.by@gmail.com">takumi.nakamura.by@gmail.com</a>
            </dd>
          </div>
          <div>
            <dt>経歴</dt>
            <dd>
              早稲田大学漕艇部OB（2015年卒）
              <br />
              関東学連OB（2014 - 2015年 水路部長）
            </dd>
          </div>
        </dl>
      </section>

    </main>
  );
}
