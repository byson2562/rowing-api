import type { Metadata } from "next";
import Link from "next/link";

import { SponsorApplyForm } from "../../components/contact-forms";
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
  lpSummaryItem,
  lpSummaryList
} from "../../components/lp/lp-classes";

export const metadata: Metadata = {
  title: "スポンサー募集",
  description:
    "レガッタナビは個人が運営する無料のローイング大会結果データベースです。運営を続けるため、応援してくださる企業・団体・個人の方からのご連絡を受け付けています。",
  alternates: {
    canonical: "/sponsor"
  },
  openGraph: {
    title: "スポンサー募集 | レガッタナビ",
    description:
      "レガッタナビは個人が運営する無料のローイング大会結果データベースです。運営を続けるため、応援してくださる企業・団体・個人の方からのご連絡を受け付けています。",
    url: "/sponsor"
  }
};

export default function SponsorPage() {
  return (
    <main className="site-container lp-page">
      <section className="lp-hero">
        <div className="lp-hero-top">
          <p className={lpKicker}>Support レガッタナビ</p>
          <h1>スポンサー募集</h1>
          <p className="lp-lead">
            レガッタナビは、ローイングの大会結果を収録する無料のデータベースです。個人で運営しており、運営を支えてくださるスポンサーを募集しています。
          </p>
        </div>
      </section>

      <section aria-labelledby="sponsor-plans-heading">
        <h2 id="sponsor-plans-heading" className="lp-section-title">スポンサーになる</h2>
        <div className={lpDetailCard}>
          <dl className={lpSummaryList}>
            <div className={lpSummaryItem}>
              <dt className="m-0 text-[18px] font-bold text-[#1f3d64]">一口 年5,000円</dt>
              <dd className={lpSummaryDd}>
                何口でも歓迎です。お礼のメッセージをお送りします。ご希望があれば、サイト内の協賛枠にお名前を掲載させていただきます。
              </dd>
            </div>
          </dl>
          <p className="mt-3 mb-0 text-[14px] leading-[1.7] text-rn-text">
            企業・団体でのご協賛は、内容・金額とも個別にご相談ください。
          </p>
        </div>
      </section>

      <section aria-labelledby="sponsor-apply-heading">
        <h2 id="sponsor-apply-heading" className="lp-section-title">申し込みフォーム</h2>
        <div className={lpAuthor}>
          <p className="mt-0 mb-0 text-[14px] leading-[1.7] text-rn-text">
            送信いただいた内容を確認のうえ、お支払い方法などをメールでご連絡します。
          </p>
          <SponsorApplyForm />
          <dl className={lpAuthorMeta}>
            <div className={lpAuthorMetaRow}>
              <dt className={lpAuthorMetaDt}>その他</dt>
              <dd className={lpAuthorMetaDd}>
                企業・団体でのご協賛のご相談や、スポンサー以外のご用件は{" "}
                <Link className={lpAuthorMetaLink} href="/contact">
                  お問い合わせ
                </Link>{" "}
                からお願いします。
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
