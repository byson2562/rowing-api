import type { Metadata } from "next";
import Link from "next/link";

import { articles } from "../../lib/articles";
import { siteUrl } from "../../lib/site-url";
import { articleOgImageUrl, ogImages } from "../../lib/og-image";

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
    images: ogImages("記事・データ分析", "ローイング大会結果データベース")
  }
};

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
    <main className="site-container lp-page">
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

      <section aria-labelledby="articles-list-heading">
        <h2 id="articles-list-heading" className="lp-section-title">記事一覧</h2>
        {/* ヒーロー(白+枠線)と区別するため、カードはサイト共通の枠線なし+ソフト影 */}
        <div className="mt-3.5 grid gap-3">
          {sorted.map((a) => (
            <article
              className="flex gap-4 rounded-xl bg-white p-[18px] shadow-rn-soft transition-[box-shadow,transform] duration-[180ms] hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(16,42,80,0.1)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 max-[640px]:flex-col"
              key={a.slug}
            >
              {/* サムネイルはOGP画像(/og)の使い回し。見出しのリンクと重複するため
                  スクリーンリーダー・タブ移動からは外す */}
              <Link
                href={`/articles/${a.slug}`}
                className="block shrink-0 no-underline max-[640px]:w-full md:w-[240px]"
                aria-hidden="true"
                tabIndex={-1}
              >
                <img
                  src={articleOgImageUrl(a.title)}
                  alt=""
                  width={1200}
                  height={630}
                  loading="lazy"
                  className="block h-auto w-full rounded-[8px] border border-rn-border-soft"
                />
              </Link>
              <div className="min-w-0">
                <p className="m-0 text-[12px] font-bold text-rn-muted [font-variant-numeric:tabular-nums]">
                  <time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time>
                </p>
                <h3 className="mb-0 mt-1.5 text-[1.05rem] leading-[1.5]">
                  <Link
                    href={`/articles/${a.slug}`}
                    className="text-rn-brand no-underline hover:text-rn-primary hover:underline"
                  >
                    {a.title}
                  </Link>
                </h3>
                <p className="mb-0 mt-2 text-[14px] leading-[1.75] text-[#4c6687]">{a.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
