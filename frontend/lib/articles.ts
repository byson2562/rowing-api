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
    slug: "university-championship-guide",
    title: "全日本大学ローイング選手権(インカレ)とは | 2026年の日程・種目・歴代優勝校",
    description:
      "大学ボート日本一を決める全日本大学ローイング選手権(インカレ)のガイド。2026年は8月26日〜30日に戸田で開催。種目構成、2025年の種目別優勝校、男子エイトの歴代優勝、今年の見どころを収録データからまとめました。",
    publishedAt: "2026-07-22"
  },
  {
    slug: "university-power-map-2009-2025",
    title: "データで見る大学ボートの勢力図 2009-2025 | 金メダル202個はどこへ渡ったか",
    description:
      "全日本大学ローイング選手権のFinal A優勝202件(男子125・女子77)を男女別に集計。男子は日本大学の一強、女子は早稲田の牙城に立命館・仙台大が食い込む。17年分の勢力図の変化を数字で追います。",
    publishedAt: "2026-07-21"
  }
];

export function getArticle(slug: string): ArticleMeta | undefined {
  return articles.find((a) => a.slug === slug);
}
