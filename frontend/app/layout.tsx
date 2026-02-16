import "./globals.css";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5173";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RowingAPI",
    template: "%s | RowingAPI"
  },
  description: "日本ローイング大会記録の検索・可視化",
  keywords: ["ローイング", "ボート", "大会結果", "日本ローイング協会", "レース記録"],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    siteName: "RowingAPI",
    title: "RowingAPI",
    description: "日本ローイング大会記録の検索・可視化",
    images: [
      {
        url: `${siteUrl}/api/og`,
        width: 1200,
        height: 630,
        alt: "RowingAPI"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "RowingAPI",
    description: "日本ローイング大会記録の検索・可視化",
    images: [`${siteUrl}/api/og`]
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
      <body>{children}</body>
    </html>
  );
}
