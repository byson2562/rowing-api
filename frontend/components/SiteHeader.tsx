"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavLink = { href: string; label: string };

// ナビは1段(ドロップダウンなし)。スポンサー・お問い合わせはフッターと「レガッタナビとは」から辿る
const NAV_ITEMS: NavLink[] = [
  { href: "/search", label: "検索" },
  { href: "/results", label: "大会結果" },
  { href: "/records", label: "歴代記録" },
  { href: "/organizations", label: "団体別" },
  { href: "/athletes", label: "選手別" },
  { href: "/articles", label: "記事" },
  { href: "/about", label: "レガッタナビとは" }
];

// サイトの一言。ワードマークの横に小さな灰文字で添える
const TAGLINE = "データで見るボート";

function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// 14px の墨。現在地は下線(2px、文字から少し離す)で示す
const navLinkBase =
  "inline-flex min-h-10 items-center border-b-2 text-[14px] font-medium leading-[1.4] text-rn-text no-underline " +
  "hover:border-rn-border-strong hover:no-underline";
const navLinkIdle = `${navLinkBase} border-transparent`;
const navLinkCurrent = `${navLinkBase} border-rn-border-strong`;

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";

  return (
    <header className="border-b border-rn-border">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-5 py-3 md:px-10 md:py-0">
        <Link
          href="/"
          className="flex items-baseline gap-3 text-[18px] font-bold leading-[1.4] tracking-[0.04em] text-rn-text no-underline hover:no-underline md:py-4"
          onClick={() => setOpen(false)}
        >
          レガッタナビ
          <span className="hidden text-[12px] font-normal leading-[1.4] tracking-normal text-rn-meta sm:inline">{TAGLINE}</span>
        </Link>

        {/* デスクトップ: 1段の横並びナビ。現在地に下線 */}
        <nav className="hidden items-stretch gap-6 self-stretch md:flex" aria-label="グローバルナビゲーション">
          {NAV_ITEMS.map((item) => {
            const current = isCurrent(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={current ? navLinkCurrent : navLinkIdle}
                aria-current={current ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* モバイル: ハンバーガーボタン */}
        <button
          type="button"
          className="inline-flex cursor-pointer appearance-none items-center justify-center rounded-rn-control border-0 bg-transparent p-2 font-[inherit] text-rn-text md:hidden"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((prev) => !prev)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? (
              <>
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* モバイル: 展開メニュー(1段のリスト。現在地は太字) */}
      {open && (
        <nav id="mobile-nav" className="flex flex-col border-t border-rn-border px-5 py-2 md:hidden" aria-label="モバイルナビゲーション">
          {NAV_ITEMS.map((item) => {
            const current = isCurrent(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b border-rn-border-soft py-3 text-[15px] leading-[1.5] text-rn-text no-underline last:border-b-0 hover:underline ${current ? "font-bold" : "font-medium"}`}
                aria-current={current ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
