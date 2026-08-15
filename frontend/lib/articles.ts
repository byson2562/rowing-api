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
    slug: "rowing-glossary",
    title: "ローイング用語集 | 種目・大会・練習でよく出る言葉",
    description:
      "ボート部に入ったばかりの人向けに、ローイングの専門用語をまとめました。スイープとスカルの違い、「4+」の読み方、Final AとB、エルゴやレートまで。種目ごとの最速タイムも収録データから載せています。",
    publishedAt: "2026-07-29"
  },
  {
    slug: "university-championship-guide",
    title: "インカレ(全日本大学ローイング選手権)2026 | ボートの日程・種目・歴代優勝校",
    description:
      "インカレ(全日本大学ローイング選手権)は2026年8月26日〜30日に戸田で開催。大学ボート日本一を決める大会の種目構成、2025年の種目別優勝校、男子エイトの歴代優勝、今年の見どころを収録データからまとめました。",
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
