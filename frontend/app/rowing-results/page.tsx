import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ローイング・ボート記録・大会結果",
  description:
    "ローイング（ボート）記録を大会・年度・種目・団体で検索できるRowingAPIの案内ページ。全日本ローイング選手権を含む主要大会結果を横断して確認できます。",
  alternates: {
    canonical: "/rowing-results"
  },
  openGraph: {
    title: "ローイング・ボート記録・大会結果 | RowingAPI",
    description:
      "ローイング（ボート）記録を大会・年度・種目・団体で検索できるRowingAPIの案内ページ。全日本ローイング選手権を含む主要大会結果に対応。",
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
        <img
          className="lp-hero-preview"
          src="/lp-fv-screenshot.png"
          alt="RowingAPI検索画面のプレビュー"
          width={1446}
          height={1138}
        />
        <div className="lp-hero-actions">
          <Link href="/" className="lp-btn lp-btn-primary">
            今すぐ検索を始める
          </Link>
        </div>
      </section>

      <section aria-labelledby="lp-features-heading">
        <h2 id="lp-features-heading" className="lp-section-title">主な特徴</h2>
        <div className="lp-value-grid">
        <article className="lp-value-card">
          <h3><span className="lp-heading-icon" aria-hidden="true">🔎</span>横断検索</h3>
          <p>大会・年・種目・団体の条件を組み合わせて、目的のレース結果を素早く絞り込み。</p>
        </article>
        <article className="lp-value-card">
          <h3><span className="lp-heading-icon" aria-hidden="true">📊</span>可視化</h3>
          <p>団体別の金メダル数・メダル数をグラフで確認し、勢力図の変化を把握。</p>
        </article>
        <article className="lp-value-card">
          <h3><span className="lp-heading-icon" aria-hidden="true">⏱</span>時系列比較</h3>
          <p>種目ごとの優勝タイム推移を追い、記録トレンドを直感的に分析。</p>
        </article>
        </div>
      </section>

      <section className="lp-detail" aria-labelledby="lp-detail-heading">
        <h2 id="lp-detail-heading" className="lp-section-title">機能とデータ概要</h2>
        <div className="lp-detail-main">
          <h3>RowingAPIでできること</h3>
          <ul>
            <li>ローイング記録の検索（年・大会・種目・団体）</li>
            <li>Final A基準での団体別メダル傾向の可視化</li>
            <li>種目別の優勝タイム推移の確認</li>
            <li>ページングで大量データを段階的に閲覧</li>
          </ul>
        </div>
        <aside className="lp-detail-side">
          <h3>データ概要</h3>
          <dl className="lp-summary-list">
            <div>
              <dt>収録データ</dt>
              <dd>現在は2009年から2025年までの大会記録を掲載しています（Final B以上が対象）。</dd>
            </div>
            <div>
              <dt>集計対象大会</dt>
              <dd>
                集計対象は全日本級の大会です。
                <ul>
                  <li>全日本ローイング選手権（全日本選手権）</li>
                  <li>全日本大学ローイング選手権（全日本大学選手権）</li>
                  <li>全日本新人ローイング選手権（全日本新人選手権）</li>
                  <li>全日本軽量級選手権</li>
                </ul>
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="lp-author-section" aria-labelledby="lp-author-heading">
        <h2 id="lp-author-heading" className="lp-section-title">開発者について</h2>
        <div className="lp-author">
          <h3>プロフィール</h3>
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
          <h3 className="lp-tech-heading">技術スタック</h3>
          <ul className="lp-tech-list" aria-label="技術スタック">
            <li>
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rails/rails-plain.svg" alt="" width={18} height={18} />
              <span>Ruby on Rails</span>
            </li>
            <li>
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" alt="" width={18} height={18} />
              <span>MySQL</span>
            </li>
            <li>
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" alt="" width={18} height={18} />
              <span>Next.js</span>
            </li>
            <li>
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" alt="" width={18} height={18} />
              <span>TypeScript</span>
            </li>
            <li>
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" alt="" width={18} height={18} />
              <span>Docker</span>
            </li>
            <li>
              <img
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg"
                alt=""
                width={22}
                height={18}
              />
              <span>AWS</span>
            </li>
          </ul>
        </div>
      </section>

    </main>
  );
}
