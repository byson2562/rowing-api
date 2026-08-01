import { NextResponse } from "next/server";

// Next.js 15 は Route Handler の GET を既定で動的にするが、固定文字列を返すだけなので
// 静的配信のままにする(Cloudflare 移行後に無駄な Worker 実行を増やさないため)
export const dynamic = "force-static";

export async function GET() {
  return new NextResponse("ok", { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
}
