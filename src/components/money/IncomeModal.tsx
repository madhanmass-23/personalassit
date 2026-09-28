"use client";

import { useEffect, useState, useId } from "react";
import { X, Calendar, Tag, AlertCircle, Loader2, Plus, FileText, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IncomeItem, CreateIncomeDTO, UpdateIncomeDTO } from "@/services/api/income";
import { incomeCategoryService, IncomeCategoryItem } from "@/services/api/incomeCategory";
import { getTodayDateString } from "@/lib/dateUtils";

interface IncomeModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialIncome?: IncomeItem | null;
  categories: IncomeCategoryItem[];
  onCategoryCreated?: (newCategory: IncomeCategoryItem) => void;
  onClose: () => void;
  onSubmit: (data: CreateIncomeDTO | UpdateIncomeDTO) => Promise<void>;
}

export function IncomeModal({
  isOpen,
  mode,
  initialIncome,
  categories,
  onCategoryCreated,
  onClose,
  onSubmit,
}: IncomeModalProps) {
  const [amount, setAmount] = useState<string>(
    initialIncome ? String(initialIncome.amount) : ""
  );
  const [source, setSource] = useState(initialIncome?.source || "");
  const [categoryId, setCategoryId] = useState<number | null>(initialIncome?.category_id ?? null);
  const [incomeDate, setIncomeDate] = useState<string>(
    initialIncome?.income_date?.slice(0, 10) || getTodayDateString()
  );
  const [notes, setNotes] = useState(initialIncome?.notes || "");

  // Inline Category creation
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const amountId = useId();
  const sourceId = useId();
  const catId = useId();
  const dateId = useId();
  const notesId = useId();

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    try {
      setCategorySubmitting(true);
      const created = await incomeCategoryService.create({ name: trimmed });
      if (onCategoryCreated) onCategoryCreated(created);
      setCategoryId(created.id);
      setIsAddingCategory(false);
      setNewCategoryName("");
    } catch {
      setValidationError("Failed to create income category. Please try again.");
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError("Please enter a valid amount greater than 0.");
      return;
    }

    const cleanSource = source.trim();
    if (!cleanSource) {
      setValidationError("Please enter an income source (e.g. Salary, Freelance).");
      return;
    }

    if (!incomeDate) {
      setValidationError("Please select a valid date.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateIncomeDTO = {
        amount: parsedAmount,
        source: cleanSource,
        income_date: incomeDate,
        category_id: categoryId,
        notes: notes.trim() || null,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't save this income. Try again.";
      setValidationError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="income-form-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </span>
            <h2 id="income-form-title" className="text-lg font-semibold text-foreground tracking-tight">
              {mode === "create" ? "Add Income" : "Edit Income"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5">
          {validationError && (
            <div
              role="alert"
              className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 1. Large Amount Input */}
          <div className="space-y-1.5">
            <label htmlFor={amountId} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Amount (INR) <span className="text-destructive">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹</span>
              <input
                id={amountId}
                type="number"
                step="any"
                min="0.01"
                required
                autoFocus
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-input bg-emerald-500/5 text-foreground text-2xl sm:text-3xl font-bold placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* 2. Source Field */}
          <div className="space-y-1.5">
            <label htmlFor={sourceId} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Income Source <span className="text-destructive">*</span>
            </label>
            <input
              id={sourceId}
              type="text"
              required
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g., Salary, Freelance, Consulting, Dividend"
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition-all shadow-xs"
            />
          </div>

          {/* 3. Category & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={catId} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Category
                </label>
                {!isAddingCategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> New
                  </button>
                )}
              </div>

              {isAddingCategory ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={categorySubmitting || !newCategoryName.trim()}
                    className="h-8 px-2.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {categorySubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingCategory(false)}
                    className="h-8 px-2 text-xs rounded-lg"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <select
                  id={catId}
                  value={categoryId ?? ""}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition-all shadow-xs cursor-pointer"
                >
                  <option value="">No Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label htmlFor={dateId} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Date
              </label>
              <input
                id={dateId}
                type="date"
                required
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition-all shadow-xs cursor-pointer"
              />
            </div>
          </div>

          {/* 4. Optional Notes */}
          <div className="space-y-1.5">
            <label htmlFor={notesId} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Notes <span className="text-muted-foreground/60 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id={notesId}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details, client name, or transaction notes..."
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition-all resize-none shadow-xs"
            />
          </div>

          {/* Modal Action Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl px-5 min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !amount || !source.trim()}
              className="rounded-xl px-6 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-semibold cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {mode === "create" ? "Saving..." : "Updating..."}
                </>
              ) : mode === "create" ? (
                "Save Income"
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
