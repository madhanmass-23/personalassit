"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { TaskItem } from "@/services/api/task";
import { formatTaskDueDate } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: TaskItem;
  onToggleComplete: (task: TaskItem) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
}

export function TaskCard({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = task.status === "completed";

  const dueInfo = formatTaskDueDate(task.due_date, task.due_time, isCompleted);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative flex flex-col rounded-2xl border transition-all duration-200",
        isCompleted
          ? "border-border/40 bg-card/40 opacity-75 hover:opacity-95"
          : "border-border/70 bg-card hover:border-primary/30 hover:shadow-xs"
      )}
    >
      <div className="p-3.5 sm:p-4.5 flex items-start gap-3 sm:gap-3.5">
        {/* Completion Checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          aria-label={
            isCompleted
              ? `Mark "${task.title}" as incomplete`
              : `Mark "${task.title}" as complete`
          }
          className="shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px] -ml-2 -mt-2 text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full cursor-pointer"
        >
          {isCompleted ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500 dark:text-emerald-400" />
            </motion.div>
          ) : (
            <Circle className="w-5.5 h-5.5 text-muted-foreground/70 group-hover:text-primary transition-colors" />
          )}
        </button>

        {/* Task Details */}
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "text-sm sm:text-base font-medium leading-snug break-words transition-colors",
                isCompleted
                  ? "line-through text-muted-foreground/80 font-normal"
                  : "text-foreground"
              )}
            >
              {task.title}
            </h3>

            {/* Quick Actions (Desktop & Touch) */}
            <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label={`Edit "${task.title}"`}
                className="flex items-center justify-center h-8 w-8 sm:h-7 sm:w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(task)}
                aria-label={`Delete "${task.title}"`}
                className="flex items-center justify-center h-8 w-8 sm:h-7 sm:w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Optional Description Preview */}
          {task.description && (
            <div className="mt-1">
              <p
                className={cn(
                  "text-xs sm:text-sm text-muted-foreground transition-all",
                  expanded ? "whitespace-pre-wrap" : "line-clamp-2"
                )}
              >
                {task.description}
              </p>
              {task.description.length > 80 && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline mt-0.5 focus-visible:outline-none"
                >
                  {expanded ? (
                    <>
                      Show less <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Read more <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Meta Tags: Category, Priority, Due Date/Time */}
          <div className="flex flex-wrap items-center gap-2 mt-2 pt-1 text-xs">
            {/* Category */}
            {task.category_name && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] bg-secondary text-secondary-foreground border border-border/40">
                <Tag className="w-3 h-3 text-muted-foreground" />
                <span>{task.category_name}</span>
              </span>
            )}

            {/* Priority */}
            {task.priority && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] uppercase tracking-wider",
                  task.priority === "high"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    : task.priority === "medium"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                    : "bg-secondary text-muted-foreground border border-border/40"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    task.priority === "high"
                      ? "bg-rose-500"
                      : task.priority === "medium"
                      ? "bg-amber-500"
                      : "bg-slate-400"
                  )}
                />
                {task.priority}
              </span>
            )}

            {/* Due Date & Time */}
            {dueInfo && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium",
                  dueInfo.isOverdue
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : dueInfo.isToday
                    ? "bg-primary/10 text-primary font-semibold"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {dueInfo.isOverdue ? (
                  <Clock className="w-3 h-3 text-rose-500 shrink-0" />
                ) : (
                  <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                )}
                <span>{dueInfo.label}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
