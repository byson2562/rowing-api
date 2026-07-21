import "./globals.css";
import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import Script from "next/script";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";

import { siteUrl } from "../lib/site-url";

// 数字・欧文はInter（タイム表示の判読性・桁揃えが和文フォントの従属欧文より良い）、
// 和文はNoto Sans JPへフォールバックさせる。どちらも可変フォントを自己ホスト配信
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  preload: false,
});

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ローイング・ボート記録検索 | レガッタナビ",
    template: "%s | レガッタナビ",
  },
  description:
    "ローイング（ボート）記録を年度・大会・種目・団体で検索できるレガッタナビ。ローイング大会結果を横断して可視化できます。",
  keywords: [
    "ローイング 記録",
    "ローイング 大会 結果",
    "ローイング 大会結果",
    "ローイング大会結果",
    "ボート 記録",
    "ボート 大会結果",
    "全日本 ローイング 選手権",
    "全日本ローイング選手権",
    "ローイング",
    "ボート",
    "大会結果",
    "日本ローイング協会",
    "レース記録",
  ],
  // canonicalはページ側で出し分ける（Next 14はルートパス+クエリのcanonicalを
  // オリジンへ丸めてしまうため、レイアウトの一律指定はフィルタ付きURLと相性が悪い）
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: "レガッタナビ 大会結果" }],
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    siteName: "レガッタナビ",
    title: "ローイング・ボート記録検索 | レガッタナビ",
    description:
      "ローイング（ボート）記録とローイング大会結果を年度・大会・種目・団体で検索できるレガッタナビ。",
    images: [
      {
        url: `${siteUrl}/og`,
        width: 1200,
        height: 630,
        alt: "レガッタナビ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ローイング・ボート記録検索 | レガッタナビ",
    description:
      "ローイング（ボート）記録とローイング大会結果を年度・大会・種目・団体で検索できるレガッタナビ。",
    images: [`${siteUrl}/og`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJp.variable}`}>
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="site-brand">
              レガッタナビ
            </Link>
            <nav className="site-nav" aria-label="グローバルナビゲーション">
              <Link href="/" className="site-nav-link">
                検索
              </Link>
              <Link href="/results" className="site-nav-link">
                大会結果一覧
              </Link>
              <Link href="/records" className="site-nav-link">
                歴代記録
              </Link>
              <Link href="/organizations" className="site-nav-link">
                団体別
              </Link>
              <Link href="/athletes" className="site-nav-link">
                選手別
              </Link>
              <Link href="/articles" className="site-nav-link">
                記事
              </Link>
              <Link href="/about" className="site-nav-link">
                レガッタナビとは
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="site-footer-inner">
            <p className="site-footer-copy">
              © {new Date().getFullYear()} レガッタナビ
            </p>
            <nav
              className="site-footer-nav"
              aria-label="フッターナビゲーション"
            >
              <Link href="/" className="site-footer-link">
                検索
              </Link>
              <Link href="/results" className="site-footer-link">
                大会結果一覧
              </Link>
              <Link href="/records" className="site-footer-link">
                歴代記録
              </Link>
              <Link href="/organizations" className="site-footer-link">
                団体別
              </Link>
              <Link href="/athletes" className="site-footer-link">
                選手別
              </Link>
              <Link href="/articles" className="site-footer-link">
                記事
              </Link>
              <a href="/feed.xml" className="site-footer-link">
                RSS
              </a>
              <Link href="/about" className="site-footer-link">
                レガッタナビとは
              </Link>
              <Link href="/privacy" className="site-footer-link">
                プライバシーポリシー
              </Link>
            </nav>
          </div>
        </footer>
        {gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaMeasurementId}');
                `,
              }}
            />
            <Script
              id="ga4-custom-events"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  (function () {
                    function sendEvent(name, params) {
                      if (typeof window.gtag !== 'function') return;
                      window.gtag('event', name, params || {});
                    }

                    function trackPageViews() {
                      if (window.location.pathname === '/support') {
                        sendEvent('support_page_view', {
                          page_path: window.location.pathname,
                          page_title: document.title
                        });
                      }

                      if (window.location.pathname === '/about') {
                        sendEvent('rowing_results_page_view', {
                          page_path: window.location.pathname,
                          page_title: document.title
                        });
                      }
                    }

                    trackPageViews();

                    var previousPath = window.location.pathname;
                    function trackRouteChange() {
                      if (window.location.pathname === previousPath) return;
                      previousPath = window.location.pathname;
                      trackPageViews();
                    }

                    var pushState = history.pushState;
                    history.pushState = function () {
                      var result = pushState.apply(this, arguments);
                      setTimeout(trackRouteChange, 0);
                      return result;
                    };

                    var replaceState = history.replaceState;
                    history.replaceState = function () {
                      var result = replaceState.apply(this, arguments);
                      setTimeout(trackRouteChange, 0);
                      return result;
                    };

                    window.addEventListener('popstate', trackRouteChange);

                    document.addEventListener('click', function (event) {
                      var target = event.target instanceof Element ? event.target.closest('[data-ga-event]') : null;
                      if (!target) return;

                      var eventName = target.getAttribute('data-ga-event');
                      if (!eventName) return;

                      sendEvent(eventName, {
                        link_label: (target.getAttribute('data-ga-label') || target.textContent || '').trim(),
                        link_location: target.getAttribute('data-ga-location') || window.location.pathname,
                        link_url: target.getAttribute('href') || ''
                      });
                    });

                    window.addEventListener('rowingapi_analytics_event', function (event) {
                      var customEvent = event;
                      if (!(customEvent instanceof CustomEvent) || !customEvent.detail) return;
                      var detail = customEvent.detail;
                      if (!detail.event_name) return;
                      var eventName = detail.event_name;
                      var params = {};
                      Object.keys(detail).forEach(function (key) {
                        if (key !== 'event_name') {
                          params[key] = detail[key];
                        }
                      });
                      sendEvent(eventName, params);
                    });
                  })();
                `,
              }}
            />
          </>
        ) : null}
        {/* Figmaキャプチャは開発ツールのため本番では配信しない（CWV・セキュリティ配慮） */}
        {process.env.NODE_ENV === "development" ? (
          <Script
            src="https://mcp.figma.com/mcp/html-to-design/capture.js"
            strategy="afterInteractive"
          />
        ) : null}
        <Analytics />
      </body>
    </html>
  );
}
