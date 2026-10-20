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
   - 結果・順位バッジ: `frontend/components/results/results-classes.ts`
   - ホーム: `frontend/app/page.tsx` 冒頭の定数
3. 色・radius は `rn-*` トークン(`frontend/app/globals.css` の `:root`)を最優先で使う。影は使わない。
4. 変更後は内蔵ブラウザで desktop(1280px)と mobile(375px)のスクリーンショットを撮り、`docs/design-rules.md` の「9. AIっぽさのアンチパターン」の一覧と番号順に突き合わせる。該当箇所を直して再確認してから提示し、「点検した番号 / 直した番号」を添える(手順の詳細は同節の「自己点検手順」)。

## ハードルール(違反したら直す)

- 方向性は「日経ビジュアルデータ寄り」(2026-10-20): 白地・墨色の文字・細い罫線。角丸・影・箱は作らない
- 背景は白。全面の色地・背景グラデーション禁止
- 影は使わない。浮かせる hover(`translate`/`scale`)も禁止。hover は下線か背景 `--surface-soft` の僅差だけ+`motion-reduce:` 併記
- グラデーション禁止(ボタン・下線・棒グラフ含む)。見出しにアクセント棒・左ボーダーを付けない
- radius: 入力・ボタン 4px(`rounded-rn-control`)、順位バッジは円。それ以外は 0。**pill(999px)は使わない**
- 文字: Noto Sans JP のみ。h1 38 / h2 24 / 本文16 / UI14 / 表14 / メタ13 / 表ヘッダ12 / 図ラベル11。named `text-sm` 系は使わず `text-[Npx]`+`leading-[…]`
- ウェイト: 400 / 500 / 700 の3段だけ(600・800 禁止)
- 数値(タイム・順位・件数・日付)には `[font-variant-numeric:tabular-nums]`
- 色: 文字・リンク・ボタンは墨 `rn-text`、説明 `rn-muted`、メタ `rn-meta`。**青 `rn-primary` は図・1位・選択状態・フォーカスだけ**。オレンジ・金銀銅・見出し紺は廃止
- 新色の場当たり追加禁止。追加するならトークン化+コントラストAA検証+`docs/design-rules.md`更新
- primary ボタン(墨地白文字)は1画面1つ。他は secondary(白地墨枠)かテキストリンク
- 順位バッジは `components/results/results-classes.ts` の `rankBadgeClass`(1位=青 / 2〜3位=灰青 / 4位以下=薄灰)を使う。絵文字は使わない
- 同一プロパティのユーティリティを同一要素に重ねない(後勝ちできない)。状態違いは排他的なクラス文字列で合成する
- 生成UIの定型(ヒーロー+3カード+CTA、全要素の角丸と影、絵文字アイコン、中央揃えの連発、コピー調の見出し等)を出さない。一覧と代替は `docs/design-rules.md` §9

## 技術上の注意(この リポジトリ固有)

- カスケードは `@layer theme, legacy, utilities`(utilities が legacy に勝つ)。順序宣言は `@import` より前に置く
- クラス文字列を定数モジュールに切り出す場合、`@source` で確実にスキャンされる(`app/**`・`components/**` は設定済み)。dev で新規ファイルのクラスが効かないときは dev サーバーを再起動
- 検証は computed style の実測(`getComputedStyle`)で行う。デザイン変更でない限り「視覚ゼロ変更」を数値で担保する
