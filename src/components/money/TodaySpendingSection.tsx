"use client";

import { useMemo } from "react";
import { Wallet, Tag, ArrowRight } from "lucide-react";
import { ExpenseItem } from "@/services/api/expense";

interface TodaySpendingSectionProps {
  todayExpenses: ExpenseItem[];
  onAddExpenseClick: () => void;
}

export function TodaySpendingSection({
  todayExpenses,
  onAddExpenseClick,
}: TodaySpendingSectionProps) {
  const { totalAmount, count, categoryBreakdown } = useMemo(() => {
    let sum = 0;
    const breakdown: Record<string, number> = {};

    todayExpenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      sum += amt;
      const cat = e.category_name || "Uncategorized";
      breakdown[cat] = (breakdown[cat] || 0) + amt;
    });

    return {
      totalAmount: sum,
      count: todayExpenses.length,
      categoryBreakdown: Object.entries(breakdown).sort((a, b) => b[1] - a[1]),
    };
  }, [todayExpenses]);

  return (
    <section
      aria-label="Today's Spending"
      className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-xs"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
            <Wallet className="w-4 h-4" />
          </span>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Today&apos;s Spending
          </h2>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {count} transaction{count === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border/40 pb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            ₹{Math.round(totalAmount).toLocaleString("en-IN")}
          </span>
          <span className="text-xs text-muted-foreground">spent today</span>
        </div>

        {count === 0 && (
          <button
            type="button"
            onClick={onAddExpenseClick}
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            + Record an expense <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Breakdown if expenses exist */}
      {categoryBreakdown.length > 0 ? (
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Category Breakdown
          </p>
          <div className="flex flex-wrap gap-2">
            {categoryBreakdown.map(([cat, amt]) => {
              const percent = totalAmount > 0 ? Math.round((amt / totalAmount) * 100) : 0;
              return (
                <div
                  key={cat}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 border border-border/40 text-xs font-medium"
                >
                  <Tag className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground">{cat}</span>
                  <span className="font-semibold text-foreground/90">
                    ₹{Math.round(amt).toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    ({percent}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground pt-1">
          No expenses recorded yet today. Keep it up or add a new transaction.
        </p>
      )}
    </section>
  );
}
