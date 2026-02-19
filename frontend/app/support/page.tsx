import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RowingAPI サポート・協賛募集",
  description:
    "RowingAPIの運営サポートページ。寄付・協賛の受付内容と、掲載メニュー、問い合わせ方法を案内しています。",
  alternates: {
    canonical: "/support"
  },
  openGraph: {
    title: "RowingAPI サポート・協賛募集",
    description:
      "RowingAPIの運営サポートページ。寄付・協賛の受付内容と、掲載メニュー、問い合わせ方法を案内しています。",
    url: "/support"
  }
};

export default function SupportPage() {
  const donationUrl =
    process.env.NEXT_PUBLIC_DONATION_URL ??
    "mailto:takumi.nakamura.by@gmail.com?subject=RowingAPI%20%E5%AF%84%E4%BB%98%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6";
  const donationIsExternal = /^https?:\/\//.test(donationUrl);

  return (
    <main className="container lp-page">
      <section className="lp-hero">
        <div className="lp-hero-top">
          <p className="lp-kicker">Support RowingAPI</p>
          <h1>RowingAPI サポート・協賛募集</h1>
          <p className="lp-lead">
            RowingAPIは、ローイング記録を継続的に検索・比較できる環境を目指して運営しています。
            サービス継続のため、個人寄付と企業・団体協賛を募集しています。
          </p>
          <div className="lp-hero-actions">
            <Link href="/" className="lp-btn lp-btn-primary">
              検索画面を見る
            </Link>
            <a
              className="lp-btn lp-btn-primary"
              href={donationUrl}
              target={donationIsExternal ? "_blank" : undefined}
              rel={donationIsExternal ? "noopener noreferrer" : undefined}
              data-ga-event="donation_click"
              data-ga-label="support_donation_button"
              data-ga-location="/support"
            >
              寄付でサポートする
            </a>
            <a
              className="lp-btn lp-btn-secondary"
              href="mailto:takumi.nakamura.by@gmail.com?subject=RowingAPI%20%E5%8D%94%E8%B3%9B%E3%83%BB%E3%82%B5%E3%83%9D%E3%83%BC%E3%83%88%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6"
              data-ga-event="sponsor_inquiry_click"
              data-ga-label="support_inquiry_button"
              data-ga-location="/support"
            >
              問い合わせる
            </a>
          </div>
        </div>
      </section>

      <section className="lp-detail" aria-labelledby="support-menu-heading">
        <h2 id="support-menu-heading" className="lp-section-title">サポートメニュー</h2>
        <article className="lp-detail-main">
          <h3>個人サポート（寄付）</h3>
          <ul>
            <li>想定金額: 500円 / 1,000円 / 3,000円</li>
            <li>用途: データ更新、保守運用、機能改善</li>
            <li>寄付特典: 新機能や更新情報を優先案内</li>
          </ul>
          <p className="lp-support-note">
            決済リンクを設置する場合は、以下の文言をそのまま利用できます。<br />
            「ご支援は、RowingAPIの運用継続・データ更新・機能改善に充てます。」
          </p>
        </article>

        <aside className="lp-detail-side">
          <h3>企業・団体協賛</h3>
          <dl className="lp-summary-list">
            <div>
              <dt>ライトプラン</dt>
              <dd>月額 5,000円: サイト内に協賛名を掲載</dd>
            </div>
            <div>
              <dt>スタンダード</dt>
              <dd>月額 10,000円: 協賛名 + リンク掲載</dd>
            </div>
            <div>
              <dt>募集対象</dt>
              <dd>ボート・ローイング関連企業、大学・団体、OB会 など</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="lp-author-section" aria-labelledby="support-contact-heading">
        <h2 id="support-contact-heading" className="lp-section-title">問い合わせテンプレ</h2>
        <div className="lp-author">
          <h3>協賛問い合わせ文（コピー可）</h3>
          <pre className="lp-support-template">
{`件名: RowingAPI 協賛のご相談

RowingAPI運営者様

お世話になっております。<団体名> の <氏名> です。
貴サービスの協賛について、掲載条件・開始時期をご相談したくご連絡しました。
想定プランは <ライト/スタンダード> です。

ご確認のほど、よろしくお願いいたします。`}
          </pre>
          <h3 className="lp-tech-heading">連絡先</h3>
          <dl className="lp-author-meta">
            <div>
              <dt>メール</dt>
              <dd>
                <a
                  href="mailto:takumi.nakamura.by@gmail.com"
                  data-ga-event="sponsor_inquiry_click"
                  data-ga-label="support_contact_mail"
                  data-ga-location="/support"
                >
                  takumi.nakamura.by@gmail.com
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
