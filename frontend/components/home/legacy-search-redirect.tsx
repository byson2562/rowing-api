"use client";

import { useEffect } from "react";

import { QUERY_FILTER_KEYS } from "../../lib/results-core";

/**
 * 旧ホーム(検索)のフィルタ付きURL(/?year=2025 など)を /search へ送る。
 *
 * 以前はサーバーの permanentRedirect(301)だったが、完全静的サイトではクエリで分岐できず、
 * Cloudflare の _redirects もクエリ文字列を照合しない。そこでホームの描画後にブラウザで置換する。
 * 判定は検索フィルタのキーに限る(?utm_source= や ?gclid= を付けた流入まで検索へ飛ばさないため)。
 */
export default function LegacySearchRedirect() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasSearchFilter = QUERY_FILTER_KEYS.some((key) => (params.get(key) ?? "").trim() !== "");
    if (!hasSearchFilter) return;
    const cleaned = new URLSearchParams();
    params.forEach((value, key) => {
      if (value.trim()) cleaned.set(key, value.trim());
    });
    window.location.replace(`/search?${cleaned.toString()}`);
  }, []);
  return null;
}
