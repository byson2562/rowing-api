import type { Metadata } from "next";

import ButtonLink from "../../components/ui/ButtonLink";
import { SupportContactForm } from "../../components/support-contact-form";
import {
  lpAuthor,
  lpAuthorMeta,
  lpAuthorMetaDd,
  lpAuthorMetaDt,
  lpAuthorMetaLink,
  lpAuthorMetaRow,
  lpDetail,
  lpDetailCard,
  lpDetailList,
  lpDetailTitle,
  lpDonationLinks,
  lpKicker,
  lpSummaryDd,
  lpSummaryDt,
  lpSummaryItem,
  lpSummaryList,
  lpSupportNote,
  lpSupportTemplate,
  lpTechHeading
} from "../../components/lp/lp-classes";

export const metadata: Metadata = {
  title: "レガッタナビ サポート・協賛募集",
  description:
    "レガッタナビの運営サポートページ。寄付・協賛の受付内容と、掲載メニュー、問い合わせ方法を案内しています。",
  alternates: {
    canonical: "/support"
  },
  openGraph: {
    title: "レガッタナビ サポート・協賛募集",
    description:
      "レガッタナビの運営サポートページ。寄付・協賛の受付内容と、掲載メニュー、問い合わせ方法を案内しています。",
    url: "/support"
  }
};

export default function SupportPage() {
  const stripeDonateUrl = process.env.NEXT_PUBLIC_STRIPE_DONATE_URL?.trim() || "";
  const legacyDonationUrl = process.env.NEXT_PUBLIC_DONATION_URL?.trim() || "";

  const stripeLinks = [
    { label: "500円で寄付", key: "500", url: process.env.NEXT_PUBLIC_STRIPE_DONATE_URL_500 },
    { label: "1,000円で寄付", key: "1000", url: process.env.NEXT_PUBLIC_STRIPE_DONATE_URL_1000 },
    { label: "3,000円で寄付", key: "3000", url: process.env.NEXT_PUBLIC_STRIPE_DONATE_URL_3000 },
    { label: "自由な金額で寄付", key: "custom", url: process.env.NEXT_PUBLIC_STRIPE_DONATE_URL_CUSTOM }
  ].filter((item): item is { label: string; key: string; url: string } => Boolean(item.url));

  const fallbackDonationUrl =
    stripeDonateUrl ||
    legacyDonationUrl ||
    "mailto:takumi.nakamura.by@gmail.com?subject=レガッタナビ%20%E5%AF%84%E4%BB%98%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6";
  const fallbackDonationLabel = "Stripeで寄付する";

  return (
    <main className="site-container lp-page">
      <section className="lp-hero">
        <div className="lp-hero-top">
          <p className={lpKicker}>Support レガッタナビ</p>
          <h1>レガッタナビ サポート・協賛募集</h1>
          <p className="lp-lead">
            レガッタナビは、ローイング記録を継続的に検索・比較できる環境を目指して運営しています。
            サービス継続のため、個人寄付と企業・団体協賛を募集しています。
          </p>
          <div className="lp-hero-actions">
            <ButtonLink href="/">検索画面を見る</ButtonLink>
            <ButtonLink
              href="mailto:takumi.nakamura.by@gmail.com?subject=レガッタナビ%20%E5%8D%94%E8%B3%9B%E3%83%BB%E3%82%B5%E3%83%9D%E3%83%BC%E3%83%88%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6"
              variant="secondary"
              data-ga-event="sponsor_inquiry_click"
              data-ga-label="support_inquiry_button"
              data-ga-location="/support"
            >
              問い合わせる
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className={lpDetail} aria-labelledby="support-menu-heading">
        <h2 id="support-menu-heading" className={`lp-section-title ${lpDetailTitle}`}>サポートメニュー</h2>
        <article className={lpDetailCard}>
          <h3>個人サポート（寄付）</h3>
          <ul className={lpDetailList}>
            <li>想定金額: 500円 / 1,000円 / 3,000円</li>
            <li>用途: データ更新、保守運用、機能改善</li>
            <li>寄付特典: 新機能や更新情報を優先案内</li>
          </ul>
          <p className={lpSupportNote}>
            Stripe決済リンクを設置する場合は、以下の文言をそのまま利用できます。<br />
            「ご支援は、レガッタナビの運用継続・データ更新・機能改善に充てます。」
          </p>
          <div className={lpDonationLinks} aria-label="寄付リンク">
            {stripeLinks.length > 0 ? (
              stripeLinks.map((item) => (
                <ButtonLink
                  key={item.key}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ga-event="donation_click"
                  data-ga-label={`support_donation_stripe_${item.key}`}
                  data-ga-location="/support"
                >
                  {item.label}
                </ButtonLink>
              ))
            ) : (
              <ButtonLink
                href={fallbackDonationUrl}
                data-ga-event="donation_click"
                data-ga-label="support_donation_mail_fallback"
                data-ga-location="/support"
              >
                {fallbackDonationLabel}
              </ButtonLink>
            )}
          </div>
        </article>

        <aside className={lpDetailCard}>
          <h3>企業・団体協賛</h3>
          <dl className={lpSummaryList}>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>ライトプラン</dt>
              <dd className={lpSummaryDd}>月額 5,000円: サイト内に協賛名を掲載</dd>
            </div>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>スタンダード</dt>
              <dd className={lpSummaryDd}>月額 10,000円: 協賛名 + リンク掲載</dd>
            </div>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>募集対象</dt>
              <dd className={lpSummaryDd}>ボート・ローイング関連企業、大学・団体、OB会 など</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="lp-author-section" aria-labelledby="support-contact-heading">
        <h2 id="support-contact-heading" className="lp-section-title">問い合わせテンプレ</h2>
        <div className={lpAuthor}>
          <h3>協賛問い合わせ文（コピー可）</h3>
          <pre className={lpSupportTemplate}>
{`件名: レガッタナビ 協賛のご相談

レガッタナビ運営者様

お世話になっております。<団体名> の <氏名> です。
貴サービスの協賛について、掲載条件・開始時期をご相談したくご連絡しました。
想定プランは <ライト/スタンダード> です。

ご確認のほど、よろしくお願いいたします。`}
          </pre>
          <h3 className={lpTechHeading}>連絡先</h3>
          <SupportContactForm />
          <dl className={lpAuthorMeta}>
            <div className={lpAuthorMetaRow}>
              <dt className={lpAuthorMetaDt}>メール</dt>
              <dd className={lpAuthorMetaDd}>
                <a
                  className={lpAuthorMetaLink}
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
