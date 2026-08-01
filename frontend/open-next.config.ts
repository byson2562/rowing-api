import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// 全ページを build 時に生成しており ISR を使っていないため、
// インクリメンタルキャッシュ(R2 等)の設定は持たない。
const config = defineCloudflareConfig();

export default {
  ...config,
  // package.json の `build` は NEXT_DIST_DIR=.next-build を指定するが、OpenNext は
  // 既定の .next を読む。ローカルのビルド分離を壊さないよう、ここで素の next build を使う。
  buildCommand: "next build"
};
