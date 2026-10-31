"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { sx } from "./search/search-classes";

export type OrganizationEntry = {
  name: string;
  slug: string;
  count: number;
  gold: number;
};

export type OrganizationGroup = {
  id: string;
  title: string;
  items: OrganizationEntry[];
};

type SortKey = "name" | "gold" | "count";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name", label: "名前順" },
  { key: "gold", label: "優勝回数順" },
  { key: "count", label: "記録数順" }
];

// デザインルール準拠の検索入力(高さ40px / radius 4px / focus-visibleリング)
const searchInputClass =
  "h-10 w-full max-w-[360px] rounded-rn-control border border-rn-border bg-white px-[11px] py-2 text-[14px] " +
  "text-rn-text focus-visible:border-rn-primary focus-visible:outline-2 focus-visible:outline-rn-primary";

// 団体の一覧は新聞の段組み(上から下へ流してから次の段へ)。PC 3段・タブレット 2段・スマホ 1段。
// 箱にせず、行は下罫線で区切る(docs/design-rules.md §3・§6「一覧」)
const listClass = "m-0 list-none columns-1 gap-x-8 p-0 md:columns-2 lg:columns-3";
const itemClass = "flex break-inside-avoid items-baseline justify-between gap-3 border-b border-rn-border py-2";
const nameClass = "min-w-0 text-[15px] font-medium leading-[1.5] text-rn-text no-underline hover:underline";
const countClass = "shrink-0 text-[13px] leading-[1.5] text-rn-meta [font-variant-numeric:tabular-nums]";
const jumpNavClass = "mb-0 mt-3 flex flex-wrap gap-x-4 gap-y-1 p-0 text-[14px] leading-[1.6]";
const jumpLinkClass = "text-rn-text no-underline hover:underline";

// ひらがな→カタカナ・全半角のゆらぎを吸収して部分一致させる
function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ぁ-ん]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
}

// 名前順は受け取った順(サーバー側で並べ済み)。同数は名前順のまま残す
function sortItems(items: OrganizationEntry[], key: SortKey): OrganizationEntry[] {
  if (key === "name") return items;
  const order = new Map(items.map((item, index) => [item.name, index]));
  return [...items].sort((a, b) => {
    const primary = key === "gold" ? b.gold - a.gold || b.count - a.count : b.count - a.count || b.gold - a.gold;
    return primary || order.get(a.name)! - order.get(b.name)!;
  });
}

export function OrganizationsIndex({ groups }: { groups: OrganizationGroup[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return groups
      .map((group) => ({
        ...group,
        items: sortItems(q ? group.items.filter((item) => normalize(item.name).includes(q)) : group.items, sort)
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query, sort]);

  const totalMatches = visible.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <>
      <div className="mb-1 mt-4">
        <label htmlFor="organization-filter" className="mb-1.5 block text-[12px] font-medium text-rn-meta">
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
          className="mb-0 mt-1.5 text-[12px] text-rn-meta"
        >
          {query.trim() ? `${totalMatches}団体が一致` : ""}
        </p>
      </div>

      <div className={`${sx.genderTabs} mt-3`} role="group" aria-label="並び順">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            className={sort === option.key ? sx.genderTabActive : sx.genderTabIdle}
            onClick={() => setSort(option.key)}
            aria-pressed={sort === option.key}
          >
            {option.label}
          </button>
        ))}
      </div>

      {visible.length > 1 ? (
        <nav aria-label="区分へ移動">
          <ul className={`${jumpNavClass} list-none`}>
            {visible.map((group) => (
              <li key={group.id}>
                <a className={jumpLinkClass} href={`#${group.id}`}>
                  {group.title}
                  <span className="static-count">{group.items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {visible.length === 0 ? (
        <section className="static-section">
          <p className="m-0 text-[14px] leading-[1.7] text-rn-muted">
            「{query}」に一致する団体はありません。表記を変えて試すか、
            <Link href="/search">記録検索ページ</Link>でフリーワード検索をご利用ください。
          </p>
        </section>
      ) : (
        visible.map((group) => (
          <section className="static-section" key={group.id} id={group.id}>
            <h2>
              {group.title}
              <span className="static-count">{group.items.length}団体</span>
            </h2>
            <ul className={listClass}>
              {group.items.map((item) => (
                <li key={item.name} className={itemClass}>
                  <Link className={nameClass} href={`/organizations/${encodeURIComponent(item.slug)}`}>
                    {item.name}
                  </Link>
                  <span className={countClass}>
                    {item.count.toLocaleString()}件{item.gold ? ` ・ 優勝${item.gold}` : ""}
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
