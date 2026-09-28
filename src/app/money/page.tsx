"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  X,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Download,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  expenseService,
  ExpenseItem,
  CreateExpenseDTO,
  UpdateExpenseDTO,
} from "@/services/api/expense";
import {
  expenseCategoryService,
  ExpenseCategoryItem,
} from "@/services/api/expenseCategory";
import {
  incomeService,
  IncomeItem,
  CreateIncomeDTO,
  UpdateIncomeDTO,
} from "@/services/api/income";
import {
  incomeCategoryService,
  IncomeCategoryItem,
} from "@/services/api/incomeCategory";
import {
  reportService,
  FinancialSummaryReport,
} from "@/services/api/reports";
import {
  FinancialSummaryCard,
  SummaryPeriod,
} from "@/components/money/FinancialSummaryCard";
import { TodaySpendingSection } from "@/components/money/TodaySpendingSection";
import { ExpenseModal } from "@/components/money/ExpenseModal";
import { IncomeModal } from "@/components/money/IncomeModal";
import { DeleteTransactionDialog } from "@/components/money/DeleteTransactionDialog";
import {
  TransactionItemCard,
  TransactionRecord,
} from "@/components/money/TransactionItemCard";
import { MoneySkeleton } from "@/components/money/MoneySkeleton";
import { getTodayDateString } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

type TransactionFilterType = "all" | "expense" | "income";

