// 記事一覧・ホームに並ぶサムネイルを、静的PNGとして public/og-thumb/ に書き出す。
//
// ページを開くたびに /og を叩くと satori の画像生成が走り、Cloudflare Workers の
// CPU 制限を超えて Worker 全体が 503 になる(Error 1102)。絵柄は /og が返すものと
// 同一なので、見た目は変わらない。
//
// 記事を追加・改題したら実行して、生成された PNG をコミットする:
//   node scripts/generate-og-thumbs.mjs
//
// 既定では本番の /og から取得する。ローカルの dev サーバーを使う場合:
//   OG_ORIGIN=http://localhost:5173 node scripts/generate-og-thumbs.mjs

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const origin = process.env.OG_ORIGIN ?? "https://regattanavi.jp";
const outDir = join(root, "public", "og-thumb");

// Cloudflare は既定のUAをボットとして弾くことがある
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** lib/articles.ts から slug と title を読む(登録が1か所で済むように) */
async function readArticles() {
  const src = await readFile(join(root, "lib", "articles.ts"), "utf8");
  const re = /slug:\s*"([^"]+)",\s*\n\s*title:\s*"([^"]+)"/g;
  const out = [];
  for (const m of src.matchAll(re)) out.push({ slug: m[1], title: m[2] });
  if (out.length === 0) throw new Error("lib/articles.ts から記事を読み取れませんでした");
  return out;
}

/** 記事タイトル「主題 | 補足」を /og のクエリに割り当てる(articleOgImageUrl と同じ規則) */
function ogUrlFor(title) {
  const [main, ...rest] = title.split("|");
  const params = new URLSearchParams({ title: main.trim() });
  const subtitle = rest.join("|").trim();
  if (subtitle) params.set("subtitle", subtitle);
  return `${origin}/og?${params.toString()}`;
}

async function fetchPng(url, attempts = 6) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (!buf.subarray(0, 8).equals(PNG_MAGIC)) throw new Error("PNGではない応答");
      return buf;
    } catch (err) {
      if (i === attempts) throw err;
      // 生成が重なると 503 が返るので、間隔を空けて再試行する
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

const articles = await readArticles();
await mkdir(outDir, { recursive: true });

for (const { slug, title } of articles) {
  const buf = await fetchPng(ogUrlFor(title));
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  await writeFile(join(outDir, `${slug}.png`), buf);
  console.log(`  ${slug}.png  ${width}x${height}  ${Math.round(buf.length / 1024)}KB`);
  await new Promise((r) => setTimeout(r, 3000));
}

console.log(`${articles.length} 件を ${outDir} に書き出しました`);
