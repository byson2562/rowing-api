#!/usr/bin/env python3
"""引数の日付(JST, YYYY-MM-DD)が大会期間内なら true を出力する。

大会期間は2か所から集める。
- frontend/data/schedule.json の各大会: 初日から最終日の翌日まで(結果の公開が翌日にずれ込む分)
- .github/race-windows.json: 日程表と違う期間を足したいときの上書き用

日程表だけに大会を書けば取り込みが高頻度になるので、2026-10 の新人選手権のように
race-windows.json への追記漏れで取り込みが1日1回になることはもう起きない。

`--finals` を付けると、日程表の大会の最終日から2日後までだけを true にする
(結果記事の routine を呼ぶ期間。results-article スキルの判定と同じ幅)。

ワークフローの run: にヒアドキュメントで埋め込むとYAMLのインデントと
終端記号が噛み合わず壊れるため、独立したスクリプトにしている。
"""
import datetime
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
RACE_WINDOWS = ROOT / ".github" / "race-windows.json"
SCHEDULE = ROOT / "frontend" / "data" / "schedule.json"


def load(path: pathlib.Path, key: str) -> list:
    """設定が無い・壊れているときは空として扱う(毎時走り続けるのは避けたいので false 側に倒す)"""
    try:
        return json.loads(path.read_text(encoding="utf-8"))[key]
    except FileNotFoundError:
        return []
    except (json.JSONDecodeError, KeyError) as err:
        print(f"{path.name} を読めません: {err}", file=sys.stderr)
        return []


def windows() -> list:
    found = [(w["start"], w["end"]) for w in load(RACE_WINDOWS, "windows")]
    for c in load(SCHEDULE, "competitions"):
        try:
            end = datetime.date.fromisoformat(c["end"]) + datetime.timedelta(days=1)
            found.append((c["start"], end.isoformat()))
        except (KeyError, ValueError) as err:
            print(f"schedule.json の大会を読めません: {err}", file=sys.stderr)
    return found


def finals() -> list:
    found = []
    for c in load(SCHEDULE, "competitions"):
        try:
            end = datetime.date.fromisoformat(c["end"])
            found.append((end.isoformat(), (end + datetime.timedelta(days=2)).isoformat()))
        except (KeyError, ValueError) as err:
            print(f"schedule.json の大会を読めません: {err}", file=sys.stderr)
    return found


def main() -> int:
    args = [a for a in sys.argv[1:] if a != "--finals"]
    if len(args) != 1:
        print("usage: in_race_window.py [--finals] YYYY-MM-DD", file=sys.stderr)
        return 2
    today = args[0]
    ranges = finals() if "--finals" in sys.argv[1:] else windows()
    hit = any(start <= today <= end for start, end in ranges)
    print("true" if hit else "false")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
