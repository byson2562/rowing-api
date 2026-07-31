// ローイング用語集の図解。写真素材を持たないため、デザイントークンに沿った
// インラインSVGで描く(拡大しても劣化せず、ラベルはテキストとして選択できる)。
//
// 色は既存の記事チャートの2色(#2f66b8 / #5b93e3)を踏襲する。新色は足さない。
const STROKE_SIDE = "#2f66b8"; // ストロークサイドのオール(濃)
const BOW_SIDE = "#5b93e3"; // バウサイドのオール(淡)
const HULL_LINE = "#245a97"; // 艇の輪郭(public/icons と同じ線色)
const HULL_FILL = "#f8fbff"; // 艇の地(--surface-soft)
const SEAT = "#dbe7fa"; // 漕手・座席(--border)
const LABEL = "#33507a"; // 図中ラベル
const MUTED = "#5d7398"; // 補足ラベル(--muted)

/** 横向きの艇(バウが左)。図1で使う */
function HullSide() {
  return (
    <path
      d="M 16 100 L 58 86 L 286 86 A 12 12 0 0 1 286 114 L 58 114 Z"
      fill={HULL_FILL}
      stroke={HULL_LINE}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  );
}

/** 横向きの艇から上下に出るオール1本 */
function OarV({ x, dir, color }: { x: number; dir: -1 | 1; color: string }) {
  const from = dir === -1 ? 86 : 114;
  const to = from + dir * 40;
  return (
    <g>
      <line x1={x} y1={from} x2={x} y2={to} stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx={x} cy={to + dir * 9} rx="7.5" ry="11" fill={color} />
    </g>
  );
}

function Rower({ cx, cy = 100 }: { cx: number; cy?: number }) {
  return <circle cx={cx} cy={cy} r="10" fill={SEAT} stroke={HULL_LINE} strokeWidth="1.6" />;
}

/** 図1-A: スイープ(1人1本) */
export function SweepFigure() {
  return (
    <figure className="m-0 w-full max-w-[340px]">
      <svg viewBox="0 0 320 205" className="block h-auto w-full" role="img" aria-labelledby="fig-sweep-title">
        <title id="fig-sweep-title">
          スイープの図。1人がオールを1本だけ持ち、漕手ごとに左右交互にオールが出ている。
        </title>
        <HullSide />
        <Rower cx={112} />
        <Rower cx={212} />
        <OarV x={112} dir={-1} color={BOW_SIDE} />
        <OarV x={212} dir={1} color={STROKE_SIDE} />
        <text x="160" y="192" textAnchor="middle" fontSize="15" fontWeight="700" fill={LABEL}>
          スイープ(1人1本)
        </text>
      </svg>
    </figure>
  );
}

/** 図1-B: スカル(1人2本) */
export function ScullFigure() {
  return (
    <figure className="m-0 w-full max-w-[340px]">
      <svg viewBox="0 0 320 205" className="block h-auto w-full" role="img" aria-labelledby="fig-scull-title">
        <title id="fig-scull-title">
          スカルの図。1人がオールを2本持ち、左右両方にオールが出ている。
        </title>
        <HullSide />
        <Rower cx={112} />
        <Rower cx={212} />
        <OarV x={112} dir={-1} color={BOW_SIDE} />
        <OarV x={112} dir={1} color={STROKE_SIDE} />
        <OarV x={212} dir={-1} color={BOW_SIDE} />
        <OarV x={212} dir={1} color={STROKE_SIDE} />
        <text x="160" y="192" textAnchor="middle" fontSize="15" fontWeight="700" fill={LABEL}>
          スカル(1人2本)
        </text>
      </svg>
    </figure>
  );
}

// ---- 図2: 舵手つきフォアの座席配置とサイド ----
// 進行方向を上に取る(上を向いたときの左右がそのまま左舷・右舷になる)。
const SEATS = [
  { y: 168, label: "バウ(1番)", side: "bow" as const },
  { y: 246, label: "2番", side: "stroke" as const },
  { y: 324, label: "3番", side: "bow" as const },
  { y: 402, label: "整調(4番)", side: "stroke" as const }
];

/** 縦向きの艇から左右に出るオール1本 */
function OarH({ y, side }: { y: number; side: "stroke" | "bow" }) {
  const toStroke = side === "stroke";
  const from = toStroke ? 146 : 174;
  const to = toStroke ? 78 : 242;
  const color = toStroke ? STROKE_SIDE : BOW_SIDE;
  return (
    <g>
      <line x1={from} y1={y} x2={to} y2={y} stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx={toStroke ? to - 9 : to + 9} cy={y} rx="11" ry="7.5" fill={color} />
    </g>
  );
}

