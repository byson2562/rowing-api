"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/search", label: "検索" },
  { href: "/results", label: "大会結果一覧" },
  { href: "/records", label: "歴代記録" },
  { href: "/organizations", label: "団体別" },
  { href: "/athletes", label: "選手別" },
  { href: "/articles", label: "記事" },
  { href: "/about", label: "レガッタナビとは" }
];

const linkColorClass = "text-rn-link no-underline hover:underline hover:text-rn-primary";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-rn-border">
      <div className="mx-auto flex max-w-[1220px] items-center justify-between gap-3 px-3.5 py-2 md:px-6 md:py-2.5">
        <Link
          href="/"
          className="text-[15px] font-extrabold tracking-[0.02em] text-rn-brand no-underline md:text-base"
          onClick={() => setOpen(false)}
        >
          レガッタナビ
        </Link>

        {/* デスクトップ: 横並びナビ */}
        <nav className="hidden items-center gap-[18px] md:inline-flex" aria-label="グローバルナビゲーション">
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className={`text-[13px] font-medium ${linkColorClass}`}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* モバイル: ハンバーガーボタン */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-rn-brand md:hidden"
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

      {/* モバイル: 展開メニュー */}
      {open && (
        <nav
          id="mobile-nav"
          className="flex flex-col border-t border-rn-border px-3.5 py-1 md:hidden"
          aria-label="モバイルナビゲーション"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`py-2.5 text-sm font-medium ${linkColorClass}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
