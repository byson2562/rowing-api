#!/usr/bin/env python3
"""引数の日付(JST, YYYY-MM-DD)が大会期間内なら true を出力する。

ワークフローの run: にヒアドキュメントで埋め込むとYAMLのインデントと
終端記号が噛み合わず壊れるため、独立したスクリプトにしている。
"""
import json
import pathlib
import sys

CONFIG = pathlib.Path(__file__).resolve().parents[1] / "race-windows.json"


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: in_race_window.py YYYY-MM-DD", file=sys.stderr)
        return 2
    today = sys.argv[1]
    try:
        windows = json.loads(CONFIG.read_text(encoding="utf-8"))["windows"]
    except FileNotFoundError:
        print("false")
        return 0
    except (json.JSONDecodeError, KeyError) as err:
        # 設定が壊れているときに毎時走り続けるのは避けたいので false 側に倒す
        print(f"race-windows.json を読めません: {err}", file=sys.stderr)
        print("false")
        return 0
    hit = any(w["start"] <= today <= w["end"] for w in windows)
    print("true" if hit else "false")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
