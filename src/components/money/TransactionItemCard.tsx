"use client";

import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Pencil,
  Trash2,
  Tag,
  Calendar,
  FileText,
} from "lucide-react";
import { formatTaskDueDate } from "@/lib/dateUtils";

export interface TransactionRecord {
  id: number;
  type: "expense" | "income";
  amount: number;
  description: string;
  category_id?: number | null;
  category_name?: string | null;
  category_icon?: string | null;
  date: string;
  notes?: string | null;
  created_at?: string;
}

interface TransactionItemCardProps {
  transaction: TransactionRecord;
  onEdit: (transaction: TransactionRecord) => void;
  onDelete: (transaction: TransactionRecord) => void;
}

export function TransactionItemCard({
  transaction,
  onEdit,
  onDelete,
}: TransactionItemCardProps) {
  const isExpense = transaction.type === "expense";
  const dueInfo = formatTaskDueDate(transaction.date, null);
  const formattedDate = dueInfo ? dueInfo.label : transaction.date;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-border/70 bg-card hover:border-primary/30 hover:shadow-xs transition-all duration-200"
    >
      <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
        {/* Type Icon */}
        <div
          aria-hidden="true"
          className={`h-10 w-10 sm:h-11 sm:w-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
            isExpense
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {isExpense ? (
            <ArrowDownRight className="w-5 h-5" />
          ) : (
            <ArrowUpRight className="w-5 h-5" />
          )}
        </div>

        {/* Transaction Details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-semibold text-foreground truncate leading-snug">
            {transaction.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
            {/* Category */}
            {transaction.category_name && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] bg-secondary text-secondary-foreground border border-border/40">
                <Tag className="w-3 h-3 text-muted-foreground" />
                <span>{transaction.category_name}</span>
              </span>
            )}

            {/* Date */}
            <span className="inline-flex items-center gap-1 text-[11px]">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
            </span>

            {/* Notes Indicator */}
            {transaction.notes && (
              <span
                title={transaction.notes}
                className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground/80 hover:text-foreground cursor-help"
              >
                <FileText className="w-3 h-3" />
                <span className="truncate max-w-[120px] hidden sm:inline">
                  {transaction.notes}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-3">
        <span
          className={`text-base sm:text-lg font-bold tracking-tight ${
            isExpense
              ? "text-foreground"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {isExpense ? "-" : "+"}₹{Number(transaction.amount).toLocaleString("en-IN")}
        </span>

        {/* Quick Action buttons */}
        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(transaction)}
            aria-label={`Edit ${transaction.description}`}
            className="flex items-center justify-center h-8 w-8 sm:h-7 sm:w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(transaction)}
            aria-label={`Delete ${transaction.description}`}
            className="flex items-center justify-center h-8 w-8 sm:h-7 sm:w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
