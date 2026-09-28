import React from "react";
import { cn } from "@/lib/utils";

interface ProfileSectionProps {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

export function ProfileSection({
  title,
  icon,
  description,
  badge,
  children,
  className,
}: ProfileSectionProps) {
  return (
    <section className={cn("space-y-3", className)} aria-label={title}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
        </div>
        {badge && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 bg-secondary/80 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-muted-foreground px-1 -mt-1.5">{description}</p>
      )}

      <div className="rounded-3xl border bg-card/80 dark:bg-card/40 p-4 sm:p-5 shadow-xs space-y-4">
        {children}
      </div>
    </section>
  );
}
