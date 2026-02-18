import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173";
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ローイング・ボート記録検索 | RowingAPI",
    template: "%s | RowingAPI"
  },
  description:
    "ローイング（ボート）記録を年度・大会・種目・団体で検索できるRowingAPI。日本の大会結果を横断して可視化できます。",
  keywords: [
    "ローイング 記録",
    "ボート 記録",
    "ボート 大会結果",
    "全日本 ローイング 選手権",
    "全日本ローイング選手権",
    "ローイング",
    "ボート",
    "大会結果",
    "日本ローイング協会",
    "レース記録"
  ],
  alternates: {
    canonical: "/"
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg"
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    siteName: "RowingAPI",
    title: "ローイング・ボート記録検索 | RowingAPI",
    description: "ローイング（ボート）記録を年度・大会・種目・団体で検索できるRowingAPI。",
    images: [
      {
        url: `${siteUrl}/og`,
        width: 1200,
        height: 630,
        alt: "RowingAPI"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "ローイング・ボート記録検索 | RowingAPI",
    description: "ローイング（ボート）記録を年度・大会・種目・団体で検索できるRowingAPI。",
    images: [`${siteUrl}/og`]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="site-brand">
              RowingAPI
            </Link>
            <nav className="site-nav" aria-label="グローバルナビゲーション">
              <Link href="/rowing-results" className="site-nav-link">
                RowingAPIとは
              </Link>
            </nav>
          </div>
        </header>
        {children}
        {gaMeasurementId ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaMeasurementId}');
                `
              }}
            />
          </>
        ) : null}
      </body>
    </html>
  );
}
