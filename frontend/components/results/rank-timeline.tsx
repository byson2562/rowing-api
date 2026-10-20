import type { ResultRecord } from "../../lib/results-data";
import { rankBadgeClass } from "./results-classes";

// Final A の順位の推移を、6行(順位)×レース数の CSS グリッドに円バッジで置く図。
// 日経ビジュアルデータの「本文の上に置く小さな図」の流儀(docs/design-rules.md §6「図」)。
// Recharts は使わず、サーバーで静的に描く。

const ROW_H = 32;
const MIN_COL_W = 42;

// 大会名を軸ラベル用の短い呼び名にする
export function competitionShortLabel(name: string): string {
  if (name.includes("大学")) return "インカレ";
  if (name.includes("新人")) return "新人";
  if (name.includes("社会人")) return "社会人";
  if (name.includes("マスターズ")) return "マスターズ";
  return "全日本";
}

export function RankTimeline({ races, label }: { races: ResultRecord[]; label: string }) {
  if (races.length < 2) return null;

  const ordered = [...races].sort((a, b) => a.year - b.year || a.id - b.id);
  const maxRank = Math.max(6, ...ordered.map((race) => race.rank));
  const rowsStyle = { gridTemplateRows: `repeat(${maxRank}, ${ROW_H}px)` };
  const colsStyle = {
    gridTemplateColumns: `32px repeat(${ordered.length}, minmax(${MIN_COL_W}px, 1fr))`
  };
  const summary = ordered.map((race) => `${race.year}年${competitionShortLabel(race.competition_name)} ${race.rank}位`).join("、");

  return (
    <div className="overflow-x-auto" role="img" aria-label={`${label}。${summary}`}>
      <div className="min-w-0">
        <div className="grid" style={colsStyle}>
          <div className="grid text-[11px] leading-none text-rn-meta [font-variant-numeric:tabular-nums]" style={rowsStyle} aria-hidden="true">
            {Array.from({ length: maxRank }, (_, i) => (
              <span key={i} className="flex items-center">
                {i + 1}位
              </span>
            ))}
          </div>
          {ordered.map((race) => (
            <div key={race.id} className="grid border-l border-rn-border-soft" style={rowsStyle} aria-hidden="true">
              <span className={`${rankBadgeClass(race.rank)} justify-self-center self-center`} style={{ gridRow: race.rank }}>
                {race.rank}
              </span>
            </div>
          ))}
        </div>
        <div
          className="mt-2 grid text-center text-[11px] leading-[1.4] text-rn-meta [font-variant-numeric:tabular-nums]"
          style={colsStyle}
          aria-hidden="true"
        >
          <span />
          {ordered.map((race) => (
            <span key={race.id}>
              {race.year}
              <br />
              {competitionShortLabel(race.competition_name)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
