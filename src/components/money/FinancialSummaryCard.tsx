"use client";

import { motion } from "framer-motion";
import { TrendingUp, ArrowDownRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type SummaryPeriod = "today" | "week" | "month" | "all";

interface FinancialSummaryCardProps {
  period: SummaryPeriod;
  onPeriodChange: (period: SummaryPeriod) => void;
  earned: number;
  spent: number;
  kept: number;
}

export function FinancialSummaryCard({
  period,
  onPeriodChange,
  earned,
  spent,
  kept,
}: FinancialSummaryCardProps) {
  const formatAmount = (val: number) => {
    return `₹${Math.round(val).toLocaleString("en-IN")}`;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-secondary/30 p-5 sm:p-6 shadow-sm">
      {/* Background Decorative Icon */}
      <div className="absolute -right-4 -bottom-4 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
        <TrendingUp className="w-48 h-48 text-foreground" />
      </div>

      <div className="flex flex-col gap-5 relative z-10">
        {/* Card Header with Period Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Financial Summary
            </h2>
          </div>

          {/* Period Selector Tabs */}
          <div className="flex items-center gap-1 p-1 bg-secondary/80 rounded-xl border border-border/40 self-start sm:self-auto text-xs">
            {(
              [
                { id: "today", label: "Today" },
                { id: "week", label: "This Week" },
                { id: "month", label: "This Month" },
                { id: "all", label: "All Time" },
              ] as { id: SummaryPeriod; label: string }[]
            ).map((tab) => {
              const isActive = period === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onPeriodChange(tab.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-medium transition-all min-h-[30px] cursor-pointer",
                    isActive
                      ? "bg-background text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 Metric Grid: Earned, Spent, Kept */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Earned */}
          <motion.div
            key={`earned-${period}-${earned}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center sm:flex-col sm:items-start justify-between sm:justify-start p-3.5 sm:p-4 rounded-2xl bg-secondary/40 border border-border/40"
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="p-1 rounded-md bg-emerald-500/10">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
              <span>Earned</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {formatAmount(earned)}
            </p>
          </motion.div>

          {/* Spent */}
          <motion.div
            key={`spent-${period}-${spent}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center sm:flex-col sm:items-start justify-between sm:justify-start p-3.5 sm:p-4 rounded-2xl bg-secondary/40 border border-border/40"
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 mb-1">
              <span className="p-1 rounded-md bg-rose-500/10">
                <ArrowDownRight className="w-3.5 h-3.5" />
              </span>
              <span>Spent</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {formatAmount(spent)}
            </p>
          </motion.div>

          {/* Kept */}
          <motion.div
            key={`kept-${period}-${kept}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-center sm:flex-col sm:items-start justify-between sm:justify-start p-3.5 sm:p-4 rounded-2xl border",
              kept >= 0
                ? "bg-primary/5 border-primary/20 text-primary"
                : "bg-destructive/5 border-destructive/20 text-destructive"
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium mb-1">
              <span className="p-1 rounded-md bg-primary/10 text-primary">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              <span className="text-foreground/80">Kept (Net)</span>
            </div>
            <p
              className={cn(
                "text-xl sm:text-2xl font-bold tracking-tight",
                kept >= 0 ? "text-primary" : "text-destructive"
              )}
            >
              {formatAmount(kept)}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
