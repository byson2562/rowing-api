import type { ReactNode } from "react";
import Link from "next/link";

import type { ResultRecord } from "../../lib/results-data";

// 「優勝クルーと2位との差」の横棒図。種目ごとに 1行 = 種目名+優勝クルー / バー+秒。
// 表より先に図で見せる(docs/design-rules.md §6「図」)。サーバーで静的に描く。
// バーの列には秒の目盛りを付け、青(1秒未満)と灰青の意味は図の下の凡例で示す。

export type ChampionRow = {
  eventName: string;
  eventHref: string;
  winner: ResultRecord;
  gap: number | null;
  prev?: ResultRecord;
  defended: boolean;
};

// バーの物差し。上位15%の外れ値(招待種目などの大差)に引きずられないよう、
// 85パーセンタイルを1秒刻みで切り上げた値にする(最低3秒)。超える差はバーを切り詰め、数値で示す。
// 目盛りの間隔で割り切れるよう、物差しは目盛りの倍数に揃える
function scaleFor(rows: ChampionRow[]): { scale: number; step: number } {
  const gaps = rows.map((row) => row.gap).filter((gap): gap is number => gap != null).sort((a, b) => a - b);
  const idx = Math.min(gaps.length - 1, Math.max(0, Math.ceil(gaps.length * 0.85) - 1));
  const raw = gaps.length === 0 ? 3 : Math.max(3, Math.ceil(gaps[idx]));
  const step = raw <= 5 ? 1 : raw <= 10 ? 2 : 5;
  return { scale: Math.ceil(raw / step) * step, step };
}

// 行と見出しで同じ列幅を使う(md 以上は 種目 / バー+秒、スマホは種目の下にバー+秒)
const rowGrid = "grid gap-x-3.5 gap-y-1.5 md:grid-cols-[250px_minmax(0,1fr)] md:items-center";
const barGrid = "grid grid-cols-[minmax(0,1fr)_64px] items-center gap-x-3.5";

export function GapBars({
  rows,
  showPrev,
  renderCrew
}: {
  rows: ChampionRow[];
  showPrev: boolean;
  renderCrew: (row: ResultRecord) => ReactNode;
}) {
  const { scale, step } = scaleFor(rows);
  const ticks = Array.from({ length: scale / step + 1 }, (_, i) => i * step);
  const closeCount = rows.filter((row) => row.gap != null && row.gap < 1).length;
  const clipped = rows.some((row) => row.gap != null && row.gap > scale);

  return (
    <div className="flex flex-col gap-3.5">
      <div className={rowGrid}>
        <span className="hidden text-[12px] leading-[1.4] font-medium text-rn-meta md:block">種目・優勝クルー</span>
        <div className={barGrid}>
          <span className="relative block h-[14px] text-[11px] leading-[14px] text-rn-meta [font-variant-numeric:tabular-nums]" aria-hidden="true">
            {ticks.map((tick, i) => (
              <span
                key={tick}
                className={`absolute top-0 whitespace-nowrap ${i === 0 ? "" : i === ticks.length - 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
                style={{ left: `${(tick / scale) * 100}%` }}
              >
                {i === ticks.length - 1 ? `${tick}秒` : tick}
              </span>
            ))}
          </span>
          <span className="text-right text-[12px] leading-[1.4] font-medium text-rn-meta">2位との差</span>
        </div>
      </div>
      {rows.map((row) => {
        const close = row.gap != null && row.gap < 1;
        const width = row.gap != null ? Math.min(100, Math.max(0.6, (row.gap / scale) * 100)) : 0;
        return (
          <div key={row.eventName} className={rowGrid}>
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
            <div className={barGrid}>
              <span className="relative block h-3.5 bg-rn-surface-soft" aria-hidden="true">
                {ticks.slice(1, -1).map((tick) => (
                  <span key={tick} className="absolute inset-y-0 w-px bg-white" style={{ left: `${(tick / scale) * 100}%` }} />
                ))}
                {row.gap != null ? (
                  <span
                    className={`relative block h-full ${close ? "bg-rn-primary" : "bg-rn-primary-soft"}`}
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
          </div>
        );
      })}
      <div className="mt-1 flex flex-col gap-1.5">
        <p className="m-0 flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] leading-[1.4] text-rn-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 bg-rn-primary" aria-hidden="true" />
            1秒未満の決着{closeCount > 0 ? `(${closeCount}種目)` : ""}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 bg-rn-primary-soft" aria-hidden="true" />
            1秒以上
          </span>
        </p>
        <p className="m-0 text-[12px] leading-[1.8] text-rn-meta">
          バーが長いほど2位を大きく引き離した優勝。
          {clipped ? `目盛りは${scale}秒までで、超える差はバーを切り詰めた。` : ""}
          2位の計時が無い種目は「—」。
        </p>
      </div>
    </div>
  );
}
