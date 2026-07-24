import type { Metadata } from "next";
import Link from "next/link";

import {
  lpAuthor,
  lpAuthorMeta,
  lpAuthorMetaDd,
  lpAuthorMetaDdMultiline,
  lpAuthorMetaDt,
  lpAuthorMetaLink,
  lpAuthorMetaRow,
  lpKicker
} from "../../components/lp/lp-classes";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  description:
    "レガッタナビのスポンサーシップ（一口 年5,000円）に関する、特定商取引法に基づく表記です。事業者情報・料金・支払時期・解約方法などを記載しています。",
  alternates: {
    canonical: "/legal"
  },
  robots: {
    index: false,
    follow: true
  }
};

const ROWS: { term: string; description: React.ReactNode }[] = [
  { term: "販売事業者", description: "中村 匠" },
  { term: "運営責任者", description: "中村 匠" },
  {
    term: "所在地",
    description: "ご請求をいただいた場合、遅滞なく開示します。下記の連絡先までお問い合わせください。"
  },
  {
    term: "電話番号",
    description: "ご請求をいただいた場合、遅滞なく開示します。下記の連絡先までお問い合わせください。"
  },
  {
    term: "連絡先",
    description: (
      <a className={lpAuthorMetaLink} href="mailto:takumi.nakamura.by@gmail.com">
        takumi.nakamura.by@gmail.com
      </a>
    )
  },
  {
    term: "販売価格",
    description: "レガッタナビ スポンサー: 一口 年5,000円（税込）。口数は決済画面でお選びいただけます。"
  },
  { term: "商品代金以外の必要料金", description: "銀行振込をご利用の場合の振込手数料。インターネット接続料金・通信料金はお客様のご負担となります。" },
  { term: "支払方法", description: "クレジットカード（Stripe による決済）または銀行振込。" },
  { term: "支払時期", description: "クレジットカードはお申し込み時に初回分を決済し、以後1年ごとに自動更新・自動決済となります。銀行振込はお申し込み後にお送りするご案内に記載の期日までにお支払いください。" },
  {
    term: "提供時期",
    description: "お支払いの確認後、速やかに提供を開始します。お名前の掲載をご希望の場合は、内容を確認のうえ通常7日以内にサイトへ反映します。"
  },
  {
    term: "サービス内容",
    description:
      "レガッタナビ（https://regattanavi.jp）の運営を支援いただく年額のスポンサーシップです。お礼のメッセージをお送りし、ご希望の方はサイト内の協賛枠にお名前を掲載します。"
  },
  {
    term: "解約について",
    description:
      "いつでも解約できます。解約のご連絡をいただいた時点で次回以降の自動更新を停止します。解約後も、お支払い済みの期間の終わりまでは掲載を継続します。"
  },
  {
    term: "返品・返金について",
    description:
      "サービスの性質上、お支払い済みの料金の返金には応じかねます。ただし当方の都合によりサービスの提供を終了する場合は、未経過期間分を日割りで返金します。"
  }
];

export default function LegalPage() {
  return (
    <main className="site-container lp-page">
      <section className="lp-hero">
        <div className="lp-hero-top">
          <p className={lpKicker}>Legal</p>
          <h1>特定商取引法に基づく表記</h1>
          <p className="lp-lead">
            レガッタナビの
            <Link className={lpAuthorMetaLink} href="/sponsor">
              スポンサーシップ
            </Link>
            に関する表記です。
          </p>
        </div>
      </section>

      <section aria-labelledby="legal-details-heading">
        <h2 id="legal-details-heading" className="lp-section-title">事業者情報</h2>
        <div className={lpAuthor}>
          <dl className={lpAuthorMeta}>
            {ROWS.map((row) => (
              <div key={row.term} className={lpAuthorMetaRow}>
                <dt className={`${lpAuthorMetaDt} flex-[0_0_140px] max-[640px]:flex-[0_0_110px]`}>{row.term}</dt>
                <dd className={`${typeof row.description === "string" ? lpAuthorMetaDdMultiline : lpAuthorMetaDd} min-w-0 [overflow-wrap:anywhere]`}>
                  {row.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  );
}
