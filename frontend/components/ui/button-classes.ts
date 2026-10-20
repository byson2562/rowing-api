// ボタン系の見た目の単一ソース。ButtonLink / Button から共通利用する。
// 日経ビジュアルデータ寄り(2026-10-20): 高さ40 / radius 4 / 影なし / 浮かせない。
// primary = 墨地に白文字(1画面に1つ)。secondary = 白地に1px墨枠。青は使わない(データの色)。
export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center rounded-rn-control font-medium no-underline " +
  "transition-[background-color,border-color,color] duration-150 motion-reduce:transition-none " +
  "hover:no-underline " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--primary)] " +
  "disabled:opacity-55 disabled:cursor-not-allowed";

const sizeClass: Record<ButtonSize, string> = {
  sm: "min-h-[34px] px-3.5 py-1.5 text-[13px] leading-[1.5]",
  md: "min-h-10 px-5 py-2 text-[15px] leading-[1.5]"
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "border border-rn-text bg-rn-text text-white hover:bg-rn-text-body hover:border-rn-text-body",
  secondary: "border border-rn-text bg-white text-rn-text hover:bg-rn-surface-soft"
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = ""
): string {
  return `${base} ${sizeClass[size]} ${variantClass[variant]} ${extra}`.trim();
}
