import type { Metadata } from "next";
import Link from "next/link";

import { SupportContactForm } from "../../components/support-contact-form";
import {
  lpAuthor,
  lpAuthorMeta,
  lpAuthorMetaDd,
  lpAuthorMetaDt,
  lpAuthorMetaLink,
  lpAuthorMetaRow,
  lpDetailCard,
  lpKicker,
  lpSummaryDd,
  lpSummaryDt,
  lpSummaryItem,
  lpSummaryList,
  lpTechHeading
} from "../../components/lp/lp-classes";
import { getDatasetSummary } from "../../lib/results-data";

export const metadata: Metadata = {
  title: "応援のお願い（協賛・スポンサー）",
  description:
    "レガッタナビは個人が運営する無料のローイング大会結果データベースです。運営を続けるため、応援してくださる企業・団体・個人の方からのご連絡を受け付けています。",
  alternates: {
    canonical: "/sponsor"
  },
  openGraph: {
    title: "応援のお願い（協賛・スポンサー） | レガッタナビ",
    description:
      "レガッタナビは個人が運営する無料のローイング大会結果データベースです。運営を続けるため、応援してくださる企業・団体・個人の方からのご連絡を受け付けています。",
    url: "/sponsor"
  }
};

export default function SponsorPage() {
  const summary = getDatasetSummary();
  const totalCountLabel = new Intl.NumberFormat("ja-JP").format(summary.totalCount);

  return (
    <main className="site-container lp-page">
      <section className="lp-hero">
        <div className="lp-hero-top">
          <p className={lpKicker}>Support レガッタナビ</p>
          <h1>レガッタナビを応援してください</h1>
          <p className="lp-lead">
            レガッタナビは、全日本級{summary.competitionCategoryCount}大会・{totalCountLabel}
            レースを収録する無料のデータベースです。サーバー代とデータ整備を個人でまかなって運営しています。続けていくために、応援していただける方を探しています。応援いただける方は、下のフォームからご連絡ください。
          </p>
        </div>
      </section>

      <section aria-labelledby="sponsor-plans-heading">
        <h2 id="sponsor-plans-heading" className="lp-section-title">スポンサーになる</h2>
        <div className={lpDetailCard}>
          <dl className={lpSummaryList}>
            <div className={lpSummaryItem}>
              <dt className={lpSummaryDt}>一口 月500円</dt>
              <dd className={lpSummaryDd}>
                何口でも歓迎です。お礼のメッセージをお送りします。ご希望があれば、全ページ共通のフッター協賛枠にお名前を掲載します。
              </dd>
            </div>
          </dl>
          <p className="mt-3 mb-0 text-[14px] leading-[1.7] text-rn-text">
            企業・団体でのご協賛は、内容・金額とも個別にご相談ください。
          </p>
        </div>
      </section>

      <section aria-labelledby="sponsor-contact-heading">
        <h2 id="sponsor-contact-heading" className="lp-section-title">お問い合わせ</h2>
        <div className={lpAuthor}>
          <p className="mt-0 mb-0 text-[14px] leading-[1.7] text-rn-text">
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
