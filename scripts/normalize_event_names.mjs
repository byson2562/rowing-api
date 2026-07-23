#!/usr/bin/env node
// 元データJSONの種目名表記ゆれを名寄せする一括スクリプト（冪等）。
// frontend/lib/results-data.ts の normalizeEventName と同じ規則を適用する。
// 使い方: node scripts/normalize_event_names.mjs
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "frontend", "data", "results");

function normalizeEventName(name) {
  return name
    .replaceAll("舵手付き", "舵手つき")
    .replaceAll("舵手付", "舵手つき")
    .replaceAll("クオドルプル", "クォドルプル")
    // JARAは2021年に「舵手なし」冠称を廃止。現行表記へ名寄せする
    .replaceAll("舵手なし", "");
}

let changedFiles = 0;
let changedRows = 0;

for (const file of readdirSync(dataDir).sort()) {
  if (!/^\d{4}\.json$/.test(file)) continue;
  const path = join(dataDir, file);
  const rows = JSON.parse(readFileSync(path, "utf8"));
  let fileChanged = 0;
  for (const row of rows) {
    const normalized = normalizeEventName(row.event_name);
    if (normalized !== row.event_name) {
      row.event_name = normalized;
      fileChanged += 1;
    }
  }
  if (fileChanged > 0) {
    writeFileSync(path, JSON.stringify(rows));
    changedFiles += 1;
    changedRows += fileChanged;
    console.log(`${file}: ${fileChanged} rows normalized`);
  }
}

console.log(`done: ${changedRows} rows in ${changedFiles} files`);
