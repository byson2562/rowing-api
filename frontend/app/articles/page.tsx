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
    <main className="site-container lp-page">
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
        <div className="grid gap-4">
          {sorted.map((a) => (
            <article
              className="rounded-2xl border border-[#d7e3f4] bg-white px-[22px] py-5"
              key={a.slug}
            >
              <h2 className="m-0 text-[1.2rem] leading-[1.5]">
                <Link
                  href={`/articles/${a.slug}`}
                  className="text-rn-brand no-underline hover:text-rn-primary hover:underline"
                >
                  {a.title}
                </Link>
              </h2>
              <p className="mb-0 mt-2.5 text-[13px] leading-[1.75] text-[#4c6687]">
                <time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time>
              </p>
              <p className="mb-0 mt-2.5 leading-[1.75] text-[#4c6687]">{a.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
