#!/usr/bin/env bash
# 結果記事の routine(クラウドの scheduled task)を API トリガーで起動する。
# 取り込みのワークフローが大会の最終日以降に main へ結果をコミットしたとき、
# または fire-results-routine.yml から手で呼ぶ。routine 側が「結果がそろったか」
# 「記事が公開済みか」を判定するので、何度呼んでも記事は1本しかできない。
#
# 必要な環境変数: CLAUDE_ROUTINE_TOKEN(routine の API トークン。GitHub の Secret)
# 引数: $1 = routine に添える短いメモ(省略可。routine は信用しないデータとして受け取る)
set -euo pipefail

ROUTINE_ID="${CLAUDE_ROUTINE_ID:-trig_01LWyBVwgxu83kkJ3nmsMoyM}"
URL="https://api.anthropic.com/v1/claude_code/routines/${ROUTINE_ID}/fire"
NOTE="${1:-}"

if [[ -z "${CLAUDE_ROUTINE_TOKEN:-}" ]]; then
  echo "CLAUDE_ROUTINE_TOKEN が設定されていません" >&2
  exit 1
fi

body="$(python3 -c 'import json,sys; print(json.dumps({"text": sys.argv[1]} if sys.argv[1] else {}))' "${NOTE}")"
response="$(mktemp)"
status="$(curl -sS -o "${response}" -w '%{http_code}' -X POST "${URL}" \
  -H "Authorization: Bearer ${CLAUDE_ROUTINE_TOKEN}" \
  -H "anthropic-beta: experimental-cc-routine-2026-04-01" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d "${body}")"

if [[ "${status}" != "200" ]]; then
  echo "routine の起動に失敗しました(HTTP ${status})" >&2
  cat "${response}" >&2
  exit 1
fi
# 応答のセッション URL だけを出す(トークンは出さない)
python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print("routine を起動しました:", d.get("claude_code_session_url", "?"))' "${response}"
