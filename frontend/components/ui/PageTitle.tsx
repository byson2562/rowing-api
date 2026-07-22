import type { ReactNode } from "react";

// 見出し。variantでサイズを切り替える。色はrn-textトークン。
type PageTitleVariant = "page" | "hero";

interface PageTitleProps {
  as?: "h1" | "h2";
  children: ReactNode;
  className?: string;
  variant?: PageTitleVariant;
}

const variantClass: Record<PageTitleVariant, string> = {
  page: "text-xl sm:text-[1.375rem]",
  hero: "text-2xl sm:text-3xl"
};

export default function PageTitle({
  as: Tag = "h1",
  children,
  className = "",
  variant = "page"
}: PageTitleProps) {
  return (
    <Tag className={`font-bold leading-tight text-rn-text ${variantClass[variant]} ${className}`}>
      {children}
    </Tag>
  );
}
