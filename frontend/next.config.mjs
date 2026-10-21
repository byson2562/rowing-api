/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 完全静的サイト。next build が out/ に HTML・JS・JSON を書き出し、Cloudflare Workers の
  // Static Assets がそのまま配信する(wrangler.jsonc)。サーバー実行は無いので、
  // searchParams を読むページ・Route Handler の request 依存・redirects() は使えない。
  // 旧 redirects() は public/_redirects へ移した。
  output: "export",
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // URL は末尾スラッシュなし(/results/2026 → out/results/2026.html)。配信側の
  // html_handling: "auto-trailing-slash" が /results/2026 でこのファイルを返す
  trailingSlash: false,
  // Next 16 が frontend/AGENTS.md を自動生成しないようにする(リポジトリ直下の AGENTS.md が正)
  agentRules: false
};

export default nextConfig;
