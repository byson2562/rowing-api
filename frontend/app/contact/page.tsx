import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "../../components/contact-forms";
import {
  lpAuthor,
  lpAuthorMeta,
  lpAuthorMetaDd,
  lpAuthorMetaDt,
  lpAuthorMetaLink,
  lpAuthorMetaRow,
  lpKicker
} from "../../components/lp/lp-classes";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "レガッタナビへのお問い合わせページです。掲載データの誤り・ご要望・協賛のご相談など、フォームまたはメールでご連絡ください。",
  alternates: {
    canonical: "/contact"
  },
  openGraph: {
    title: "お問い合わせ | レガッタナビ",
    description:
      "レガッタナビへのお問い合わせページです。掲載データの誤り・ご要望・協賛のご相談など、フォームまたはメールでご連絡ください。",
    url: "/contact"
  }
};

export default function ContactPage() {
  return (
    <main className="site-container lp-page">
      <section className="lp-hero">
        <div className="lp-hero-top">
          <p className={lpKicker}>Contact</p>
          <h1>お問い合わせ</h1>
          <p className="lp-lead">
            掲載データの誤り・ご要望・企業・団体での協賛のご相談など、お気軽にご連絡ください。内容を確認のうえ、メールでご返信します。
          </p>
        </div>
      </section>

      <section aria-labelledby="contact-form-heading">
        <h2 id="contact-form-heading" className="lp-section-title">フォームから問い合わせる</h2>
        <div className={lpAuthor}>
          <ContactForm />
          <dl className={lpAuthorMeta}>
            <div className={lpAuthorMetaRow}>
              <dt className={lpAuthorMetaDt}>メール</dt>
              <dd className={lpAuthorMetaDd}>
                <a
                  className={lpAuthorMetaLink}
                  href="mailto:takumi.nakamura.by@gmail.com"
                  data-ga-event="contact_click"
                  data-ga-label="contact_mail"
                  data-ga-location="/contact"
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
