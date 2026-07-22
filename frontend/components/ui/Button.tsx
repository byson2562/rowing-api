import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { buttonClass, type ButtonSize, type ButtonVariant } from "./button-classes";

// button要素のボタン(submit等)。disabled時のスタイルは buttonClass に含まれる。
interface ButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "className"> {
  children: ReactNode;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export default function Button({
  children,
  className = "",
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={`${buttonClass(variant, size)} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
