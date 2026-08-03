/**
 * 旧ドメイン rowing-api.com を regattanavi.jp へ 301 で送るだけの Worker。
 *
 * 2026-07 のリブランド時に Vercel のドメイン設定でリダイレクトしていたが、
 * そのためだけに Vercel アカウントとプロジェクトを維持するのをやめ、
 * Cloudflare 側へ寄せた。パスとクエリはそのまま引き継ぐ(SEO評価の移行のため
 * Search Console のアドレス変更と組み合わせて使う)。
 */
export default {
  fetch(request: Request): Response {
    const url = new URL(request.url);
    url.protocol = "https:";
    url.hostname = "regattanavi.jp";
    url.port = "";
    return Response.redirect(url.toString(), 301);
  }
};
