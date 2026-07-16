const DEFAULT_SITE_URL = "http://localhost:5173";

// NEXT_PUBLIC_SITE_URL が未設定・不正な場合はローカル開発向けURLへフォールバックする
export function resolveSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  if (!raw) return DEFAULT_SITE_URL;
  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteUrl = resolveSiteUrl();
