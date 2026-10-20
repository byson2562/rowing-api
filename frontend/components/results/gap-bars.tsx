import type { ReactNode } from "react";
import Link from "next/link";

import type { ResultRecord } from "../../lib/results-data";

// 「優勝クルーと2位との差」の横棒図。種目ごとに 1行 = 種目名+優勝クルー / バー / 秒。
// 表より先に図で見せる(docs/design-rules.md §6「図」)。サーバーで静的に描く。

export type ChampionRow = {
  eventName: string;
  eventHref: string;
  winner: ResultRecord;
  gap: number | null;
  prev?: ResultRecord;
  defended: boolean;
};

// バーの物差し。上位15%の外れ値(招待種目などの大差)に引きずられないよう、
// 85パーセンタイルを1秒刻みで切り上げた値にする(最低3秒)。超える差はバーを切り詰め、数値で示す
function scaleFor(rows: ChampionRow[]): number {
  const gaps = rows.map((row) => row.gap).filter((gap): gap is number => gap != null).sort((a, b) => a - b);
  if (gaps.length === 0) return 3;
  const idx = Math.min(gaps.length - 1, Math.max(0, Math.ceil(gaps.length * 0.85) - 1));
  return Math.max(3, Math.ceil(gaps[idx]));
}

export function GapBars({
  rows,
  showPrev,
  renderCrew
}: {
  rows: ChampionRow[];
  showPrev: boolean;
  renderCrew: (row: ResultRecord) => ReactNode;
}) {
  const scale = scaleFor(rows);
  const closeCount = rows.filter((row) => row.gap != null && row.gap < 1).length;
  const clipped = rows.some((row) => row.gap != null && row.gap > scale);

  return (
    <div className="flex flex-col gap-3.5">
      {rows.map((row) => {
        const close = row.gap != null && row.gap < 1;
        const width = row.gap != null ? Math.min(100, Math.max(0.6, (row.gap / scale) * 100)) : 0;
        return (
          <div
            key={row.eventName}
            className="grid grid-cols-[minmax(0,1fr)_64px] items-center gap-x-3.5 gap-y-1.5 md:grid-cols-[250px_minmax(0,1fr)_64px]"
          >
            <div className="flex min-w-0 flex-col leading-[1.4]">
              <Link href={row.eventHref} className="text-[14px] font-medium text-rn-text no-underline hover:underline">
                {row.eventName}
              </Link>
              <span className="text-[12px] leading-[1.6] text-rn-meta">
                {renderCrew(row.winner)}
                <span className="[font-variant-numeric:tabular-nums]"> · {row.winner.time_display}</span>
              </span>
              {showPrev ? (
                <span className="text-[12px] leading-[1.6] text-rn-meta">
                  前年 {row.prev ? row.prev.organization : "—"}
                  {row.defended ? <span className="ml-1.5 font-medium text-rn-text">連覇</span> : null}
                </span>
              ) : null}
            </div>
            <span
              className="order-last col-span-2 block h-3.5 bg-rn-surface-soft md:order-none md:col-span-1"
              aria-hidden="true"
            >
              {row.gap != null ? (
                <span
                  className={`block h-full ${close ? "bg-rn-primary" : "bg-rn-primary-soft"}`}
                  style={{ width: `${width.toFixed(1)}%` }}
                />
              ) : null}
            </span>
            <span
              className={`text-right text-[14px] leading-[1.4] [font-variant-numeric:tabular-nums] ${close ? "font-bold text-rn-text" : "text-rn-text"}`}
            >
              {row.gap != null ? row.gap.toFixed(2) : "—"}
            </span>
          </div>
        );
      })}
      <p className="m-0 mt-1 text-[12px] leading-[1.8] text-rn-meta">
        単位は秒。
        {closeCount > 0 ? `1秒未満の決着は${closeCount}種目。` : ""}
        {clipped ? `バーの物差しは${scale}秒までで、超える差は切り詰めた。` : ""}
        2位の計時が無い種目は「—」。
      </p>
    </div>
  );
}
