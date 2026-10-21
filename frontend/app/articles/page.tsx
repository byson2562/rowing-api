import type { Metadata } from "next";
import Link from "next/link";

import { articles } from "../../lib/articles";
import { siteUrl } from "../../lib/site-url";
import { ogImages } from "../../lib/og-image";
import { FIXED_OG } from "../../lib/og-targets";

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
    url: "/articles",
    images: ogImages(FIXED_OG.articles)
  }
};

// 一覧は箱にせず、下罫線の行で並べる(ホームの記事列と同じ言語)
const list = "m-0 mt-2 list-none p-0";
const row = "flex flex-col gap-3 border-b border-rn-border py-7 first:pt-2";
const rowDate = "m-0 text-[13px] leading-[1.6] text-rn-meta [font-variant-numeric:tabular-nums]";
const rowTitle = "m-0 text-[24px] font-bold leading-[1.45] text-rn-text [text-wrap:balance]";
const rowTitleLink = "text-rn-text no-underline hover:underline";
const rowDesc = "m-0 max-w-[60ch] text-[15px] leading-[1.9] text-rn-muted";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

export default function ArticlesPage() {
  const sorted = [...articles].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "記事", item: `${siteUrl}/articles` }
    ]
  };

  return (
    <main className="site-container lp-page article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <nav className="breadcrumbs" aria-label="パンくずリスト">
        <Link href="/">ホーム</Link>
        <span aria-hidden="true">›</span>
        <span>記事</span>
      </nav>
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
        <ul className={list}>
          {sorted.map((a) => (
            <li key={a.slug} className={row}>
              <p className={rowDate}>
                <time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time>
                {a.updatedAt ? (
                  <>
                    {" "}
                    · <time dateTime={a.updatedAt}>{formatDate(a.updatedAt)}</time> 更新
                  </>
                ) : null}
              </p>
              <h2 className={rowTitle}>
                <Link href={`/articles/${a.slug}`} className={rowTitleLink}>
                  {a.title}
                </Link>
              </h2>
              <p className={rowDesc}>{a.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
