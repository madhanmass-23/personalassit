"use client";

import { useEffect, useState, useId } from "react";
import { X, Calendar, Clock, Tag, Flag, AlertCircle, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskItem, TaskPriority, CreateTaskDTO, UpdateTaskDTO } from "@/services/api/task";
import { taskCategoryService, TaskCategoryItem } from "@/services/api/taskCategory";
import { getTodayDateString, getTomorrowDateString } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

interface TaskFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialTask?: TaskItem | null;
  categories: TaskCategoryItem[];
  onCategoryCreated?: (newCategory: TaskCategoryItem) => void;
  onClose: () => void;
  onSubmit: (data: CreateTaskDTO | UpdateTaskDTO) => Promise<void>;
}

export function TaskFormModal({
  isOpen,
  mode,
  initialTask,
  categories,
  onCategoryCreated,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const [title, setTitle] = useState(initialTask?.title || "");
  const [description, setDescription] = useState(initialTask?.description || "");
  const [categoryId, setCategoryId] = useState<number | null>(initialTask?.category_id ?? null);
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || "medium");
  const [dueDate, setDueDate] = useState<string>(initialTask?.due_date || "");
  const [dueTime, setDueTime] = useState<string>(
    initialTask?.due_time ? initialTask.due_time.slice(0, 5) : ""
  );

  // New category inline creation state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const titleId = useId();
  const descId = useId();
  const catId = useId();
  const dateId = useId();
  const timeId = useId();

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleQuickDate = (dateVal: string) => {
    setDueDate(dateVal);
  };

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    try {
      setCategorySubmitting(true);
      const created = await taskCategoryService.create({ name: trimmed });
      if (onCategoryCreated) {
        onCategoryCreated(created);
      }
      setCategoryId(created.id);
      setIsAddingCategory(false);
      setNewCategoryName("");
    } catch {
      setValidationError("Failed to create category. Please try again.");
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setValidationError("Please enter a title for the task.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateTaskDTO = {
        title: cleanTitle,
        description: description.trim() || null,
        category_id: categoryId,
        priority,
        due_date: dueDate || null,
        due_time: dueTime ? (dueTime.length === 5 ? `${dueTime}:00` : dueTime) : null,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save task. Please try again.";
      setValidationError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border/60 shrink-0">
          <h2 id="task-form-title" className="text-lg font-semibold text-foreground tracking-tight">
            {mode === "create" ? "Create New Task" : "Edit Task"}
          </h2>
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

          {/* 1. Title Field */}
          <div className="space-y-1.5">
            <label htmlFor={titleId} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Task Title <span className="text-destructive">*</span>
            </label>
            <input
              id={titleId}
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g., Complete DSP assignment"
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all shadow-xs"
            />
          </div>

          {/* 2. Description Field */}
          <div className="space-y-1.5">
            <label htmlFor={descId} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description <span className="text-muted-foreground/60 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id={descId}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add additional details, links, or notes..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all resize-none shadow-xs"
            />
          </div>

          {/* 3. Category & Priority Row */}
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
                    className="text-[11px] text-primary hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
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
                    className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={categorySubmitting || !newCategoryName.trim()}
                    className="h-8 px-2.5 text-xs rounded-lg"
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
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all shadow-xs cursor-pointer"
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

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Flag className="w-3.5 h-3.5" /> Priority
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-secondary/60 rounded-xl border border-border/50">
                {(["low", "medium", "high"] as TaskPriority[]).map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "py-1.5 text-xs font-semibold capitalize rounded-lg transition-all select-none min-h-[34px] cursor-pointer",
                        isSelected
                          ? p === "high"
                            ? "bg-rose-500 text-white shadow-xs"
                            : p === "medium"
                            ? "bg-amber-500 text-white shadow-xs"
                            : "bg-slate-600 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Due Date & Time Section */}
          <div className="space-y-2 pt-1 border-t border-border/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Schedule
              </label>
              {dueDate && (
                <button
                  type="button"
                  onClick={() => {
                    setDueDate("");
                    setDueTime("");
                  }}
                  className="text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                >
                  Clear date & time
                </button>
              )}
            </div>

            {/* Quick Date Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleQuickDate(todayStr)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors border cursor-pointer",
                  dueDate === todayStr
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-border/60 hover:bg-secondary/80"
                )}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(tomorrowStr)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors border cursor-pointer",
                  dueDate === tomorrowStr
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-border/60 hover:bg-secondary/80"
                )}
              >
                Tomorrow
              </button>
            </div>

            {/* Date & Time Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor={dateId} className="text-[11px] text-muted-foreground block mb-1">
                  Due Date
                </label>
                <div className="relative">
                  <input
                    id={dateId}
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all shadow-xs cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={timeId} className="text-[11px] text-muted-foreground block mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Due Time
                </label>
                <input
                  id={timeId}
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all shadow-xs cursor-pointer"
                />
              </div>
            </div>
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
              disabled={submitting || !title.trim()}
              className="rounded-xl px-6 min-h-[44px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-semibold cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {mode === "create" ? "Creating..." : "Saving..."}
                </>
              ) : mode === "create" ? (
                "Create Task"
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
