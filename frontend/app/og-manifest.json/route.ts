import { ogImageId } from "../../lib/og-image";
import { listOgTargets } from "../../lib/og-targets";

// 全ページが参照する OG 画像の一覧。next build が out/og-manifest.json として書き出し、
// scripts/generate-og.mjs がこれを読んで out/og/<id>.png を生成する
export const dynamic = "force-static";

export async function GET() {
  const byId = new Map<string, { id: string; title: string; subtitle: string }>();
  (await listOgTargets()).forEach((target) => {
    const id = ogImageId(target);
    const entry = { id, title: (target.title ?? "").trim(), subtitle: (target.subtitle ?? "").trim() };
    const existing = byId.get(id);
    if (existing && (existing.title !== entry.title || existing.subtitle !== entry.subtitle)) {
      throw new Error(`OG画像のidが衝突しました: ${id} (${existing.title} / ${entry.title})`);
    }
    byId.set(id, entry);
  });
  return Response.json(Array.from(byId.values()));
}
