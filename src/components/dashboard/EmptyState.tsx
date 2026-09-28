import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 dark:bg-card/20",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-3">
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-foreground tracking-tight">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>
      {actionLabel && (
        <div className="mt-4">
          {actionHref ? (
            <Button asChild size="sm" variant="outline" className="rounded-xl h-9 text-xs font-medium">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onAction} className="rounded-xl h-9 text-xs font-medium">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