function MoneyMain() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data State
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [income, setIncome] = useState<IncomeItem[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryItem[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<IncomeCategoryItem[]>([]);

  // Backend Reports Cache (for Today, Week, Month)
  const [todayReport, setTodayReport] = useState<FinancialSummaryReport | null>(null);
  const [weekReport, setWeekReport] = useState<FinancialSummaryReport | null>(null);
  const [monthReport, setMonthReport] = useState<FinancialSummaryReport | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [summaryPeriod, setSummaryPeriod] = useState<SummaryPeriod>("today");
  const [transFilter, setTransFilter] = useState<TransactionFilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseModalMode, setExpenseModalMode] = useState<"create" | "edit">("create");
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeModalMode, setIncomeModalMode] = useState<"create" | "edit">("create");
  const [editingIncome, setEditingIncome] = useState<IncomeItem | null>(null);

  // Deletion State
  const [deleteTarget, setDeleteTarget] = useState<TransactionRecord | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Toast Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Fetch all financial data & reports
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const [
        expRes,
        incRes,
        expCatRes,
        incCatRes,
        todayRepRes,
        weekRepRes,
        monthRepRes,
      ] = await Promise.allSettled([
        expenseService.getAll(),
        incomeService.getAll(),
        expenseCategoryService.getAll(),
        incomeCategoryService.getAll(),
        reportService.getToday(),
        reportService.getWeek(),
        reportService.getMonth(),
      ]);

      if (expRes.status === "fulfilled" && Array.isArray(expRes.value)) {
        setExpenses(expRes.value);
      }
      if (incRes.status === "fulfilled" && Array.isArray(incRes.value)) {
        setIncome(incRes.value);
      }
      if (expCatRes.status === "fulfilled" && Array.isArray(expCatRes.value)) {
        setExpenseCategories(expCatRes.value);
      }
      if (incCatRes.status === "fulfilled" && Array.isArray(incCatRes.value)) {
        setIncomeCategories(incCatRes.value);
      }
      if (todayRepRes.status === "fulfilled" && todayRepRes.value) {
        setTodayReport(todayRepRes.value);
      }
      if (weekRepRes.status === "fulfilled" && weekRepRes.value) {
        setWeekReport(weekRepRes.value);
      }
      if (monthRepRes.status === "fulfilled" && monthRepRes.value) {
        setMonthReport(monthRepRes.value);
      }

      if (expRes.status === "rejected" && incRes.status === "rejected") {
        throw new Error("Couldn't load your financial data.");
      }
    } catch {
      setError("Couldn't load your financial data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle URL action parameters (e.g. from Home Quick Actions)
  useEffect(() => {
    const action = searchParams.get("action") || searchParams.get("create");
    if (action === "add-expense" || action === "expense") {
      setExpenseModalMode("create");
      setEditingExpense(null);
      setIsExpenseModalOpen(true);
      router.replace("/money");
    } else if (action === "add-income" || action === "income") {
      setIncomeModalMode("create");
      setEditingIncome(null);
      setIsIncomeModalOpen(true);
      router.replace("/money");
    }
  }, [searchParams, router]);

  // Map category names onto expenses & income
  const categoryMaps = useMemo(() => {
    const expMap = new Map<number, string>();
    expenseCategories.forEach((c) => expMap.set(c.id, c.name));

    const incMap = new Map<number, string>();
    incomeCategories.forEach((c) => incMap.set(c.id, c.name));

    return { expMap, incMap };
  }, [expenseCategories, incomeCategories]);

  // Today Date string
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Today's Expenses
  const todayExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.expense_date && e.expense_date.startsWith(todayStr))
      .map((e) => ({
        ...e,
        category_name: e.category_name || (e.category_id ? categoryMaps.expMap.get(e.category_id) : null),
      }));
  }, [expenses, todayStr, categoryMaps.expMap]);

  // Compute Financial Summary for selected period (Today / Week / Month / All Time)
  const summaryMetrics = useMemo(() => {
    if (summaryPeriod === "today" && todayReport) {
      return {
        earned: todayReport.income || 0,
        spent: todayReport.expense || 0,
        kept: todayReport.kept ?? (todayReport.income - todayReport.expense),
      };
    }
    if (summaryPeriod === "week" && weekReport) {
      return {
        earned: weekReport.income || 0,
        spent: weekReport.expense || 0,
        kept: weekReport.kept ?? (weekReport.income - weekReport.expense),
      };
    }
    if (summaryPeriod === "month" && monthReport) {
      return {
        earned: monthReport.income || 0,
        spent: monthReport.expense || 0,
        kept: monthReport.kept ?? (monthReport.income - monthReport.expense),
      };
    }

    // Default / All Time: Sum from loaded transactions deterministically
    const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalEarned = income.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    return {
      earned: totalEarned,
      spent: totalSpent,
      kept: totalEarned - totalSpent,
    };
  }, [summaryPeriod, todayReport, weekReport, monthReport, expenses, income]);

  // Unified Transactions List
  const unifiedTransactions = useMemo<TransactionRecord[]>(() => {
    const list: TransactionRecord[] = [];

    expenses.forEach((e) => {
      list.push({
        id: e.id,
        type: "expense",
        amount: Number(e.amount) || 0,
        description: e.description,
        category_id: e.category_id,
        category_name: e.category_name || (e.category_id ? categoryMaps.expMap.get(e.category_id) : null),
        category_icon: e.category_icon,
        date: e.expense_date,
        notes: e.notes,
        created_at: e.created_at,
      });
    });

    income.forEach((i) => {
      list.push({
        id: i.id,
        type: "income",
        amount: Number(i.amount) || 0,
        description: i.source,
        category_id: i.category_id,
        category_name: i.category_name || (i.category_id ? categoryMaps.incMap.get(i.category_id) : null),
        category_icon: i.category_icon,
        date: i.income_date,
        notes: i.notes,
        created_at: i.created_at,
      });
    });

    // Sort by date descending
    return list.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return b.id - a.id;
    });
  }, [expenses, income, categoryMaps]);

  // Filtered & Searched Transactions
  const filteredTransactions = useMemo(() => {
    let list = unifiedTransactions;

    if (transFilter === "expense") {
      list = list.filter((t) => t.type === "expense");
    } else if (transFilter === "income") {
      list = list.filter((t) => t.type === "income");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (t.category_name && t.category_name.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    return list;
  }, [unifiedTransactions, transFilter, searchQuery]);

  // Handle Save Expense (Create or Update)
  const handleExpenseSubmit = async (data: CreateExpenseDTO | UpdateExpenseDTO) => {
    if (expenseModalMode === "create") {
      const created = await expenseService.create(data as CreateExpenseDTO);
      setExpenses((prev) => [created, ...prev]);
      showToast("Expense recorded successfully");
    } else if (expenseModalMode === "edit" && editingExpense) {
      const updated = await expenseService.update(editingExpense.id, data as UpdateExpenseDTO);
      setExpenses((prev) =>
        prev.map((e) => (e.id === editingExpense.id ? { ...e, ...updated } : e))
      );
      showToast("Expense updated successfully");
    }
    // Refresh report totals in background
    reportService.getToday().then((r) => setTodayReport(r)).catch(() => {});
  };

  // Handle Save Income (Create or Update)
  const handleIncomeSubmit = async (data: CreateIncomeDTO | UpdateIncomeDTO) => {
    if (incomeModalMode === "create") {
      const created = await incomeService.create(data as CreateIncomeDTO);
      setIncome((prev) => [created, ...prev]);
      showToast("Income added successfully");
    } else if (incomeModalMode === "edit" && editingIncome) {
      const updated = await incomeService.update(editingIncome.id, data as UpdateIncomeDTO);
      setIncome((prev) =>
        prev.map((i) => (i.id === editingIncome.id ? { ...i, ...updated } : i))
      );
      showToast("Income updated successfully");
    }
    // Refresh report totals in background
    reportService.getToday().then((r) => setTodayReport(r)).catch(() => {});
  };

  // Edit Trigger from Transaction Item
  const handleEditTransaction = (item: TransactionRecord) => {
    if (item.type === "expense") {
      const exp = expenses.find((e) => e.id === item.id);
      if (exp) {
        setEditingExpense(exp);
        setExpenseModalMode("edit");
        setIsExpenseModalOpen(true);
      }
    } else {
      const inc = income.find((i) => i.id === item.id);
      if (inc) {
        setEditingIncome(inc);
        setIncomeModalMode("edit");
        setIsIncomeModalOpen(true);
      }
    }
  };

  // Delete Trigger from Transaction Item
  const handleDeleteTransaction = (item: TransactionRecord) => {
    setDeleteTarget(item);
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "expense") {
        await expenseService.delete(deleteTarget.id);
        setExpenses((prev) => prev.filter((e) => e.id !== deleteTarget.id));
        showToast("Expense deleted");
      } else {
        await incomeService.delete(deleteTarget.id);
        setIncome((prev) => prev.filter((i) => i.id !== deleteTarget.id));
        showToast("Income deleted");
      }
      reportService.getToday().then((r) => setTodayReport(r)).catch(() => {});
    } catch {
      showToast("Failed to delete transaction.");
    }
  };

  // CSV Export URL helper
  const apiBaseUrl = (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"
  ).replace(/\/+$/, "");

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-12 w-full">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-foreground text-background shadow-xl text-sm font-medium border border-border"
          >
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. PAGE HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Money
          </h1>
          <p className="text-sm text-muted-foreground">
            Know where your money is going.
          </p>
        </div>

        {/* Primary (+ Add Expense) & Secondary (+ Add Income) Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <Button
            onClick={() => {
              setExpenseModalMode("create");
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="rounded-xl h-11 px-4.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-semibold flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setIncomeModalMode("create");
              setEditingIncome(null);
              setIsIncomeModalOpen(true);
            }}
            className="rounded-xl h-11 px-4 border-border/80 hover:bg-secondary text-foreground font-semibold flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            <span>Add Income</span>
          </Button>
        </div>
      </header>

      {loading ? (
        <MoneySkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-destructive/20 bg-destructive/5 space-y-3">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Couldn&apos;t load your financial data.
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {error}
          </p>
          <Button
            variant="outline"
            onClick={fetchData}
            className="rounded-xl px-5 gap-2 min-h-[40px] mt-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
        </div>
      ) : (
        <>
          {/* 2. FINANCIAL SUMMARY: Earned, Spent, Kept */}
          <FinancialSummaryCard
            period={summaryPeriod}
            onPeriodChange={setSummaryPeriod}
            earned={summaryMetrics.earned}
            spent={summaryMetrics.spent}
            kept={summaryMetrics.kept}
          />

          {/* 3. TODAY'S SPENDING SECTION */}
          <TodaySpendingSection
            todayExpenses={todayExpenses}
            onAddExpenseClick={() => {
              setExpenseModalMode("create");
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
          />

          {/* 4. TRANSACTIONS SECTION */}
          <section aria-label="Transactions" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Transaction History
                </h2>
                <span className="text-xs text-muted-foreground">
                  ({filteredTransactions.length})
                </span>
              </div>

              {/* CSV Export Links (using existing Report API endpoints) */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <a
                  href={`${apiBaseUrl}/reports/export/expenses`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-secondary/50 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Export Expenses
                </a>
                <a
                  href={`${apiBaseUrl}/reports/export/income`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-secondary/50 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Export Income
                </a>
              </div>
            </div>

            {/* Filter Tabs & Search Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Type Filter: All | Expenses | Income */}
              <div
                role="tablist"
                aria-label="Filter transactions"
                className="flex items-center gap-1 p-1 bg-secondary/60 rounded-xl border border-border/50 self-start sm:self-auto text-xs"
              >
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "expense", label: "Expenses" },
                    { id: "income", label: "Income" },
                  ] as { id: TransactionFilterType; label: string }[]
                ).map((tab) => {
                  const isActive = transFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setTransFilter(tab.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg font-medium transition-all min-h-[32px] cursor-pointer",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search transactions..."
                  className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-input bg-card text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all shadow-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Transaction Items or Empty States */}
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-border/60 bg-card/40 space-y-3 min-h-[220px]">
                <div className="p-3.5 rounded-full bg-secondary text-muted-foreground/70 mb-1">
                  {searchQuery ? (
                    <Search className="w-6 h-6" />
                  ) : transFilter === "income" ? (
                    <ArrowUpRight className="w-6 h-6 text-emerald-500" />
                  ) : transFilter === "expense" ? (
                    <ArrowDownRight className="w-6 h-6 text-rose-500" />
                  ) : (
                    <Receipt className="w-6 h-6" />
                  )}
                </div>

                {searchQuery ? (
                  <>
                    <h3 className="text-base font-semibold text-foreground">
                      No matching transactions found
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      No transactions matched &ldquo;{searchQuery}&rdquo;. Try another keyword.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="rounded-xl px-4 mt-2 cursor-pointer"
                    >
                      Clear search
                    </Button>
                  </>
                ) : transFilter === "income" ? (
                  <>
                    <h3 className="text-base font-semibold text-foreground">
                      No income recorded yet.
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Add your first income entry to track your earnings.
                    </p>
                    <Button
                      onClick={() => {
                        setIncomeModalMode("create");
                        setEditingIncome(null);
                        setIsIncomeModalOpen(true);
                      }}
                      className="rounded-xl px-5 mt-2 gap-1.5 font-medium cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Income
                    </Button>
                  </>
                ) : transFilter === "expense" ? (
                  <>
                    <h3 className="text-base font-semibold text-foreground">
                      No expenses recorded yet.
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Your spending will appear here once you log an expense.
                    </p>
                    <Button
                      onClick={() => {
                        setExpenseModalMode("create");
                        setEditingExpense(null);
                        setIsExpenseModalOpen(true);
                      }}
                      className="rounded-xl px-5 mt-2 gap-1.5 font-medium cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Expense
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-semibold text-foreground">
                      No transactions yet.
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Start tracking your money by recording an expense or income.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        onClick={() => {
                          setExpenseModalMode("create");
                          setEditingExpense(null);
                          setIsExpenseModalOpen(true);
                        }}
                        className="rounded-xl px-4 gap-1.5 font-medium cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Add Expense
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIncomeModalMode("create");
                          setEditingIncome(null);
                          setIsIncomeModalOpen(true);
                        }}
                        className="rounded-xl px-4 gap-1.5 font-medium cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-emerald-500" /> Add Income
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <AnimatePresence initial={false}>
                  {filteredTransactions.map((item) => (
                    <TransactionItemCard
                      key={`${item.type}-${item.id}`}
                      transaction={item}
                      onEdit={handleEditTransaction}
                      onDelete={handleDeleteTransaction}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        </>
      )}

      {/* 5. ADD / EDIT EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <ExpenseModal
          key={editingExpense ? `edit-exp-${editingExpense.id}` : "create-exp"}
          isOpen={isExpenseModalOpen}
          mode={expenseModalMode}
          initialExpense={editingExpense}
          categories={expenseCategories}
          onCategoryCreated={(newCat) => {
            setExpenseCategories((prev) => [newCat, ...prev]);
            showToast(`Category "${newCat.name}" created`);
          }}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setEditingExpense(null);
          }}
          onSubmit={handleExpenseSubmit}
        />
      )}

      {/* 6. ADD / EDIT INCOME MODAL */}
      {isIncomeModalOpen && (
        <IncomeModal
          key={editingIncome ? `edit-inc-${editingIncome.id}` : "create-inc"}
          isOpen={isIncomeModalOpen}
          mode={incomeModalMode}
          initialIncome={editingIncome}
          categories={incomeCategories}
          onCategoryCreated={(newCat) => {
            setIncomeCategories((prev) => [newCat, ...prev]);
            showToast(`Income category "${newCat.name}" created`);
          }}
          onClose={() => {
            setIsIncomeModalOpen(false);
            setEditingIncome(null);
          }}
          onSubmit={handleIncomeSubmit}
        />
      )}

      {/* 7. DELETE CONFIRMATION DIALOG */}
      <DeleteTransactionDialog
        isOpen={isDeleteOpen}
        type={deleteTarget?.type || "expense"}
        description={deleteTarget?.description || ""}
        amount={deleteTarget?.amount || 0}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default function MoneyPage() {
  return (
    <Suspense fallback={<MoneySkeleton />}>
      <MoneyMain />
    </Suspense>
  );
}
