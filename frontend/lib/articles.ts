// 記事のメタデータレジストリ。一覧ページとサイトマップが参照する。
// 本文は app/articles/<slug>/page.tsx に静的ルートとして置く。

export type ArticleMeta = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // YYYY-MM-DD
  updatedAt?: string;
};

export const articles: ArticleMeta[] = [
  {
    slug: "university-power-map-2009-2025",
    title: "データで見る大学ボートの勢力図 2009-2025 | 金メダル202個はどこへ渡ったか",
    description:
      "全日本大学ローイング選手権のFinal A優勝202件をレガッタナビの収録データから集計。日本大学の連覇時代から仙台大学の台頭まで、17年分の勢力図の変化を数字で追います。",
    publishedAt: "2026-07-21"
  }
];

export function getArticle(slug: string): ArticleMeta | undefined {
  return articles.find((a) => a.slug === slug);
}
