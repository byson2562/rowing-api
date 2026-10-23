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
    slug: "freshman-championship-guide",
    title: "全日本新人ローイング選手権(ボート)とは | 2026年の日程・種目・歴代優勝クルー",
    description:
      "全日本新人ローイング選手権は例年秋に戸田で開かれる3日間の大会で、2026年の第67回は10月23日(金)から25日(日)。大学のほか、高校や社会人のクルーも出場します。2009年以降の収録データから、2025年の種目別優勝クルーと2位との差、優勝回数の多い団体、種目ごとの勢力図と連続優勝、大学以外の優勝、接戦だった決勝、男子エイトと女子舵手つきクォドルプルの歴代、優勝タイムの幅をまとめました。",
    publishedAt: "2026-10-21",
    updatedAt: "2026-10-22"
  },
  {
    slug: "university-championship-2026-results",
    title: "インカレ(ボート)2026の結果 | 全日本大学ローイング選手権 種目別の優勝校とタイム",
    description:
      "2026年8月26日〜30日に戸田で開かれた第53回全日本大学ローイング選手権(インカレ)の結果。男子エイトは早稲田大学が連覇、女子エイトは立教大学が仙台大学の4連覇を止めました。13種目のFinal A優勝校とタイム、2位との差、前年からの優勝校の入れ替わりを収録データからまとめました。",
    publishedAt: "2026-10-15",
    updatedAt: "2026-10-22"
  },
  {
    slug: "first-regatta",
    title: "はじめてのボート大会 | 当日の流れとレースの組み方、タイムの見方",
    description:
      "初めてレースに出る人向けに、ボート大会の当日の流れをまとめました。エントリーは誰がするのか、コースでの動き方、予選から決勝への勝ち上がり、そして自分のタイムをどう見るか。収録データから種目別のタイムの幅も載せています。",
    publishedAt: "2026-10-22"
  },
  {
    slug: "rowing-glossary",
    title: "ローイング用語集 | 種目・大会・練習でよく出る言葉",
    description:
      "ボート部に入ったばかりの人向けに、ローイングの専門用語をまとめました。スイープとスカルの違い、「4+」の読み方、Final AとB、エルゴやレートまで。種目ごとの最速タイムも収録データから載せています。",
    publishedAt: "2026-07-29"
  },
  {
    slug: "university-championship-guide",
    title: "インカレ(全日本大学ローイング選手権)とは | ボートの種目・歴代優勝校・年別の結果",
    description:
      "インカレ(全日本大学ローイング選手権)は大学ボートの日本一を決める大会で、毎年夏の終わりに戸田で開かれます。種目構成、直近大会の種目別優勝校、男子エイトの歴代優勝、年ごとの結果記事への案内を収録データからまとめました。",
    publishedAt: "2026-07-22",
    updatedAt: "2026-10-15"
  },
  {
    slug: "university-power-map-2009-2025",
    title: "データで見る大学ボートの勢力図 2009-2025 | 金メダル202個はどこへ渡ったか",
    description:
      "全日本大学ローイング選手権のFinal A優勝202件(男子125・女子77)を男女別に集計。男子は日本大学の一強、女子は早稲田の牙城に立命館・仙台大が食い込む。17年分の勢力図の変化を数字で追います。",
    publishedAt: "2026-07-21",
    updatedAt: "2026-10-22"
  }
];

export function getArticle(slug: string): ArticleMeta | undefined {
  return articles.find((a) => a.slug === slug);
}
