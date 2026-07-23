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
  lpDetail,
  lpDetailCard,
  lpDetailTitle,
  lpDonationLinks,
  lpFactBlock,
  lpFactBody,
  lpFactGrid,
  lpFactLabel,
  lpKicker,
  lpSummaryDd,
  lpSummaryDt,
  lpSummaryItem,
  lpSummaryList,
  lpSupportNote,
  lpSupportTemplate,
  lpTechHeading
} from "../../components/lp/lp-classes";
import { getDatasetSummary } from "../../lib/results-data";

export const metadata: Metadata = {
  title: "スポンサー募集・寄付",
  description:
    "レガッタナビのスポンサー募集ページ。企業・団体協賛の掲載メニューと、個人寄付の受付を案内しています。日本のローイング大会結果データベースの運営を支援いただけます。",
  alternates: {
    canonical: "/sponsor"
  },
  openGraph: {
    title: "スポンサー募集・寄付 | レガッタナビ",
    description:
      "レガッタナビのスポンサー募集ページ。企業・団体協賛の掲載メニューと、個人寄付の受付を案内しています。",
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
          <p className={lpKicker}>Sponsor レガッタナビ</p>
          <h1>スポンサー募集</h1>
          <p className="lp-lead">
            レガッタナビは、全日本級{summary.competitionCategoryCount}大会・{totalCountLabel}
            レースを収録する、日本のローイング大会結果データベースです。競技に関わる人が記録を調べられる環境を続けるため、企業・団体の協賛と個人の寄付を募集しています。
          </p>
          <div className="lp-hero-actions">
            <ButtonLink
              href="#contact"
              data-ga-event="sponsor_inquiry_click"
              data-ga-label="sponsor_hero_cta"
              data-ga-location="/sponsor"
            >
              協賛の相談をする
            </ButtonLink>
            <ButtonLink href="/" variant="secondary">
              サービスを見る
            </ButtonLink>
          </div>
        </div>
      </section>

      <section aria-labelledby="sponsor-audience-heading">
        <h2 id="sponsor-audience-heading" className="lp-section-title">届く相手</h2>
        <dl className={lpFactGrid}>
          <div className={lpFactBlock}>
            <dt className={lpFactLabel}>競技者・大学部員</dt>
            <dd className={`ml-0 ${lpFactBody}`}>
              自分や対戦相手の記録を調べに来る現役層。大会期間中はインカレ・全日本級のレース直後にアクセスが集中します。
            </dd>
          </div>
          <div className={lpFactBlock}>
            <dt className={lpFactLabel}>OB・OG、指導者、ご家族</dt>
            <dd className={`ml-0 ${lpFactBody}`}>
              母校や教え子の結果を追う応援層。ボート関係者がほぼ100%という、他媒体にはない濃さが特徴です。
            </dd>
          </div>
          <div className={lpFactBlock}>
            <dt className={lpFactLabel}>体育会学生に届けたい企業に</dt>
            <dd className={`ml-0 ${lpFactBody}`}>
              閲覧者の中心は大学ボート部の現役とOB・OG。体育会採用や競技用品・ウェアの案内が、狙った相手にそのまま届きます。
            </dd>
          </div>
          <div className={lpFactBlock}>
            <dt className={lpFactLabel}>データの実績</dt>
            <dd className={`ml-0 ${lpFactBody}`}>
              全日本級{summary.competitionCategoryCount}大会・{summary.minYear}〜{summary.maxYear}年の
              {totalCountLabel}レースを収録し、毎日自動更新。国内で唯一の横断データベースです。
            </dd>
          </div>
        </dl>
      </section>

      <section className={lpDetail} aria-labelledby="sponsor-menu-heading">
        <h2 id="sponsor-menu-heading" className={`lp-section-title ${lpDetailTitle}`}>企業・団体協賛</h2>
        <article className={lpDetailCard}>
          <h3>掲載メニュー</h3>
          <dl className={lpSummaryList}>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>ライトプラン</dt>
              <dd className={lpSummaryDd}>月額 5,000円: 全ページ共通のフッター協賛枠に協賛名を掲載</dd>
            </div>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>スタンダードプラン</dt>
              <dd className={lpSummaryDd}>月額 10,000円: 協賛名にリンクを設定+記事末尾にも掲載</dd>
            </div>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>掲載開始まで</dt>
              <dd className={lpSummaryDd}>お問い合わせ → 掲載内容の確認 → 掲載開始(最短3営業日)の3ステップです。</dd>
            </div>
          </dl>
        </article>
        <aside className={lpDetailCard}>
          <h3>想定している協賛者</h3>
          <dl className={lpSummaryList}>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>ボート関連</dt>
              <dd className={lpSummaryDd}>艇・オール・ウェアなどの用品メーカー、販売店</dd>
            </div>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>大学・団体</dt>
              <dd className={lpSummaryDd}>大学漕艇部OB・OG会、競技団体、レガッタ開催地の店舗・自治体</dd>
            </div>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>採用・進路</dt>
              <dd className={lpSummaryDd}>体育会学生の採用に取り組む企業・人材サービス</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section aria-labelledby="sponsor-donation-heading">
        <h2 id="sponsor-donation-heading" className="lp-section-title">個人の寄付</h2>
        <div className={lpDetailCard}>
          <p className={`mt-0 ${lpFactBody}`}>
            ご支援は、レガッタナビの運用継続・データ更新・機能改善に充てます。金額にかかわらず、続ける力になります。
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

      <section id="contact" aria-labelledby="sponsor-contact-heading" className="scroll-mt-16">
        <h2 id="sponsor-contact-heading" className="lp-section-title">お問い合わせ</h2>
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
