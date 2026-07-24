"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type NavLink = { href: string; label: string };
type NavItem = NavLink | { label: string; children: NavLink[] };

// トップレベルは5項目まで。ホームは左のロゴが担うのでナビには置かない。
const NAV_ITEMS: NavItem[] = [
  { href: "/search", label: "検索" },
  {
    label: "大会結果",
    children: [
      { href: "/results", label: "大会結果一覧" },
      { href: "/records", label: "歴代記録" }
    ]
  },
  {
    label: "選手・団体",
    children: [
      { href: "/organizations", label: "団体別" },
      { href: "/athletes", label: "選手別" }
    ]
  },
  { href: "/articles", label: "記事" },
  {
    label: "サイトについて",
    children: [
      { href: "/about", label: "レガッタナビとは" },
      { href: "/sponsor", label: "スポンサー" },
      { href: "/contact", label: "お問い合わせ" }
    ]
  }
];

function hasChildren(item: NavItem): item is { label: string; children: NavLink[] } {
  return "children" in item;
}

const linkColorClass = "text-rn-link no-underline hover:underline hover:text-rn-primary";

// ブランドマーク(交差オール)。public/favicon.svg と同一の図形をインライン化する
function BrandMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="52 52 408 408"
      className="shrink-0 rounded-[6px]"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="52" y="52" width="408" height="408" rx="96" fill="#1D6EE0" />
      <g transform="translate(196 194) scale(-1 1) rotate(-52)">
        <line x1="-268" y1="0" x2="2" y2="0" stroke="#BCD9FF" strokeWidth="30" strokeLinecap="round" />
        <path
          d="M4 -18 L124 -36 L124 62 L38 49 Q28 20 4 16 Z"
          fill="#BCD9FF"
          stroke="#BCD9FF"
          strokeWidth="12"
          strokeLinejoin="round"
        />
      </g>
      <g transform="translate(316 194) rotate(-52)">
        <line x1="-268" y1="0" x2="2" y2="0" stroke="#FFFFFF" strokeWidth="30" strokeLinecap="round" />
        <path
          d="M4 -18 L124 -36 L124 62 L38 49 Q28 20 4 16 Z"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth="12"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M2.5 4.5 L6 8 L9.5 4.5" />
    </svg>
  );
}

// クリックで開くドロップダウン(ホバー開閉はタッチ端末で誤爆するため使わない)
function NavDropdown({
  label,
  items,
  isOpen,
  onToggle,
  onClose
}: {
  label: string;
  items: NavLink[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        className={`inline-flex cursor-pointer appearance-none items-center gap-1 border-0 bg-transparent p-0 font-[inherit] text-[13px] font-medium ${linkColorClass}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={onToggle}
      >
        {label}
        <Caret open={isOpen} />
      </button>
      {isOpen && (
        <div className="absolute left-[-10px] top-[calc(100%+10px)] z-20 min-w-[184px] rounded-rn-card border border-rn-border bg-white p-1.5 shadow-rn-soft">
          {items.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className="block rounded-[8px] px-2.5 py-2 text-[13px] font-medium text-rn-link no-underline hover:bg-[#f2f7fe] hover:text-rn-primary"
              onClick={onClose}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // 外側クリックと Esc でドロップダウンを閉じる
  useEffect(() => {
    if (!openMenu) return;

    const onPointerDown = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpenMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  return (
    <header className="border-b border-rn-border">
      <div className="mx-auto flex max-w-[1220px] items-center justify-between gap-3 px-3.5 py-2 md:px-6 md:py-2.5">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-extrabold tracking-[0.02em] text-rn-brand no-underline md:text-base"
          onClick={() => setOpen(false)}
        >
          <BrandMark />
          レガッタナビ
        </Link>

        {/* デスクトップ: 横並びナビ(グループはクリックで開くドロップダウン) */}
        <nav ref={navRef} className="hidden items-center gap-[18px] md:inline-flex" aria-label="グローバルナビゲーション">
          {NAV_ITEMS.map((item) =>
            hasChildren(item) ? (
              <NavDropdown
                key={item.label}
                label={item.label}
                items={item.children}
                isOpen={openMenu === item.label}
                onToggle={() => setOpenMenu((prev) => (prev === item.label ? null : item.label))}
                onClose={() => setOpenMenu(null)}
              />
            ) : (
              <Link key={item.href} href={item.href} className={`text-[13px] font-medium ${linkColorClass}`}>
                {item.label}
              </Link>
            )
          )}
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

      {/* モバイル: 展開メニュー(折りたたまず、見出し+インデントで階層を示す) */}
      {open && (
        <nav
          id="mobile-nav"
          className="flex flex-col border-t border-rn-border px-3.5 py-1 md:hidden"
          aria-label="モバイルナビゲーション"
        >
          {NAV_ITEMS.map((item) =>
            hasChildren(item) ? (
              <div key={item.label} className="border-t border-rn-border-soft first:border-t-0">
                <p className="mt-2.5 mb-0 text-[11px] font-bold uppercase tracking-[0.08em] text-rn-muted">
                  {item.label}
                </p>
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={`block py-2.5 pl-2.5 text-sm font-medium ${linkColorClass}`}
                    onClick={() => setOpen(false)}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`py-2.5 text-sm font-medium ${linkColorClass}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>
      )}
    </header>
  );
}
