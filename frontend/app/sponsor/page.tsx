import type { Metadata } from "next";
import Link from "next/link";

import ButtonLink from "../../components/ui/ButtonLink";
import { SupportContactForm } from "../../components/support-contact-form";
import {
  lpAuthor,
  lpAuthorMeta,
  lpAuthorMetaDd,
  lpAuthorMetaDt,
  lpAuthorMetaLink,
  lpAuthorMetaRow,
  lpDetailCard,
  lpDonationLinks,
  lpFactBody,
  lpKicker,
  lpSummaryDd,
  lpSummaryDt,
  lpSummaryItem,
  lpSummaryList,
  lpSupportNote,
  lpTechHeading
} from "../../components/lp/lp-classes";
import { getDatasetSummary } from "../../lib/results-data";

export const metadata: Metadata = {
  title: "応援のお願い（寄付・スポンサー）",
  description:
    "レガッタナビは個人が運営する無料のローイング大会結果データベースです。運営を続けるための寄付と、企業・団体の協賛を受け付けています。",
  alternates: {
    canonical: "/sponsor"
  },
  openGraph: {
    title: "応援のお願い（寄付・スポンサー） | レガッタナビ",
    description:
      "レガッタナビは個人が運営する無料のローイング大会結果データベースです。運営を続けるための寄付と、企業・団体の協賛を受け付けています。",
    url: "/sponsor"
  }
};

export default function SponsorPage() {
  const summary = getDatasetSummary();
  const totalCountLabel = new Intl.NumberFormat("ja-JP").format(summary.totalCount);

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

  return (
    <main className="site-container lp-page">
      <section className="lp-hero">
        <div className="lp-hero-top">
          <p className={lpKicker}>Support レガッタナビ</p>
          <h1>レガッタナビを応援してください</h1>
          <p className="lp-lead">
            レガッタナビは、全日本級{summary.competitionCategoryCount}大会・{totalCountLabel}
            レースを収録する無料のデータベースです。サーバー代とデータ整備を個人でまかなって運営しています。続けていくために、応援していただける方を探しています。
          </p>
        </div>
      </section>

      <section aria-labelledby="sponsor-donation-heading">
        <h2 id="sponsor-donation-heading" className="lp-section-title">寄付で応援する</h2>
        <div className={lpDetailCard}>
          <p className={`mt-0 ${lpFactBody}`}>
            金額にかかわらず、続ける力になります。いただいた支援は運用費・データ更新・機能改善に充てます。
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
                  data-ga-label={`sponsor_donation_stripe_${item.key}`}
                  data-ga-location="/sponsor"
                >
                  {item.label}
                </ButtonLink>
              ))
            ) : (
              <ButtonLink
                href={fallbackDonationUrl}
                data-ga-event="donation_click"
                data-ga-label="sponsor_donation_mail_fallback"
                data-ga-location="/sponsor"
              >
                Stripeで寄付する
              </ButtonLink>
            )}
          </div>
          <p className={lpSupportNote}>決済はStripeを利用します。カード情報を当サイトが保持することはありません。</p>
        </div>
      </section>

      <section aria-labelledby="sponsor-corporate-heading">
        <h2 id="sponsor-corporate-heading" className="lp-section-title">企業・団体の方へ</h2>
        <div className={lpDetailCard}>
          <p className={`mt-0 ${lpFactBody}`}>
            協賛いただいた企業・団体は、全ページ共通のフッター協賛枠にお名前を掲載します。
          </p>
          <dl className={lpSummaryList}>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>ライト</dt>
              <dd className={lpSummaryDd}>月額 5,000円: 協賛名を掲載</dd>
            </div>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>スタンダード</dt>
              <dd className={lpSummaryDd}>月額 10,000円: 協賛名+リンクを掲載</dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="sponsor-contact-heading">
        <h2 id="sponsor-contact-heading" className="lp-section-title">お問い合わせ</h2>
        <div className={lpAuthor}>
          <p className={`mt-0 ${lpFactBody}`}>
            協賛のご相談・その他のお問い合わせは、フォームまたはメールでお気軽にどうぞ。
          </p>
          <h3 className={lpTechHeading}>フォームから問い合わせる</h3>
          <SupportContactForm />
          <dl className={lpAuthorMeta}>
            <div className={lpAuthorMetaRow}>
              <dt className={lpAuthorMetaDt}>メール</dt>
              <dd className={lpAuthorMetaDd}>
                <a
                  className={lpAuthorMetaLink}
                  href="mailto:takumi.nakamura.by@gmail.com"
                  data-ga-event="sponsor_inquiry_click"
                  data-ga-label="sponsor_contact_mail"
                  data-ga-location="/sponsor"
                >
                  takumi.nakamura.by@gmail.com
                </a>
              </dd>
            </div>
            <div className={lpAuthorMetaRow}>
              <dt className={lpAuthorMetaDt}>運営者</dt>
              <dd className={lpAuthorMetaDd}>
                <Link className={lpAuthorMetaLink} href="/about">
                  レガッタナビについて(開発者情報)
                </Link>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
