import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

// lifecostのButtonLinkパターンを、レガッタナビ既存の .lp-btn の見た目に合わせて移植。
// 色はrn-*トークン(= レガッタナビの:root変数)を使う。
type ButtonLinkVariant = "primary" | "secondary";
type ButtonLinkSize = "sm" | "md";

interface ButtonLinkProps
  extends Omit<ComponentPropsWithoutRef<typeof Link>, "className" | "children"> {
  children: ReactNode;
  className?: string;
  size?: ButtonLinkSize;
  variant?: ButtonLinkVariant;
}

const baseClass =
  "inline-flex items-center justify-center rounded-[10px] font-bold no-underline " +
  "transition-[transform,box-shadow,border-color] duration-200 " +
  "hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(14,56,113,0.2)] " +
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--primary)]";

const sizeClass: Record<ButtonLinkSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-3.5 py-2.5 text-base"
};

const variantClass: Record<ButtonLinkVariant, string> = {
  primary:
    "bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-dark)_100%)] text-white border border-rn-primary-dark",
  secondary: "bg-white text-[#3f60a0] border border-rn-border"
};

export default function ButtonLink({
  children,
  className = "",
  size = "md",
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={`${baseClass} ${sizeClass[size]} ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
