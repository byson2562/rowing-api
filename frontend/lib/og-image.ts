import { siteUrl } from "./site-url";

export type OgTarget = {
  title?: string;
  subtitle?: string;
};

export type OgImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export const OG_DEFAULT_ID = "default";

// cyrb53: 依存なしで使える 53bit ハッシュ。ページ側(URL)と生成側(ファイル名)が
// 同じ (title, subtitle) から同じ id を得るためだけに使うので暗号学的強度は不要
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
 * OG画像のファイル名。title を省略するとブランドマーク+サービス名だけの汎用画像(default)。
 * 画像はビルド時に scripts/generate-og.mjs が out/og/<id>.png として書き出す。
 */
export function ogImageId(target?: OgTarget): string {
  const title = (target?.title ?? "").trim();
  if (!title) return OG_DEFAULT_ID;
  const subtitle = (target?.subtitle ?? "").trim();
  return cyrb53(`${title}\u0000${subtitle}`).toString(16).padStart(14, "0");
}

export function ogImagePath(target?: OgTarget): string {
  return `/og/${ogImageId(target)}.png`;
}

export function ogImageUrl(target?: OgTarget): string {
  return `${siteUrl}${ogImagePath(target)}`;
}

/**
 * metadata.openGraph.images にそのまま渡せる形。
 * Next.jsのmetadataはopenGraphをオブジェクト単位で置換するため、
 * ページ側でopenGraphを定義する場合はimagesも必ず自分で指定する必要がある。
 */
export function ogImages(target?: OgTarget): OgImage[] {
  return [
    {
      url: ogImageUrl(target),
      width: 1200,
      height: 630,
      alt: target?.title ?? "レガッタナビ"
    }
  ];
}
