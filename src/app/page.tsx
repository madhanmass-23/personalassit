"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Plus,
  Play,
  Wallet,
  Timer,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickAction } from "@/components/dashboard/QuickAction";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { authService } from "@/services/api/auth";
import { reportService } from "@/services/api/reports";
import { taskService, type TaskItem } from "@/services/api/task";
import { expenseService, type ExpenseItem } from "@/services/api/expense";
import { focusSessionService, type FocusSessionItem } from "@/services/api/focusSession";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: number;
  name: string;
  email: string;
}

interface TodayReport {
  income?: number;
  expense?: number;
  kept?: number;
  focus_seconds?: number;
  pending_tasks?: number;
  completed_tasks?: number;
}

interface ActivityItem {
  id: string;
  type: "task" | "expense" | "focus";
  title: string;
  detail: string;
  time?: string;
}

export default function Home() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [report, setReport] = useState<TodayReport | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSessionItem[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Verify session and get user
      const userData = await authService.me();
      if (!userData || !userData.user) {
        router.push("/login");
        return;
      }
      setUser(userData.user);

      // Fetch today's summary metrics and collections in parallel
      const [reportRes, tasksRes, expensesRes, focusRes] = await Promise.allSettled([
        reportService.getToday(),
        taskService.getAll(),
        expenseService.getAll(),
        focusSessionService.getAll(),
      ]);

      if (reportRes.status === "fulfilled" && reportRes.value) {
        setReport(reportRes.value);
      }

      if (tasksRes.status === "fulfilled" && Array.isArray(tasksRes.value)) {
        setTasks(tasksRes.value);
      }

      if (expensesRes.status === "fulfilled" && Array.isArray(expensesRes.value)) {
        setExpenses(expensesRes.value);
      }

      if (focusRes.status === "fulfilled" && Array.isArray(focusRes.value)) {
        setFocusSessions(focusRes.value);
      }
    } catch (err: unknown) {
      const apiErr = err as { status?: number };
      if (apiErr?.status === 401) {
        router.push("/login");
      } else {
        setError("Unable to load your dashboard right now. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRetry = () => {
    setLoading(true);
    fetchData();
  };

  // Handle task completion toggle
  const handleToggleTask = async (task: TaskItem) => {
    const isCurrentlyCompleted = task.status === "completed";
    const nextStatus = isCurrentlyCompleted ? "pending" : "completed";
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      if (isCurrentlyCompleted) {
        await taskService.incomplete(task.id);
      } else {
        await taskService.complete(task.id);
      }
      // Refresh report counts in the background
      const updatedReport = await reportService.getToday();
      if (updatedReport) setReport(updatedReport);
    } catch {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
    }
  };

  // Filter tasks for today
  const todayStr = useMemo(() => new Date().toLocaleDateString("en-CA"), []);

  const todayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.due_date) return true;
      return t.due_date === todayStr;
    });
  }, [tasks, todayStr]);

  const completedTasksCount = useMemo(() => {
    return todayTasks.filter((t) => t.status === "completed").length;
  }, [todayTasks]);

  const totalTasksCount = todayTasks.length;

  // Filter today's expenses
  const todayExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!e.expense_date) return false;
      return e.expense_date.startsWith(todayStr);
    });
  }, [expenses, todayStr]);

  // Filter today's focus sessions
  const todayFocusSessions = useMemo(() => {
    return focusSessions.filter(
      (f) => f.started_at && f.started_at.startsWith(todayStr)
    );
  }, [focusSessions, todayStr]);

  const todayFocusSeconds = useMemo(() => {
    if (report?.focus_seconds !== undefined && report.focus_seconds > 0) {
      return report.focus_seconds;
    }
    return todayFocusSessions.reduce(
      (acc, f) => acc + (Number(f.duration_seconds) || 0),
      0
    );
  }, [report, todayFocusSessions]);

  const todayFocusFormatted = useMemo(() => {
    const hours = Math.floor(todayFocusSeconds / 3600);
    const mins = Math.floor((todayFocusSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, [todayFocusSeconds]);

  // Dynamic Time-based Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Compute Daily Progress
  const progressPercent = useMemo(() => {
    if (totalTasksCount === 0) return 0;
    return Math.min(100, Math.round((completedTasksCount / totalTasksCount) * 100));
  }, [completedTasksCount, totalTasksCount]);

  // Derived Recent Activity (real data only)
  const recentActivities = useMemo<ActivityItem[]>(() => {
    const activities: ActivityItem[] = [];

    // Completed tasks
    todayTasks
      .filter((t) => t.status === "completed")
      .slice(0, 2)
      .forEach((t) => {
        activities.push({
          id: `task-${t.id}`,
          type: "task",
          title: t.title,
          detail: "Task completed",
          time: t.due_time || undefined,
        });
      });

    // Today's expenses
    todayExpenses.slice(0, 2).forEach((e) => {
      activities.push({
        id: `expense-${e.id}`,
        type: "expense",
        title: e.title || e.description || "Expense",
        detail: `₹${Number(e.amount).toLocaleString("en-IN")}${e.category ? ` • ${e.category}` : ""}`,
      });
    });

    // Today's focus sessions
    todayFocusSessions.slice(0, 1).forEach((f) => {
      const minutes = Math.round(Number(f.duration_seconds) / 60);
      const modeLabel = f.mode ? `${f.mode.charAt(0).toUpperCase() + f.mode.slice(1)} Session` : "Focus Session";
      activities.push({
        id: `focus-${f.id}`,
        type: "focus",
        title: modeLabel,
        detail: `${minutes > 0 ? `${minutes} minutes focused` : `${f.duration_seconds}s focused`}`,
      });
    });

    return activities.slice(0, 4);
  }, [todayTasks, todayExpenses, todayFocusSessions]);

  // Loading state
  if (loading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          Something went wrong
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {error || "We could not load your dashboard. Please try again."}
        </p>
        <Button onClick={handleRetry} className="mt-5 rounded-xl h-10 px-5 text-sm font-medium">
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-12">
      {/* 1. GREETING & PAGE HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-start justify-between gap-4 pt-1"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {greeting}, {user.name} <span className="inline-block animate-wave">👋</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what your day looks like. Let&apos;s make today count.
          </p>
        </div>

        {/* User initials badge */}
        <Link
          href="/profile"
          aria-label="View Profile and Settings"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-all font-bold text-lg border border-primary/20 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {(user.name || "U")[0].toUpperCase()}
        </Link>
      </motion.header>

      {/* 2. TODAY'S OVERVIEW (4-Metric Grid) */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        aria-label="Today's Overview"
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-foreground uppercase tracking-wider text-[11px]">
            Today&apos;s Overview
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={<Sparkles className="w-4 h-4" />}
            label="Tasks"
            value={`${totalTasksCount}`}
            subtext={totalTasksCount > 0 ? `${totalTasksCount} scheduled` : "None scheduled"}
            accent="default"
          />
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Completed"
            value={`${completedTasksCount}`}
            subtext={`${completedTasksCount} of ${totalTasksCount} done`}
            accent="success"
          />
          <StatCard
            icon={<Wallet className="w-4 h-4" />}
            label="Spent Today"
            value={`₹${Number(report?.expense || 0).toLocaleString("en-IN")}`}
            subtext={
              todayExpenses.length > 0
                ? `${todayExpenses.length} transaction${todayExpenses.length === 1 ? "" : "s"}`
                : "No expenses recorded"
            }
            accent="primary"
          />
          <StatCard
            icon={<Timer className="w-4 h-4" />}
            label="Focus"
            value={todayFocusFormatted}
            subtext={
              todayFocusSessions.length > 0
                ? `${todayFocusSessions.length} session${todayFocusSessions.length === 1 ? "" : "s"} today`
                : "No focus session yet"
            }
            accent="info"
          />
        </div>
      </motion.section>

      {/* 3. QUICK ACTIONS */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        aria-label="Quick Actions"
        className="space-y-3"
      >
        <h2 className="text-sm font-semibold tracking-tight text-foreground uppercase tracking-wider text-[11px]">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <QuickAction
            icon={<Plus className="w-5 h-5" />}
            label="+ Add Task"
            href="/tasks?create=true"
            ariaLabel="Add Task"
          />
          <QuickAction
            icon={<Plus className="w-5 h-5" />}
            label="+ Add Expense"
            href="/money?action=add-expense"
            ariaLabel="Add Expense"
          />
          <QuickAction
            icon={<Timer className="w-5 h-5" />}
            label="Start Focus"
            href="/focus"
            ariaLabel="Start Focus Session"
          />
          <QuickAction
            icon={<Wallet className="w-5 h-5" />}
            label="View Money"
            href="/money"
            ariaLabel="View Money Manager"
          />
        </div>
      </motion.section>

      {/* 4 & 5. SPLIT SECTION: TASKS & MONEY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* 4. TODAY'S TASKS */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className="space-y-3"
          aria-label="Today's Tasks"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Today&apos;s Tasks
              </h2>
              {totalTasksCount > 0 && (
                <Badge variant="secondary" size="sm">
                  {completedTasksCount} of {totalTasksCount} done
                </Badge>
              )}
            </div>
            <Link
              href="/tasks"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {todayTasks.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="w-6 h-6" />}
              title="No tasks for today"
              description="You're all caught up! Plan your schedule or add your first task."
              actionLabel="+ Add your first task"
              actionHref="/tasks?create=true"
            />
          ) : (
            <div className="rounded-2xl border bg-card/80 dark:bg-card/40 divide-y divide-border/60 overflow-hidden shadow-xs">
              {todayTasks.slice(0, 4).map((task) => {
                const isCompleted = task.status === "completed";
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3.5 p-3.5 sm:p-4 hover:bg-secondary/40 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task)}
                      aria-label={isCompleted ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
                      className="shrink-0 text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium leading-snug truncate",
                          isCompleted && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </p>
                      {task.due_time && (
                        <span className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {task.due_time}
                        </span>
                      )}
                    </div>
                    {task.priority && (
                      <Badge
                        variant={
                          task.priority === "high"
                            ? "danger"
                            : task.priority === "medium"
                            ? "warning"
                            : "secondary"
                        }
                        size="sm"
                        className="uppercase tracking-wider"
                      >
                        {task.priority}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* 5. MONEY SUMMARY */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="space-y-3"
          aria-label="Money Summary"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Today&apos;s Spending
            </h2>
            <Link
              href="/money"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              View Money <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(report?.expense || 0) === 0 && todayExpenses.length === 0 ? (
            <EmptyState
              icon={<Wallet className="w-6 h-6" />}
              title="Nothing spent today"
              description="Keep your finances on track by logging daily expenses."
              actionLabel="+ Add expense"
              actionHref="/money?action=add-expense"
            />
          ) : (
            <div className="p-5 rounded-2xl border bg-card/80 dark:bg-card/40 shadow-xs space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Spent</p>
                <div className="text-3xl font-bold tracking-tight text-foreground mt-0.5">
                  ₹{Number(report?.expense || 0).toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {todayExpenses.length > 0
                    ? `${todayExpenses.length} transaction${todayExpenses.length === 1 ? "" : "s"} recorded today`
                    : "Recorded expenses for today"}
                </p>
              </div>

              {/* Sub-breakdown if income exists */}
              {(report?.income || 0) > 0 && (
                <div className="pt-3 border-t border-border/60 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Income today</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{Number(report?.income || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Net Remaining</span>
                    <p className="font-semibold text-foreground">
                      ₹{Number(report?.kept || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              )}

              {/* Recent 2 expenses */}
              {todayExpenses.length > 0 && (
                <div className="pt-3 border-t border-border/60 space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Latest Transactions
                  </span>
                  <div className="space-y-1.5">
                    {todayExpenses.slice(0, 2).map((exp) => (
                      <div key={exp.id} className="flex items-center justify-between text-xs py-1">
                        <span className="font-medium truncate max-w-[180px]">
                          {exp.title || exp.description || "Expense"}
                        </span>
                        <span className="font-semibold text-foreground">
                          -₹{Number(exp.amount).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.section>
      </div>

      {/* 6. TODAY'S FOCUS SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.22 }}
        className="space-y-3"
        aria-label="Today's Focus"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Today&apos;s Focus
            </h2>
            {todayFocusSessions.length > 0 && (
              <Badge variant="secondary" size="sm">
                {todayFocusSessions.length} session{todayFocusSessions.length === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
          <Link
            href="/focus"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            Open Focus <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border bg-card/80 dark:bg-card/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Focus Time Today</p>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {todayFocusFormatted}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {todayFocusSessions.length > 0
                  ? `${todayFocusSessions.length} session${todayFocusSessions.length === 1 ? "" : "s"} completed today`
                  : "No focus sessions logged today"}
              </p>
            </div>
          </div>

          <Link href="/focus" className="w-full sm:w-auto">
            <Button className="rounded-xl h-10 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs w-full sm:w-auto cursor-pointer">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Focus</span>
            </Button>
          </Link>
        </div>
      </motion.section>

      {/* 7. DAILY PROGRESS SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.25 }}
        className="space-y-3"
        aria-label="Daily Progress"
      >
        <h2 className="text-sm font-semibold tracking-tight text-foreground uppercase tracking-wider text-[11px]">
          Daily Progress
        </h2>

        <div className="p-4 sm:p-5 rounded-2xl border bg-card/80 dark:bg-card/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Task Completion
              </span>
            </div>
            <span className="text-sm font-bold text-primary">{progressPercent}%</span>
          </div>

          {/* Progress bar meter */}
          <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {totalTasksCount > 0
              ? `${completedTasksCount} of ${totalTasksCount} tasks completed today.`
              : "No tasks scheduled for today. Create your first task to start tracking progress."}
          </p>
        </div>
      </motion.section>

      {/* 8. RECENT ACTIVITY SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.3 }}
        className="space-y-3"
        aria-label="Recent Activity"
      >
        <h2 className="text-sm font-semibold tracking-tight text-foreground uppercase tracking-wider text-[11px]">
          Recent Activity
        </h2>

        {recentActivities.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-6 h-6" />}
            title="Your activity will appear here."
            description="Complete a task, track an expense, or finish a focus session to see your activity timeline."
          />
        ) : (
          <div className="rounded-2xl border bg-card/80 dark:bg-card/40 divide-y divide-border/60 overflow-hidden shadow-xs">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-center gap-3.5 p-3.5 sm:p-4 text-xs">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                    act.type === "task"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : act.type === "expense"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  )}
                >
                  {act.type === "task" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : act.type === "expense" ? (
                    <Wallet className="w-4 h-4" />
                  ) : (
                    <Timer className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{act.title}</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">{act.detail}</p>
                </div>
                {act.time && (
                  <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                    {act.time}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}
