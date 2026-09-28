"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type TaskFilterType = "Today" | "Upcoming" | "Completed" | "All";

interface TaskFilterTabsProps {
  currentFilter: TaskFilterType;
  onSelectFilter: (filter: TaskFilterType) => void;
  counts: {
    today: number;
    upcoming: number;
    completed: number;
    all: number;
  };
}

const TABS: { id: TaskFilterType; label: string }[] = [
  { id: "Today", label: "Today" },
  { id: "Upcoming", label: "Upcoming" },
  { id: "Completed", label: "Completed" },
  { id: "All", label: "All" },
];

export function TaskFilterTabs({
  currentFilter,
  onSelectFilter,
  counts,
}: TaskFilterTabsProps) {
  const getCount = (id: TaskFilterType) => {
    switch (id) {
      case "Today":
        return counts.today;
      case "Upcoming":
        return counts.upcoming;
      case "Completed":
        return counts.completed;
      case "All":
        return counts.all;
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Filter tasks"
      className="flex items-center gap-1.5 p-1 bg-secondary/60 dark:bg-secondary/40 rounded-xl overflow-x-auto snap-x hide-scrollbar border border-border/50 max-w-full"
    >
      {TABS.map((tab) => {
        const isActive = currentFilter === tab.id;
        const count = getCount(tab.id);

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id.toLowerCase()}`}
            onClick={() => onSelectFilter(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all snap-start whitespace-nowrap min-h-[40px] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0",
              isActive
                ? "text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="task-filter-pill"
                className="absolute inset-0 bg-primary rounded-lg -z-0"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
            <span
              className={cn(
                "relative z-10 text-[11px] px-1.5 py-0.2 rounded-full font-semibold transition-colors",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
