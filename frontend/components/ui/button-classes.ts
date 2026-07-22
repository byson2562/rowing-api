// ボタン系の見た目の単一ソース(旧 .lp-btn / .lp-btn-primary / .lp-btn-secondary 相当)。
// ButtonLink / Button から共通利用する。色は rn-* トークン。
export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center rounded-[10px] font-bold no-underline " +
  "transition-[transform,box-shadow,border-color] duration-200 motion-reduce:transition-none " +
  "hover:-translate-y-px hover:shadow-[0_6px_14px_rgba(14,56,113,0.16)] motion-reduce:hover:translate-y-0 " +
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--primary)] " +
  "disabled:opacity-65 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none";

const sizeClass: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-3.5 py-2.5 text-base"
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-rn-primary text-white border border-rn-primary",
  secondary: "bg-white text-[#3f60a0] border border-rn-border"
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = ""
): string {
  return `${base} ${sizeClass[size]} ${variantClass[variant]} ${extra}`.trim();
}
