import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description:
    "レガッタナビのプライバシーポリシー。アクセス解析・広告・掲載データの取り扱いと、訂正・削除依頼の窓口を案内しています。",
  alternates: {
    canonical: "/privacy"
  },
  openGraph: {
    title: "プライバシーポリシー | レガッタナビ",
    description:
      "レガッタナビのプライバシーポリシー。アクセス解析・広告・掲載データの取り扱いと、訂正・削除依頼の窓口を案内しています。",
    url: "/privacy"
  }
};

const contactEmail = "takumi.nakamura.by@gmail.com";

export default function PrivacyPage() {
  return (
    <main className="site-container lp-page">
      <section className="lp-hero">
        <div className="lp-hero-top">
          <h1>プライバシーポリシー</h1>
          <p className="lp-lead">
            レガッタナビ（以下「当サイト」）における利用者情報および掲載データの取り扱いについて定めます。
          </p>
        </div>
      </section>

      <section className="lp-detail" aria-labelledby="privacy-analytics-heading">
        <h2 id="privacy-analytics-heading" className="lp-section-title">
          アクセス解析ツールについて
        </h2>
        <div className="lp-detail-main">
          <p>
            当サイトは、サービス改善のためにGoogle Analytics（GA4）とVercel Web
            Analyticsを利用しています。Google
            AnalyticsはCookieを使用し、個人を特定しない形でアクセス情報を収集します。収集される情報や利用方法は
            <a
              href="https://policies.google.com/technologies/partner-sites?hl=ja"
              target="_blank"
              rel="noopener noreferrer"
            >
              Googleのポリシーと規約
            </a>
            をご確認ください。Cookieを無効にすることで収集を拒否できます。Vercel Web
            AnalyticsはCookieを使用せず、個人を特定できない統計情報のみを収集します。
          </p>
        </div>
      </section>

      <section className="lp-detail" aria-labelledby="privacy-ads-heading">
        <h2 id="privacy-ads-heading" className="lp-section-title">
          広告について
        </h2>
        <div className="lp-detail-main">
          <p>
            当サイトは、第三者配信の広告サービス（Google
            AdSense等）を利用する場合があります。広告配信事業者は、利用者の興味に応じた広告を表示するためにCookieを使用することがあります。パーソナライズ広告は
            <a
              href="https://adssettings.google.com/authenticated?hl=ja"
              target="_blank"
              rel="noopener noreferrer"
            >
              広告設定
            </a>
            で無効にできます。
          </p>
        </div>
      </section>

      <section className="lp-detail" aria-labelledby="privacy-data-heading">
        <h2 id="privacy-data-heading" className="lp-section-title">
          掲載データについて
        </h2>
        <div className="lp-detail-main">
          <p>
            当サイトは、公表された大会記録（大会名・種目・クルー名・所属団体・順位・タイム等）を検索・閲覧できる形で掲載しています。掲載内容の訂正や削除をご希望の場合は、下記の問い合わせ先までご連絡ください。ご本人確認のうえ、すみやかに対応します。
          </p>
        </div>
      </section>

      <section className="lp-detail" aria-labelledby="privacy-payment-heading">
        <h2 id="privacy-payment-heading" className="lp-section-title">
          寄付・決済について
        </h2>
        <div className="lp-detail-main">
          <p>
            <Link href="/support">サポートページ</Link>
            経由の寄付にはStripeの決済ページを利用しています。クレジットカード情報は当サイトでは取得・保持せず、Stripe社のプライバシーポリシーに基づいて処理されます。
          </p>
        </div>
      </section>

      <section className="lp-detail" aria-labelledby="privacy-disclaimer-heading">
        <h2 id="privacy-disclaimer-heading" className="lp-section-title">
          免責事項
        </h2>
        <div className="lp-detail-main">
          <p>
            当サイトの掲載情報は正確性の維持に努めていますが、その完全性・正確性を保証するものではありません。当サイトの利用によって生じた損害について、運営者は責任を負いかねます。また、本ポリシーは法令の変更やサービス内容の変更に応じて、予告なく改定されることがあります。
          </p>
        </div>
      </section>

      <section className="lp-detail" aria-labelledby="privacy-contact-heading">
        <h2 id="privacy-contact-heading" className="lp-section-title">
          お問い合わせ
        </h2>
        <div className="lp-detail-main">
          <p>
            本ポリシーおよび掲載データに関するお問い合わせは、
            <a
              href={`mailto:${contactEmail}?subject=レガッタナビ%20%E3%83%97%E3%83%A9%E3%82%A4%E3%83%90%E3%82%B7%E3%83%BC%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6`}
            >
              {contactEmail}
            </a>
            までお願いします。
          </p>
          <p>制定日: 2026年7月20日</p>
        </div>
      </section>
    </main>
  );
}
