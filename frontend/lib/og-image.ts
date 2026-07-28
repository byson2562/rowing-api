import { siteUrl } from "./site-url";

export type OgImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

/**
 * OGP画像(/og の動的生成)のURLを組み立てる。
 * title を省略するとブランドマーク+サービス名だけの汎用画像になる。
 */
export function ogImageUrl(title?: string, subtitle?: string): string {
  if (!title) return `${siteUrl}/og`;
  const params = new URLSearchParams({ title });
  if (subtitle) params.set("subtitle", subtitle);
  return `${siteUrl}/og?${params.toString()}`;
}

/**
 * metadata.openGraph.images にそのまま渡せる形。
 * Next.jsのmetadataはopenGraphをオブジェクト単位で置換するため、
 * ページ側でopenGraphを定義する場合はimagesも必ず自分で指定する必要がある。
 */
export function ogImages(title?: string, subtitle?: string): OgImage[] {
  return [
    {
      url: ogImageUrl(title, subtitle),
      width: 1200,
      height: 630,
      alt: title ?? "レガッタナビ"
    }
  ];
}
