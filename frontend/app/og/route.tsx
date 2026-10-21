import { ImageResponse } from "next/og";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// OpenNext(Cloudflare Workers)は edge runtime 宣言に非対応。既定のランタイムで動かす

// ブランドマーク(public/favicon.svg と同一: 墨のタイルに「レ」)。satori は外部SVG URLを解決できないため data URI で埋め込む
const markDataUri =
  "data:image/svg+xml;base64," +
  "PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDwhLS0g44Os44Ks44OD44K/44OK44OT44Gu44Oe44O844KvKDIwMjYtMTAtMjEpOiDloqjjga7jgr/jgqTjg6vjgavlub7kvZXlrabnmoTjgarjgIzjg6zjgI3jgILop5LkuLjjg7vlvbHjgarjgZfjgIJkb2NzL2Rlc2lnbi1ydWxlcy5tZCDCpzIg44Gu5aKoICMxZjFmMWYgLS0+CiAgPHJlY3Qgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIGZpbGw9IiMxZjFmMWYiLz4KICA8cG9seWxpbmUgcG9pbnRzPSIxNzYsMTEyIDE3NiwzNTIgMzUyLDIwOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjcyIiBzdHJva2UtbGluZWNhcD0ic3F1YXJlIiBzdHJva2UtbGluZWpvaW49Im1pdGVyIi8+Cjwvc3ZnPgo=";

function truncate(value: string, maxChars: number): string {
  const chars = Array.from(value);
  if (chars.length <= maxChars) return value;
  return `${chars.slice(0, maxChars).join("")}…`;
}

/**
 * 生成した画像をエッジにキャッシュして返す。
 *
 * satori での画像生成は CPU を大きく使い、Workers の無料枠では短時間に複数回走ると
 * リソース上限に達して Worker 全体が停止する(Error 1102)。Workers のレスポンスは
 * 明示しないとエッジにキャッシュされないため、ここで caches.default に入れる。
 * ページ内のサムネイルは public/og-thumb/ の静的PNGを使っており、この経路は
 * OGPメタタグ経由(SNS・クローラー)のアクセスが中心。
 */
export async function GET(request: Request) {
  // next dev など Workers 以外では caches.default が無いので、その場合は素通しする
  const edgeCache = (globalThis as { caches?: { default?: Cache } }).caches?.default;

  // Next.js が渡す Request をそのまま Cache API に渡すと Invalid URL になるため、
  // URL から素の Request を作ってキャッシュキーにする
  const cacheKey = new Request(new URL(request.url).toString(), { method: "GET" });

  if (edgeCache) {
    const hit = await edgeCache.match(cacheKey);
    if (hit) return hit;
  }

  const image = renderOgImage(request);
  if (!edgeCache) return image;

  // ImageResponse の body は一度しか読めないため、実体を取り出して2つ作る
  const body = await image.arrayBuffer();
  const headers = new Headers(image.headers);
  try {
    const { ctx } = getCloudflareContext();
    ctx.waitUntil(edgeCache.put(cacheKey, new Response(body, { headers })));
  } catch {
    // コンテキストが取れない環境ではキャッシュを諦めて画像だけ返す
  }
  return new Response(body, { headers });
}

function renderOgImage(request: Request): ImageResponse {
  const { searchParams } = new URL(request.url);
  const rawTitle = (searchParams.get("title") ?? "").trim();
  const rawSubtitle = (searchParams.get("subtitle") ?? "").trim();
  const title = truncate(rawTitle, 40);
  const subtitle = truncate(rawSubtitle, 50);

  // 日経ビジュアルデータ寄り(docs/design-rules.md §2): 白地に墨の見出し、左揃え、
  // 青はワードマークの下の短い罫線1本だけ。グラデーション・影・角丸は使わない
  const ink = "#1f1f1f";
  const body = "#3d3d3d";
  const meta = "#6f6f6f";
  const blue = "#1d5fbf";
  const hairline = "#dcdcdc";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#ffffff",
          color: ink,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "64px 72px 60px",
          width: "100%"
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: "16px" }}>
          <img src={markDataUri} alt="" width={40} height={40} />
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "0.04em" }}>レガッタナビ</div>
          <div style={{ color: meta, fontSize: 26, fontWeight: 400, marginLeft: "8px" }}>データで見るボート</div>
        </div>

        {title ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: "1056px" }}>
            <div
              style={{
                fontSize: Array.from(title).length > 18 ? 56 : 68,
                fontWeight: 700,
                letterSpacing: "0",
                lineHeight: 1.3
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div style={{ color: body, fontSize: 30, fontWeight: 400, lineHeight: 1.5 }}>{subtitle}</div>
            ) : null}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: "1056px" }}>
            <div style={{ fontSize: 68, fontWeight: 700, letterSpacing: "0", lineHeight: 1.3 }}>
              ローイングの大会結果と記録のデータベース
            </div>
            <div style={{ color: body, fontSize: 30, fontWeight: 400, lineHeight: 1.5 }}>
              全日本級大会の結果を年度・大会・種目・団体で検索、歴代記録、データ分析記事
            </div>
          </div>
        )}

        <div style={{ alignItems: "center", display: "flex", gap: "20px", width: "100%" }}>
          <div style={{ background: blue, height: "6px", width: "120px" }} />
          <div style={{ background: hairline, flexGrow: 1, height: "1px" }} />
          <div style={{ color: meta, fontSize: 24, fontWeight: 400 }}>regattanavi.jp</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
