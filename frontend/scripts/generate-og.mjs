// OG画像をビルド時に一括生成する。
//
// next build が out/og-manifest.json(app/og-manifest.json/route.ts)に全ページぶんの
// { id, title, subtitle } を書き出すので、それを読んで out/og/<id>.png を作る。
// ページ側の URL は lib/og-image.ts の ogImageUrl が同じ id から組み立てる。
//
// 絵柄は旧 app/og/route.tsx と同じ(docs/design-rules.md §2): 白地に墨の見出し、左揃え、
// 青はワードマークの下の短い罫線1本だけ。satori を Node から直接呼び、@resvg/resvg-js で PNG にする。
//
//   node scripts/generate-og.mjs                 # out/og-manifest.json → out/og/
//   node scripts/generate-og.mjs --force         # 既存の PNG も作り直す
//   node scripts/generate-og.mjs --manifest x.json --out dir --jobs 4
//
// 枚数が多い(約1,900枚)ので worker_threads で CPU 数ぶん並列に描く。

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// ブランドマーク(public/favicon.svg と同一: 墨のタイルに「レ」)。satori は外部SVG URLを解決できないため data URI で埋め込む
const markDataUri =
  "data:image/svg+xml;base64," +
  "PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDwhLS0g44Os44Ks44OD44K/44OK44OT44Gu44Oe44O844KvKDIwMjYtMTAtMjEpOiDloqjjga7jgr/jgqTjg6vjgavlub7kvZXlrabnmoTjgarjgIzjg6zjgI3jgILop5LkuLjjg7vlvbHjgarjgZfjgIJkb2NzL2Rlc2lnbi1ydWxlcy5tZCDCpzIg44Gu5aKoICMxZjFmMWYgLS0+CiAgPHJlY3Qgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIGZpbGw9IiMxZjFmMWYiLz4KICA8cG9seWxpbmUgcG9pbnRzPSIxNzYsMTEyIDE3NiwzNTIgMzUyLDIwOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjcyIiBzdHJva2UtbGluZWNhcD0ic3F1YXJlIiBzdHJva2UtbGluZWpvaW49Im1pdGVyIi8+Cjwvc3ZnPgo=";

const WIDTH = 1200;
const HEIGHT = 630;
const FONT_FAMILY = "Noto Sans JP";
// 旧 route は見出しとワードマークに太字(700)を指定していたが、next/og が Google Fonts から
// 取れたのは Regular だけで、本番と承認済みサムネイル(旧 public/og-thumb)はすべて 400 で描かれていた。
// 見た目を変えないため 400 に揃える。太字にするなら loadFonts に 700 を足してここを 700 にする
const HEADING_WEIGHT = 400;

function parseArgs(argv) {
  const args = { manifest: join(root, "out", "og-manifest.json"), out: join(root, "out", "og"), force: false, jobs: 0 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--force") args.force = true;
    else if (arg === "--manifest") args.manifest = resolve(argv[++i]);
    else if (arg === "--out") args.out = resolve(argv[++i]);
    else if (arg === "--jobs") args.jobs = Number(argv[++i]);
    else throw new Error(`不明な引数: ${arg}`);
  }
  return args;
}

function truncate(value, maxChars) {
  const chars = Array.from(value);
  if (chars.length <= maxChars) return value;
  return `${chars.slice(0, maxChars).join("")}…`;
}

// satori は React 要素の形({ type, props: { style, children } })を受け取る。JSX なしで組み立てる
const h = (type, style, ...children) => ({
  type,
  props: { style, children: children.length === 1 ? children[0] : children }
});

