import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  accent?: "default" | "primary" | "success" | "warning" | "info";
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  subtext,
  accent = "default",
  className,
}: StatCardProps) {
  const accentClasses = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    info: "text-sky-600 dark:text-sky-400",
  };

  const iconBgClasses = {
    default: "bg-secondary text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  };

  return (
    <div
      className={cn(
        "flex flex-col justify-between p-4 rounded-2xl border bg-card/80 dark:bg-card/40 backdrop-blur-sm transition-all hover:bg-card hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", iconBgClasses[accent])}>
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <div className={cn("text-2xl font-bold tracking-tight", accentClasses[accent])}>
          {value}
        </div>
        {subtext && (
          <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{subtext}</p>
        )}
      </div>
    </div>
  );
}
