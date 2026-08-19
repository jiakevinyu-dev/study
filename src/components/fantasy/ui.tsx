import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-border bg-bg-elevated p-5 sm:p-6", className)}>{children}</div>;
}

const TONE_CLASSES = {
  neutral: "bg-bg-inset text-muted",
  accent: "bg-accent-soft text-accent",
  good: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warn: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  bad: "bg-red-500/10 text-red-700 dark:text-red-400",
} as const;

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof TONE_CLASSES;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="block font-mono text-[11px] uppercase tracking-wide text-muted">{children}</label>;
}

export const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/40";

export const buttonPrimaryClass =
  "inline-flex h-9 items-center justify-center rounded-full bg-fg px-4 text-sm font-medium text-bg transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40";

export const buttonSecondaryClass =
  "inline-flex h-9 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-fg transition-colors hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-40";
