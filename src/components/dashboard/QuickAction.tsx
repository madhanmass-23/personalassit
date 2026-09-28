import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  ariaLabel?: string;
  className?: string;
}

export function QuickAction({
  icon,
  label,
  href,
  ariaLabel,
  className,
}: QuickActionProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel || label}
      className={cn(
        "group flex flex-col items-center justify-center gap-2 p-3 min-h-[76px] rounded-2xl border bg-card/60 dark:bg-card/30 hover:bg-card hover:border-primary/30 active:scale-[0.98] transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-xs">
        {icon}
      </div>
      <span className="text-xs font-medium text-foreground tracking-tight line-clamp-1">
        {label}
      </span>
    </Link>
  );
}
