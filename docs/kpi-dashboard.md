# KPIダッシュボード(Looker Studio)セットアップ手順

GA4の画面を開かずに、North Star KPI(週次検索実行数)を1枚で確認するためのダッシュボード構築手順。
所要時間は15分程度。費用は無料。

## 前提

- GA4プロパティにアクセスできるGoogleアカウント
- 本番(Vercel)に `NEXT_PUBLIC_GA_MEASUREMENT_ID` が設定され、計測が動いていること

### このサービスが送信しているカスタムイベント

| イベント名 | 意味 | 主なパラメータ |
|---|---|---|
| `search_execution` | **North Star**。フィルタ付き検索の実行(クエリ単位でセッション内重複排除済み) | `result_count`, `active_filter_count`, `has_event_filter` |
| `search_results_loaded` | 検索結果の表示(初期表示含む) | `result_count`, `search_context`(initial/filtered) |
| `no_data_view` | 検索結果0件の表示 | `active_filter_count` |
| `filter_apply` / `filter_interaction` | フィルタ操作 | `filter_name`, `filter_value` |
| `result_open` | 結果行のクリック | `link_label` |
| `chart_interaction` | チャート操作 | ラベル各種 |

## 手順

### 1. レポート作成とデータソース接続

1. https://lookerstudio.google.com を開く → 「空のレポート」
2. データソースの追加で「Googleアナリティクス」コネクタを選択
3. 対象のGA4プロパティを選択して「追加」

### 2. 1ページ構成(推奨レイアウト)

**上段: スコアカード3つ**

1. **週次検索実行数**(主役・大きく)
   - グラフ: スコアカード
   - 指標: イベント数
   - フィルタ: `イベント名 = search_execution`
   - 期間: 過去7日間、比較期間: 前の期間 → 前週比が自動表示される
2. **検索0件率**
   - グラフ: スコアカード(データ結合を使う場合)または後述の簡易版
   - 簡易版: `no_data_view` のイベント数を並べて目視比較でも十分
3. **週次ユーザー数**
   - 指標: 総ユーザー数、期間: 過去7日 + 前期間比較

**中段: 時系列グラフ**

- グラフ: 時系列
- ディメンション: 日付(週単位に変更: ディメンション右クリック → 週)
- 指標: イベント数
- フィルタ: `イベント名 = search_execution`
- 過去12週間程度の期間設定

**下段: よく使われるフィルタ(表)**

- グラフ: 表
- ディメンション: `filter_name`(カスタムパラメータ。初回はGA4側で「カスタム定義」への登録が必要 ※下記注)
- 指標: イベント数
- フィルタ: `イベント名 = filter_apply`

> 注: イベントパラメータ(`filter_name` など)をLooker Studioのディメンションとして使うには、
> GA4の 管理 → カスタム定義 → カスタムディメンションの作成 で
> `filter_name` / `search_context` / `result_count` を登録しておく(反映に最大24時間)。

### 3. 仕上げ

- 右上「共有」→ 自分のみ(既定)でOK。閲覧用リンクをブックマークする
- 以後、GA4本体を開く必要はない。このレポートを週1で見るだけ

## 運用メモ

- データの粒度・定義はGA4と同一(Looker StudioはGA4のビューア)
- もし将来GA4を廃止したくなった場合は、Umami Cloud等への移行を検討
  (イベント送信は `frontend/app/layout.tsx` の `rowingapi_analytics_event` リスナーに集約されているため差し替えは小さい)
