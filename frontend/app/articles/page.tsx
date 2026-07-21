import type { Metadata } from "next";
import Link from "next/link";

import { articles } from "../../lib/articles";

export const metadata: Metadata = {
  title: "記事・データ分析",
  description:
    "レガッタナビ収録の大会記録データをもとにした、ローイング(ボート)の分析記事・コラムの一覧です。",
  alternates: {
    canonical: "/articles"
  },
  openGraph: {
    title: "記事・データ分析 | レガッタナビ",
    description:
      "レガッタナビ収録の大会記録データをもとにした、ローイング(ボート)の分析記事・コラムの一覧です。",
    url: "/articles"
  }
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

export default function ArticlesPage() {
  const sorted = [...articles].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  return (
    <main className="container lp-page">
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-top">
            <h1>記事・データ分析</h1>
            <p className="lp-lead">
              レガッタナビに収録している大会記録データをもとにした分析記事です。検索だけでは見えない、日本のローイングの流れを数字で追います。
            </p>
          </div>
        </div>
      </section>

      <section aria-label="記事一覧">
        <div className="article-list">
          {sorted.map((a) => (
            <article className="article-card" key={a.slug}>
              <h2>
                <Link href={`/articles/${a.slug}`}>{a.title}</Link>
              </h2>
              <p className="article-card-meta">
                <time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time>
              </p>
              <p>{a.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
