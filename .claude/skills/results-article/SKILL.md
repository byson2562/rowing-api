---
name: results-article
description: 収録している全日本級4大会(大学・新人・社会人・全日本選手権)の年別の結果記事 `<prefix>-<YYYY>-results` を、決勝の結果がそろったあとに作り、レビュー・ビルドを通して main へ push する手順。クラウドの routine(大会期間中の結果の取り込みで起動)が使うほか、「◯◯の結果記事を作って」と頼まれたときにも使う。
---

# 年別の結果記事を作って公開する

大会の決勝結果がリポジトリに取り込まれたら、その大会の年別の結果記事を1本作り、本番(https://regattanavi.jp)に出す。ユーザーは main への push まで自動で行うことを承認済み(2026-10-26)。

前提:
- 結果データは GitHub Actions「Update JARA Results」が取り込む。大会期間中(`.github/scripts/in_race_window.py` が true を返す日)は毎時取り込み、main に直接コミットしてから deploy-cloudflare を起動する。
- 大会の最終日から2日後まで(`in_race_window.py --finals`)は、取り込みのコミットのあとに `.github/scripts/fire_results_routine.sh` がクラウドの routine「rowing-api: 大会の結果記事を作って公開」(`trig_01LWyBVwgxu83kkJ3nmsMoyM`)を API トリガーで起動する。トークンは GitHub の Secret `CLAUDE_ROUTINE_TOKEN`。手で起動し直すときは Actions の「Fire results-article routine」を実行する。routine を起動できる GitHub イベントは PR・リリース・Issue だけで、push では起動できない(2026-10-26 に確認)。
- 大会の日程は `frontend/data/schedule.json`(JARA の大会日程から手で転記)。ここに無い大会は扱わない。
- 作業の前に `AGENTS.md` と `tasks/lessons.md` を読む。記事の書き方は `.claude/skills/article-review/SKILL.md` の「記事の方針」がすべての前提。

## 対象の大会と slug

`category` は `frontend/data/schedule.json` と `frontend/lib/results-core.ts` の `COMPETITION_CATEGORY_RULES` の `label`。

| category | slug | ガイド記事 | 注意 |
| --- | --- | --- | --- |
| 全日本大学選手権 | `university-championship-YYYY-results` | `university-championship-guide` | 大会名に「オックスフォード盾」「ジャパンオープン」を含む。`JO` で始まる種目は社会人も出るオープン枠なので集計から外す |
| 全日本新人選手権 | `freshman-championship-YYYY-results` | `freshman-championship-guide` | 高校・社会人・混成クルーも出る |
| 全日本社会人選手権 | `shakaijin-championship-YYYY-results` | なし | 「男子シングルスカル40才以上」のような年齢別種目がある。年ごとに種目が入れ替わる |
| 全日本選手権 | `japan-championship-YYYY-results` | なし | 「軽量級」「PR1」「PR3」の種目がある。大学・社会人・実業団が同じ種目に出る |

ガイド記事は slug が上の形の記事を自動で一覧に載せる(`resultsArticlePattern`)。ガイドの無い2大会は、記事の末尾から大会の結果ページと検索ページへ案内する。

## 1. 実行してよいかの判定(毎回まず行う)

1. `git fetch origin main && git checkout -B main origin/main` で最新にする。作業ツリーに追跡中ファイルの変更があれば触らずに終了し、状況を報告する。
2. 今日の日付(`TZ=Asia/Tokyo date +%F`)が、`schedule.json` のどれかの大会の `end` の日から `end` の2日後までに入っているかを見る。入っていなければ「対象の大会なし」で終了する。入っていれば、その大会を対象にする(年は `end` の年)。
3. その大会の slug の記事 `frontend/app/articles/<slug>/page.tsx` が origin/main にあれば、公開済みなので終了する。
4. ロックを取る(下の「ロックの取り方と解除」)。取れなければ、別の実行が作業中なので終了する。作業はロック用ブランチではなく main の上で行う。

### ロックの取り方と解除

クラウドの routine からはブランチを削除できない(2026-10-26 の試験で 403)。強制 push も使わない。そのため、ロック用ブランチ `claude/results-article-<slug>` は消さずに残し、空コミットを早送りで積み足して状態を表す。
- 取る: `git fetch origin`。ブランチがあり、先頭コミットの件名が `lock:` で始まり、そのコミットが3時間以内なら、作業中の実行があるので取れない。それ以外(ブランチが無い、先頭が `unlock:`、3時間より古い `lock:`)なら、ブランチの先頭(無ければ origin/main)に `git commit --allow-empty -m "lock: results-article <slug> <ISO時刻>"` を積み、`git push origin HEAD:refs/heads/claude/results-article-<slug>` する。push が早送りでないとして拒否されたら、別の実行が先に取ったので取れない。
- 解除する: ロック用ブランチの先頭に `git commit --allow-empty -m "unlock: results-article <slug> <ISO時刻>"` を積んで push する。終了するときは、理由にかかわらず必ず解除する。
- 作業を残す: 記事の変更はロック用ブランチに積まない(先頭が `lock:` でなくなり、判定が崩れる)。push できない変更を残すときは、`claude/results-article-<slug>-<YYYYMMDDHHMM>` という新しいブランチに push する。

## 2. 結果がそろったか確認する

1. `frontend/data/results/<年>.json` から、`competition_name` が対象大会に当たり(`COMPETITION_CATEGORY_RULES` のキーワード)、`final_group` が `Final A` の行を取り出す。
2. 今年行われた Final A の種目を、JARA の大会ページ(`schedule.json` の `url`)からたどれる競漕日程・結果ページで確かめる。種目は年ごとに入れ替わるので、前年の種目一覧を正にしない。
3. 今年行われた Final A の全種目に、データ上で rank 1 と rank 2 があればそろっている。そろっていなければ、JARA の結果ページに出ているかを見る。
   - JARA に出ているのにリポジトリに無いときは、取り込みの次の回を待つ(大会期間中は毎時)。ロックを解除して終了する。
   - JARA にも無いときは、ロックを解除して終了する(次の取り込みで起動される)。
   - `end` の2日後になってもそろわないときは、何がそろわないかを報告して終了する。
4. JARA に届かないとき(ネットワークの制限など)は、前年の同じ大会の Final A 種目のうち、今年のデータに Final B 以上の行がある種目を「今年行われた種目」とみなす。この代わりの判定を使ったことを報告に書く。

## 3. 記事を書く

参考にする既存記事(年を固定した新聞調の結果記事): `frontend/app/articles/freshman-championship-2026-results/page.tsx`、`frontend/app/articles/university-championship-2026-results/page.tsx`。データの扱い(混成クルー、クルー名と団体名、種目順)は各大会のガイドがあればそれも見る。

- `frontend/app/articles/<slug>/page.tsx` を新規に作る。`YEAR` と `PREV_YEAR` を定数にし、前年と比べる。数字はすべてビルド時に `allResults()` から集計する(本文に数字を手で書かない)。
- 構成の目安:
  1. リード: 1文目に「大会名・最終日の日付・会場・男子エイトと女子の花形種目の優勝とタイム」。続けて記事の案内(ガイドがあれば解説記事へのリンク)を短く。
  2. 全種目の優勝クルーとタイムの表(種目 / 優勝 / 2位(優勝との差) / 前年の優勝)。表の直後に、3位以下と Final B を含む全着順は大会の結果ページにある、と案内する。
  3. 男子エイトと女子の花形種目(大会で行われた女子の種目のうち、乗る人数が最も多いもの)の Final A 全着順。
  4. 団体の優勝数は男女別に数える。性別は `event_name` に「男子」「女子」を含むかで判定する(「軽量級男子」「PR1 男子」も男子)。年齢別・軽量級・PR の種目も数に入れ、注記で触れる。
  5. 大会ごとの特色の節: 新人選手権・全日本選手権は「大学以外(高校・社会人・混成)のクルー」、社会人選手権は年齢別種目の優勝者、全日本選手権は軽量級・PR の優勝者など。表で見せ、本文で表の言い直しをしない。
  6. 末尾: 歴代と公式結果への導線(ガイド、大会の結果ページ `/results/<年>/<encodeURIComponent(大会名)>`、JARA の結果ページ)と、データについての注記(収録範囲、「初めて」の判定範囲、欠けている年)。
- 文体と書いてはいけない文は、`.claude/skills/article-review/SKILL.md` の「記事の方針」に従う(新聞のスポーツ欄調、本文のタイムは `formatRaceTime`・着差は `formatMargin`、2回目以降は `shortOrgName`、筆者の視点や見どころ予想を書かない、艇の説明・集計の理由・記録の豆知識・表の言い直しを書かない)。
- 日本語は `.claude/skills/humanizer-ja/SKILL.md` のルールを当てる。ただし「声を入れる」(体験・意見)と「体温のある結論」は使わない。
- UI は `docs/design-rules.md` に従い、スタイルは `frontend/components/article/article-classes.ts` の既存クラスだけを使う。JSX で文と文を改行でまたぐと文中に空白が入るので、1段落の地の文は式をはさんでも同じ行に続ける。
- 登録:
  - `frontend/lib/articles.ts` にエントリを足す(title は既存の結果記事に合わせて「<大会名の通称>(ボート)YYYYの結果 | 第N回 …」の形、description は本文で確かめた事実だけ、`publishedAt` は今日の日付)。
  - OG 画像: `.claude/skills/article-thumbnails/SKILL.md` を読み、`frontend/lib/og-targets.ts` の `ARTICLE_OG` に title/subtitle を足す。ページは `ogImages(articleOg(meta))` で参照する。
- 書いたら `.claude/skills/article-review/SKILL.md` の3段階(読者体験 → yomiyasu → 校正。1と3は合格まで最大3回)を必ず回す。無人の実行では、yomiyasu の「書き手に確かめたい点」はデータに忠実で控えめな方を選び、何を選んだかを報告に書く。

## 4. 確かめる

`frontend/` で `npm ci`(依存が入っていなければ)、`npm run lint`(エラー0)、`npx tsc --noEmit`、`npm test`、`npm run build` をすべて通す。そのうえで:
- `frontend/out/articles/<slug>.html` の本文の数字を、`frontend/data/results/<年>.json` から node で数え直した値と突き合わせて一致させる。
- 記事の OG 画像が `frontend/out/og/` にある(HTML が参照する png が存在する)。
- ガイドのある大会では、ガイドの HTML が今年の結果に切り替わり、記事へリンクしている。
- 出力 HTML の本文に「。 」(句点の後の空白)が無い。
- 直せない失敗があれば main に push しない。変更をコミットして `claude/results-article-<slug>-<YYYYMMDDHHMM>` に push し、ロックを解除して、何が失敗したかを報告して終了する。

## 5. 公開する

1. `tasks/todo.md` に「<大会名>の結果記事を公開(日付)」の節を足す(作った内容、レビューの各回の判定、検証結果、見送った点)。
2. 記事・`frontend/lib/articles.ts`・`frontend/lib/og-targets.ts`・`tasks/todo.md` だけをパス指定で `git add` し、1つのコミットにする。メッセージは英語の Conventional Commits(例: `feat(articles): publish the 2027 全日本社会人選手権 results`)で、最後に空行をはさんで `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` を付ける。
3. `git pull --rebase origin main`(取り込みの bot のコミットと競合しないように)してから `git push origin HEAD:main`。
   - main への push が権限などで拒否されたら、同じコミットを `claude/results-article-<slug>-<YYYYMMDDHHMM>` に push し、`gh` が使えれば PR を作る。拒否されたことと、ブランチ名(または PR の URL)を報告する。
4. main に入ったら deploy-cloudflare が走る(`frontend/**` の変更)。`gh` が使えれば run の完了を待ち、使えなければ `curl -s -o /dev/null -w '%{http_code}' https://regattanavi.jp/articles/<slug>` が 200 になるまで1分おきに最大20分確かめる。ガイドのある大会では、本番のガイドから記事へリンクされていることも確かめる。`gh` も regattanavi.jp への接続も使えないときは、本番を確かめられなかったことを報告に書く(push までできていれば失敗扱いにしない)。

## クラウドの routine で動くときの注意

2026-10-26 の試験で分かった、クラウドの実行環境の性質。
- node 22・npm・Python 3.11・git・gh・Docker があり、`npm ci`(約30秒)からビルド(OG 画像込みで約1分)まで通る。
- 外部への接続はプロキシの許可リストに限られる。環境「Default」は 2026-10-26 から Custom で `www.jara.or.jp` と `regattanavi.jp` を許可している(既定のパッケージ取得先も含む)。それでも 403 になったら許可が外れているので、2-4 の代わりの判定を使い、本番の確認は上の4のとおり報告に回す。
- `gh` のトークンは無効なことがある。PR を作れないときは、ブランチに push したことだけを報告する。
- ブランチの作成と早送りの push はできるが、ブランチの削除(`git push --delete`)は 403 で拒否される。強制 push も同じく拒否されると考えて使わない(試してはいない)。ロックは上の「ロックの取り方と解除」の方式で扱う。
- 終了時のフックが「未追跡のファイルをコミットして push せよ」と求めることがある。記事に関係ないファイル(ビルドの生成物、Python のキャッシュ、作業用のテキスト)はコミットせず、消してから終える。`git checkout --` などで追跡中のファイルを巻き込まないようにする。

## 6. 終える

ロックを解除する(`unlock:` の空コミットを積んで push)。公開した URL、記事の構成、レビューの判定、検証の結果、代わりの判定を使ったか、見送った点や気になる点を日本語で短く報告する。