export function ogElement(rawTitle, rawSubtitle) {
  const title = truncate(rawTitle, 40);
  const subtitle = truncate(rawSubtitle, 50);
  const ink = "#1f1f1f";
  const body = "#3d3d3d";
  const meta = "#6f6f6f";
  const blue = "#1d5fbf";
  const hairline = "#dcdcdc";

  const heading = title
    ? [
        h("div", { fontSize: Array.from(title).length > 18 ? 56 : 68, fontWeight: HEADING_WEIGHT, letterSpacing: "0", lineHeight: 1.3 }, title),
        ...(subtitle ? [h("div", { color: body, fontSize: 30, fontWeight: 400, lineHeight: 1.5 }, subtitle)] : [])
      ]
    : [
        h("div", { fontSize: 68, fontWeight: HEADING_WEIGHT, letterSpacing: "0", lineHeight: 1.3 }, "ローイングの大会結果と記録のデータベース"),
        h(
          "div",
          { color: body, fontSize: 30, fontWeight: 400, lineHeight: 1.5 },
          "全日本級大会の結果を年度・大会・種目・団体で検索、歴代記録、データ分析記事"
        )
      ];

  return h(
    "div",
    {
      background: "#ffffff",
      // satori 単体の既定は content-box なので、% 指定のまま padding を足すとキャンバスからはみ出す。
      // 寸法を数値で与え border-box にする(next/og 時代と同じ見た目)
      boxSizing: "border-box",
      color: ink,
      display: "flex",
      flexDirection: "column",
      fontFamily: FONT_FAMILY,
      height: HEIGHT,
      justifyContent: "space-between",
      padding: "64px 72px 60px",
      width: WIDTH
    },
    h(
      "div",
      { alignItems: "center", display: "flex", gap: "16px" },
      { type: "img", props: { src: markDataUri, width: 40, height: 40 } },
      h("div", { fontSize: 30, fontWeight: HEADING_WEIGHT, letterSpacing: "0.04em" }, "レガッタナビ"),
      h("div", { color: meta, fontSize: 26, fontWeight: 400, marginLeft: "8px" }, "データで見るボート")
    ),
    h("div", { display: "flex", flexDirection: "column", gap: "22px", maxWidth: "1056px" }, ...heading),
    h(
      "div",
      { alignItems: "center", display: "flex", gap: "20px", width: "100%" },
      h("div", { background: blue, height: "6px", width: "120px" }),
      h("div", { background: hairline, flexGrow: 1, height: "1px" }),
      h("div", { color: meta, fontSize: 24, fontWeight: 400 }, "regattanavi.jp")
    )
  );
}

export async function loadFonts() {
  const dir = join(root, "node_modules", "@fontsource", "noto-sans-jp", "files");
  // 和文サブセットだけだと英数字が入らないことがあるので latin も同じウェイトで積む
  const files = [
    ["japanese", 400],
    ["latin", 400]
  ];
  return Promise.all(
    files.map(async ([subset, weight]) => ({
      name: FONT_FAMILY,
      data: await readFile(join(dir, `noto-sans-jp-${subset}-${weight}-normal.woff`)),
      weight,
      style: "normal"
    }))
  );
}

async function renderWorker() {
  const [{ default: satori }, { Resvg }] = await Promise.all([import("satori"), import("@resvg/resvg-js")]);
  const fonts = await loadFonts();
  const { items, outDir } = workerData;
  for (const item of items) {
    const svg = await satori(ogElement(item.title, item.subtitle), { width: WIDTH, height: HEIGHT, fonts });
    const png = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH }, font: { loadSystemFonts: false } }).render().asPng();
    await writeFile(join(outDir, `${item.id}.png`), png);
    parentPort.postMessage({ done: 1 });
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const started = Date.now();
  const manifest = JSON.parse(await readFile(args.manifest, "utf8"));
  if (!Array.isArray(manifest)) throw new Error(`${args.manifest} が配列ではありません`);
  await mkdir(args.out, { recursive: true });

  const pending = [];
  for (const item of manifest) {
    if (!item || typeof item.id !== "string") throw new Error(`不正な項目: ${JSON.stringify(item)}`);
    if (!args.force && (await exists(join(args.out, `${item.id}.png`)))) continue;
    pending.push({ id: item.id, title: item.title ?? "", subtitle: item.subtitle ?? "" });
  }
  console.log(`OG画像: 一覧 ${manifest.length} 件、生成 ${pending.length} 件(既存 ${manifest.length - pending.length} 件はスキップ)`);
  if (pending.length === 0) return;

  const jobs = Math.max(1, Math.min(args.jobs || availableParallelism(), pending.length));
  const chunks = Array.from({ length: jobs }, () => []);
  pending.forEach((item, index) => chunks[index % jobs].push(item));

  let done = 0;
  let lastLogged = 0;
  await Promise.all(
    chunks.map(
      (items) =>
        new Promise((resolveWorker, reject) => {
          const worker = new Worker(fileURLToPath(import.meta.url), { workerData: { items, outDir: args.out } });
          worker.on("message", () => {
            done += 1;
            if (done - lastLogged >= 200 || done === pending.length) {
              lastLogged = done;
              console.log(`  ${done}/${pending.length}`);
            }
          });
          worker.on("error", reject);
          worker.on("exit", (code) => (code === 0 ? resolveWorker() : reject(new Error(`worker exit ${code}`))));
        })
    )
  );
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`${pending.length} 枚を ${args.out} に書き出しました(${jobs} 並列、${seconds} 秒)`);
}

// import されたとき(テストなど)は何も走らせない。CLI として起動されたときだけ main、worker スレッドでは描画
const isEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (!isMainThread) {
  renderWorker().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else if (isEntry) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