export function CrewLayoutFigure() {
  return (
    <svg viewBox="0 0 320 530" className="mx-auto block h-auto w-full max-w-[340px]" role="img" aria-labelledby="fig-crew-title">
      <title id="fig-crew-title">
        舵手つきフォアを真上から見た図。進行方向は上。艇の先頭から順にバウ(1番)、2番、3番、整調(4番)が並び、
        オールは左右交互に出ている。進行方向に向かって左舷がストロークサイド、右舷がバウサイド。艫には舵手が座る。
      </title>

      {/* 左右の舷ラベル */}
      <text x="60" y="26" textAnchor="middle" fontSize="13" fontWeight="700" fill={STROKE_SIDE}>
        ストロークサイド
      </text>
      <text x="60" y="43" textAnchor="middle" fontSize="12" fill={MUTED}>
        (左舷)
      </text>
      <text x="260" y="26" textAnchor="middle" fontSize="13" fontWeight="700" fill={BOW_SIDE}>
        バウサイド
      </text>
      <text x="260" y="43" textAnchor="middle" fontSize="12" fill={MUTED}>
        (右舷)
      </text>

      {/* 進行方向(艇の左脇。上部の舷ラベルと重ならない位置に置く) */}
      <line x1="96" y1="132" x2="96" y2="82" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 90 91 L 96 81 L 102 91" fill="none" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <text x="96" y="150" textAnchor="middle" fontSize="12" fill={MUTED}>
        進行方向
      </text>

      {/* 艇体(上が尖ったバウ、下が艫) */}
      <path
        d="M 160 66 L 174 116 L 174 462 A 14 14 0 0 1 146 462 L 146 116 Z"
        fill={HULL_FILL}
        stroke={HULL_LINE}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* 漕手とオール(オールと反対側にラベルを置く) */}
      {SEATS.map((seat) => {
        const labelOnLeft = seat.side === "bow"; // オールが右なら、ラベルは左
        return (
          <g key={seat.label}>
            <OarH y={seat.y} side={seat.side} />
            <Rower cx={160} cy={seat.y} />
            <text
              x={labelOnLeft ? 132 : 188}
              y={seat.y + 5}
              textAnchor={labelOnLeft ? "end" : "start"}
              fontSize="13"
              fontWeight="700"
              fill={LABEL}
            >
              {seat.label}
            </text>
          </g>
        );
      })}

      {/* 舵手(艫) */}
      <circle cx="160" cy="446" r="9" fill="#ffffff" stroke={HULL_LINE} strokeWidth="1.6" />
      <text x="188" y="451" fontSize="13" fontWeight="700" fill={LABEL}>
        舵手
      </text>

      {/* 艇の前後(艇そのものに直接ラベルする) */}
      <text x="232" y="100" textAnchor="middle" fontSize="12" fill={MUTED}>
        舳先(へさき)
      </text>
      <text x="160" y="502" textAnchor="middle" fontSize="12" fill={MUTED}>
        艫(とも)
      </text>
    </svg>
  );
}

// ---- 図3: 艇まわりの各部 ----
export function BoatPartsFigure() {
  const callout = (x: number, y: number, text: string, anchor: "start" | "end" | "middle") => (
    <text x={x} y={y} textAnchor={anchor} fontSize="13" fontWeight="700" fill={LABEL}>
      {text}
    </text>
  );

  return (
    <svg viewBox="0 0 340 316" className="mx-auto block h-auto w-full max-w-[360px]" role="img" aria-labelledby="fig-parts-title">
      <title id="fig-parts-title">
        漕手1人分の座席まわりを真上から見た図。艇から横に張り出したリガーの先にオールが固定され、
        レールの上をシートが前後に滑る。足元にストレッチャー、オールの先端にブレードがある。
      </title>

      {/* 艇体の一部(縦) */}
      <path d="M 130 20 L 190 20 L 190 300 L 130 300 Z" fill={HULL_FILL} stroke={HULL_LINE} strokeWidth="2" />

      {/* レール(シートが滑る2本) */}
      <line x1="146" y1="96" x2="146" y2="212" stroke={HULL_LINE} strokeWidth="1.6" strokeDasharray="5 4" />
      <line x1="174" y1="96" x2="174" y2="212" stroke={HULL_LINE} strokeWidth="1.6" strokeDasharray="5 4" />

      {/* ストレッチャー(足を固定する台) */}
      <rect x="138" y="228" width="44" height="16" rx="4" fill={SEAT} stroke={HULL_LINE} strokeWidth="1.6" />

      {/* シート(座席) */}
      <rect x="142" y="140" width="36" height="24" rx="7" fill={SEAT} stroke={HULL_LINE} strokeWidth="1.8" />

      {/* リガー(艇から張り出す枠) */}
      <path d="M 190 128 L 246 152 L 190 176" fill="none" stroke={HULL_LINE} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />

      {/* オール(シャフト+ブレード) */}
      <line x1="212" y1="152" x2="318" y2="152" stroke={STROKE_SIDE} strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="322" cy="152" rx="12" ry="8" fill={STROKE_SIDE} />
      {/* オールを固定する支点 */}
      <circle cx="246" cy="152" r="5" fill="#ffffff" stroke={HULL_LINE} strokeWidth="1.8" />

      {/* 引き出し線とラベル */}
      <line x1="140" y1="152" x2="104" y2="152" stroke={MUTED} strokeWidth="1.2" />
      {callout(98, 157, "シート", "end")}

      <line x1="146" y1="196" x2="104" y2="204" stroke={MUTED} strokeWidth="1.2" />
      {callout(98, 209, "レール", "end")}

      <line x1="138" y1="236" x2="104" y2="252" stroke={MUTED} strokeWidth="1.2" />
      {callout(98, 257, "ストレッチャー", "end")}

      <line x1="222" y1="145" x2="238" y2="96" stroke={MUTED} strokeWidth="1.2" />
      {callout(238, 90, "リガー", "middle")}

      <line x1="318" y1="164" x2="308" y2="212" stroke={MUTED} strokeWidth="1.2" />
      {callout(306, 228, "ブレード", "middle")}

    </svg>
  );
}
