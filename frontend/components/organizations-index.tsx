"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type OrganizationEntry = {
  name: string;
  slug: string;
  count: number;
  gold: number;
};

export type OrganizationGroup = {
  title: string;
  items: OrganizationEntry[];
};

// デザインルール準拠の検索入力(高さ40px / radius 10px / focus-visibleリング)
const searchInputClass =
  "h-10 w-full max-w-[360px] rounded-[10px] border border-rn-border bg-white px-[11px] py-2 text-[14px] " +
  "text-[#1d3557] focus-visible:border-rn-primary focus-visible:outline-2 " +
  "focus-visible:outline-[rgba(29,110,224,0.25)]";

// ひらがな→カタカナ・全半角のゆらぎを吸収して部分一致させる
function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ぁ-ん]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
}

export function OrganizationsIndex({ groups }: { groups: OrganizationGroup[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => normalize(item.name).includes(q))
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  const totalMatches = filtered.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <>
      <div className="mb-1 mt-4">
        <label htmlFor="organization-filter" className="mb-1.5 block text-[12px] font-medium text-rn-muted">
          団体名で絞り込む
        </label>
        <input
          id="organization-filter"
          type="search"
          className={searchInputClass}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="例: 早稲田、仙台、トヨタ"
          aria-describedby="organization-filter-status"
        />
        <p
          id="organization-filter-status"
          role="status"
          aria-live="polite"
          className="mb-0 mt-1.5 text-[12px] text-rn-muted"
        >
          {query.trim() ? `${totalMatches}団体が一致` : ""}
        </p>
      </div>

      {filtered.length === 0 ? (
        <section className="static-section">
          <p className="m-0 text-[14px] leading-[1.7] text-rn-muted">
            「{query}」に一致する団体はありません。表記を変えて試すか、
            <Link href="/search">記録検索ページ</Link>でフリーワード検索をご利用ください。
          </p>
        </section>
      ) : (
        filtered.map((group) => (
          <section className="static-section" key={group.title}>
            <h2>
              {group.title}
              <span className="static-count">{group.items.length}団体</span>
            </h2>
            <ul className="static-links org-links">
              {group.items.map((item) => (
                <li key={item.name}>
                  <Link href={`/organizations/${encodeURIComponent(item.slug)}`}>{item.name}</Link>
                  <span className="static-count">
                    {item.count.toLocaleString()}件
                    {item.gold ? ` ・ 優勝${item.gold}回` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
