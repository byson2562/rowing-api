#!/usr/bin/env node
// X(Twitter)へポストするCLI。依存パッケージなし(OAuth 1.0a user contextを自前署名)。
//
// 使い方:
//   node scripts/x-post.mjs "ポスト本文"
//   node scripts/x-post.mjs --dry-run "本文の確認だけ"
//
// 認証情報は環境変数、なければリポジトリ直下の .env から読む(gitignore済み):
//   X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_SECRET

import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadDotEnv() {
  try {
    const text = readFileSync(join(repoRoot, ".env"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] == null) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // .envが無ければ環境変数のみ使う
  }
}

const enc = (s) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

function oauthHeader(method, url, creds) {
  const params = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.accessToken,
    oauth_version: "1.0"
  };
  const paramString = Object.keys(params)
    .sort()
    .map((k) => `${enc(k)}=${enc(params[k])}`)
    .join("&");
  const base = [method.toUpperCase(), enc(url), enc(paramString)].join("&");
  const signingKey = `${enc(creds.apiSecret)}&${enc(creds.accessSecret)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");
  const all = { ...params, oauth_signature: signature };
  return (
    "OAuth " +
    Object.keys(all)
      .sort()
      .map((k) => `${enc(k)}="${enc(all[k])}"`)
      .join(", ")
  );
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const text = args.filter((a) => a !== "--dry-run").join(" ").trim();

  if (!text) {
    console.error('使い方: node scripts/x-post.mjs [--dry-run] "ポスト本文"');
    process.exit(1);
  }

  // Xの文字数カウント(URLは11.5幅・全角2幅)の厳密な再現はせず、素朴な長さで警告だけ出す
  if ([...text].length > 140) {
    console.warn(`注意: ${[...text].length}文字あります。全角基準の上限(140)を超えていないか確認してください。`);
  }

  console.log("---- 本文 ----");
  console.log(text);
  console.log("--------------");

  if (dryRun) {
    console.log("dry-run: 投稿はしていません");
    return;
  }

  loadDotEnv();
  const envNames = {
    apiKey: "X_API_KEY",
    apiSecret: "X_API_SECRET",
    accessToken: "X_ACCESS_TOKEN",
    accessSecret: "X_ACCESS_SECRET"
  };
  const creds = Object.fromEntries(
    Object.entries(envNames).map(([k, name]) => [k, process.env[name]])
  );
  const missing = Object.entries(creds)
    .filter(([, v]) => !v)
    .map(([k]) => envNames[k]);
  if (missing.length > 0) {
    console.error(`認証情報が不足しています: ${missing.join(", ")}`);
    console.error("リポジトリ直下の .env に X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_SECRET を設定してください。");
    process.exit(1);
  }

  const url = "https://api.x.com/2/tweets";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: oauthHeader("POST", url, creds),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`投稿失敗: HTTP ${res.status}`);
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }
  console.log(`投稿成功: https://x.com/i/status/${body.data?.id ?? "(id不明)"}`);
}

main();
