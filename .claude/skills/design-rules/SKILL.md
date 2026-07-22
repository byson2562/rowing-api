---
name: design-rules
description: レガッタナビのUIデザインルールを適用する。フロントエンドのUI・スタイル・コンポーネント・配色・レイアウトを新規作成/変更するとき、およびデザインレビューを行うときは、明示的な指示がなくてもこのスキルを読み込んでルールに従う。「デザインルールに従って」「UIを調整して」等の依頼でも使う。
---

# レガッタナビ デザインルール適用スキル

## 手順

1. まず `docs/design-rules.md` を読む(ルールの単一ソース。この SKILL は要約にすぎない)。
2. スタイルを書く前に、該当領域のクラスモジュールを確認し、**新しい値はモジュール側に追加**する:
   - ボタン: `frontend/components/ui/button-classes.ts`
   - 検索UI: `frontend/components/search/search-classes.ts`
   - 静的LP: `frontend/components/lp/lp-classes.ts`
   - 記事: `frontend/components/article/article-classes.ts`
   - ホーム: `frontend/app/page.tsx` 冒頭の定数
3. 色・radius・影は `rn-*` トークン(`frontend/app/globals.css` の `:root`)を最優先で使う。
4. 変更後はブラウザで 1280px と 375px の両方を確認する。

## ハードルール(違反したら直す)

- 背景は白。全面の色地・背景グラデーション禁止
- 影は常時付けない(`shadow-rn-soft`=ヘアライン+接地1pxのみ)。浮くのはホバー時だけ+`motion-reduce:`併記
- グラデーション禁止(ボタン・下線含む)。ソリッドカラーのみ
- radius: カード12px / 入力・ボタン10px。**pill(999px)はタグ系のみ**(チップ・セグメントタブ・順位バッジ)
- 文字: 本文16 / UI14 / 表13 / ラベル12(11はタグ内・英大文字ラベルのみ)。named `text-sm` 系は使わず `text-[Npx]`+`leading-[…]`
- ウェイト: 本文400 / ラベル500 / 操作600 / 見出し・数値700
- 数値(タイム・順位・件数)には `[font-variant-numeric:tabular-nums]`
- 新色の場当たり追加禁止。追加するならトークン化+コントラストAA検証+`docs/design-rules.md`更新
- アクセント(オレンジ)は1画面1箇所まで
- 同一プロパティのユーティリティを同一要素に重ねない(後勝ちできない)。状態違いは排他的なクラス文字列で合成する

## 技術上の注意(この リポジトリ固有)

- カスケードは `@layer theme, legacy, utilities`(utilities が legacy に勝つ)。順序宣言は `@import` より前に置く
- クラス文字列を定数モジュールに切り出す場合、`@source` で確実にスキャンされる(`app/**`・`components/**` は設定済み)。dev で新規ファイルのクラスが効かないときは dev サーバーを再起動
- 検証は computed style の実測(`getComputedStyle`)で行う。デザイン変更でない限り「視覚ゼロ変更」を数値で担保する
