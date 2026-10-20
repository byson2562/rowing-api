// ホームの記事カードに添える小さな図。本文の上に図を置く日経ビジュアルデータの流儀
// (docs/design-rules.md §6「図」)。色は rn-primary / rn-primary-soft / rn-surface-soft の3つだけ。

export type MiniBarRow = { label: string; value: number; display: string; hot?: boolean };

/** 横棒の一覧。ラベル / 灰のトラック / 右端に値 */
export function MiniBars({
  rows,
  scale,
  caption,
  summary,
  labelWidth = 96,
  barHeight = 9
}: {
  rows: MiniBarRow[];
  scale: number;
  caption: string;
  summary: string;
  labelWidth?: number;
  barHeight?: number;
}) {
  return (
    <figure className="m-0 flex flex-col gap-[5px] pt-4 pb-1" role="img" aria-label={summary}>
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid items-center gap-2 text-[11px] leading-[1.4] text-rn-muted"
          style={{ gridTemplateColumns: `${labelWidth}px minmax(0,1fr) 40px` }}
        >
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{row.label}</span>
          <span className="block bg-rn-surface-soft" style={{ height: barHeight }}>
            <span
              className={`block h-full ${row.hot ? "bg-rn-primary" : "bg-rn-primary-soft"}`}
              style={{ width: `${Math.min(100, Math.max(0.6, (row.value / scale) * 100)).toFixed(1)}%` }}
            />
          </span>
          <span className="text-right text-rn-text [font-variant-numeric:tabular-nums]">{row.display}</span>
        </div>
      ))}
      <figcaption className="mt-1.5 text-[11px] leading-[1.6] text-rn-meta">{caption}</figcaption>
    </figure>
  );
}

export type YearCell = { year: number; label: string; tone: "primary" | "ink" | "soft" };

const toneClass: Record<YearCell["tone"], string> = {
  primary: "bg-rn-primary",
  ink: "bg-rn-text",
  soft: "bg-rn-primary-soft"
};

/** 年ごとのセル(優勝団体を色で塗り分ける)。下に年の範囲と凡例 */
export function YearCells({
  cells,
  legend,
  summary
}: {
  cells: YearCell[];
  legend: { tone: YearCell["tone"]; label: string }[];
  summary: string;
}) {
  if (cells.length === 0) return null;
  return (
    <figure className="m-0 pt-4 pb-1" role="img" aria-label={summary}>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0,1fr))` }}>
        {cells.map((cell) => (
          <span key={cell.year} title={cell.label} className={`block aspect-[1/1.6] max-w-full ${toneClass[cell.tone]}`} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] leading-none text-rn-meta [font-variant-numeric:tabular-nums]">
        <span>{cells[0].year}</span>
        <span>{cells[cells.length - 1].year}</span>
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] leading-[1.4] text-rn-muted">
        {legend.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 ${toneClass[item.tone]}`} aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
