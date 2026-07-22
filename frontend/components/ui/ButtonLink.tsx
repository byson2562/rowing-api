import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { buttonClass, type ButtonSize, type ButtonVariant } from "./button-classes";

// リンク型ボタン。内部遷移は next/link、外部URL/mailto等は素の <a> を描画する。
interface ButtonLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className"> {
  href: string;
  children: ReactNode;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

function isExternal(href: string): boolean {
  return /^(https?:|mailto:|tel:|\/\/)/.test(href);
}

export default function ButtonLink({
  children,
  className = "",
  href,
  size = "md",
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  const cls = `${buttonClass(variant, size)} ${className}`.trim();

  if (isExternal(href)) {
    return (
      <a href={href} className={cls} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={cls} {...props}>
      {children}
    </Link>
  );
}
