import type { ReactNode } from "react";

// 空状態カード。lifecostのEmptyStateからfinance固有のアイコン依存を外した汎用版。
interface EmptyStateProps {
  action?: ReactNode;
  className?: string;
  description?: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
}

export default function EmptyState({
  action,
  className = "",
  description,
  icon,
  title
}: EmptyStateProps) {
  return (
    <section
      className={`rounded-[12px] border border-rn-border bg-rn-surface px-5 py-10 text-center shadow-[var(--shadow-soft)] ${className}`}
    >
      {icon ? <div className="mx-auto mb-4 flex justify-center">{icon}</div> : null}
      <h2 className="text-lg font-bold text-rn-text">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-rn-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center gap-2">{action}</div> : null}
    </section>
  );
}
