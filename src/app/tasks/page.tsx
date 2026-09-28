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
  CheckCircle2,
  Calendar,
  Sparkles,
  Inbox,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  taskService,
  TaskItem,
  CreateTaskDTO,
  UpdateTaskDTO,
} from "@/services/api/task";
import {
  taskCategoryService,
  TaskCategoryItem,
} from "@/services/api/taskCategory";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { TaskDeleteDialog } from "@/components/tasks/TaskDeleteDialog";
import {
  TaskFilterTabs,
  TaskFilterType,
} from "@/components/tasks/TaskFilterTabs";
import { TaskListSkeleton } from "@/components/tasks/TaskSkeleton";
import { getTodayDateString } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

function TasksMain() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tasks & Categories State
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [categories, setCategories] = useState<TaskCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [currentFilter, setCurrentFilter] = useState<TaskFilterType>("Today");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");

  // Modals & Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<TaskItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Feedback Toast Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Fetch initial tasks & categories
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const [tasksRes, categoriesRes] = await Promise.allSettled([
        taskService.getAll(),
        taskCategoryService.getAll(),
      ]);

      if (tasksRes.status === "fulfilled" && Array.isArray(tasksRes.value)) {
        setTasks(tasksRes.value);
      } else if (tasksRes.status === "rejected") {
        throw new Error("Couldn't load your tasks.");
      }

      if (categoriesRes.status === "fulfilled" && Array.isArray(categoriesRes.value)) {
        setCategories(categoriesRes.value);
      }
    } catch {
      setError("Couldn't load your tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle ?create=true URL query parameter (from Home Quick Action)
  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setFormMode("create");
      setEditingTask(null);
      setIsFormOpen(true);

      // Clean up URL parameter without full page reload
      router.replace("/tasks");
    }
  }, [searchParams, router]);

  // Add Category Handler (passed to modal)
  const handleCategoryCreated = (newCat: TaskCategoryItem) => {
    setCategories((prev) => [newCat, ...prev]);
    showToast(`Category "${newCat.name}" added`);
  };

  // Toggle Task Completion
  const handleToggleComplete = async (task: TaskItem) => {
    const isCompleted = task.status === "completed";
    const nextStatus = isCompleted ? "pending" : "completed";
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: nextStatus,
              completed_at: nextStatus === "completed" ? now : null,
            }
          : t
      )
    );

    try {
      if (isCompleted) {
        await taskService.incomplete(task.id);
        showToast("Task marked incomplete");
      } else {
        await taskService.complete(task.id);
        showToast("Task completed! 🎉");
      }
    } catch {
      // Revert optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: task.status, completed_at: task.completed_at }
            : t
        )
      );
      showToast("Failed to update task status.");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (task: TaskItem) => {
    setFormMode("edit");
    setEditingTask(task);
    setIsFormOpen(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormMode("create");
    setEditingTask(null);
    setIsFormOpen(true);
  };

  // Form Submit (Create or Update)
  const handleFormSubmit = async (data: CreateTaskDTO | UpdateTaskDTO) => {
    if (formMode === "create") {
      const created = await taskService.create(data as CreateTaskDTO);
      setTasks((prev) => [created, ...prev]);
      showToast("Task created successfully");
    } else if (formMode === "edit" && editingTask) {
      const updated = await taskService.update(editingTask.id, data as UpdateTaskDTO);
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? { ...t, ...updated } : t))
      );
      showToast("Task updated successfully");
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (task: TaskItem) => {
    setDeleteTarget(task);
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await taskService.delete(deleteTarget.id);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      showToast("Task permanently deleted");
    } catch {
      showToast("Failed to delete task.");
    }
  };

  // Date constants
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Filter Counts
  const counts = useMemo(() => {
    const today = tasks.filter((t) => t.due_date === todayStr).length;
    const upcoming = tasks.filter(
      (t) => t.due_date && t.due_date > todayStr && t.status !== "completed"
    ).length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const all = tasks.length;

    return { today, upcoming, completed, all };
  }, [tasks, todayStr]);

  // Today specific completed count for summary
  const todayCompletedCount = useMemo(() => {
    return tasks.filter(
      (t) => t.due_date === todayStr && t.status === "completed"
    ).length;
  }, [tasks, todayStr]);

  // Filter & Search Task List
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // 1. Filter by category if selected
    if (selectedCategory !== "all") {
      result = result.filter((t) => t.category_id === selectedCategory);
    }

    // 2. Filter by tab
    if (currentFilter === "Today") {
      result = result.filter((t) => t.due_date === todayStr);
    } else if (currentFilter === "Upcoming") {
      result = result.filter(
        (t) => t.due_date && t.due_date > todayStr && t.status !== "completed"
      );
    } else if (currentFilter === "Completed") {
      result = result.filter((t) => t.status === "completed");
    }

    // 3. Client-side Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Sort: Pending first, completed tasks at the bottom
    return [...result].sort((a, b) => {
      if (a.status === b.status) {
        // If due dates exist, sort by due date ascending
        if (a.due_date && b.due_date) {
          const dateDiff = a.due_date.localeCompare(b.due_date);
          if (dateDiff !== 0) return dateDiff;
        }
        return b.id - a.id;
      }
      return a.status === "completed" ? 1 : -1;
    });
  }, [tasks, currentFilter, selectedCategory, searchQuery, todayStr]);

  // Summary Text based on view
  const summaryText = useMemo(() => {
    if (currentFilter === "Today") {
      const total = counts.today;
      return `${total} task${total === 1 ? "" : "s"}${total > 0 ? ` · ${todayCompletedCount} completed` : ""}`;
    }
    if (currentFilter === "Upcoming") {
      return `${counts.upcoming} upcoming scheduled task${counts.upcoming === 1 ? "" : "s"}`;
    }
    if (currentFilter === "Completed") {
      return `${counts.completed} completed task${counts.completed === 1 ? "" : "s"}`;
    }
    return `${counts.all} total task${counts.all === 1 ? "" : "s"} · ${counts.completed} completed`;
  }, [currentFilter, counts, todayCompletedCount]);

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
            Tasks
          </h1>
          <p className="text-sm text-muted-foreground">
            Stay on top of what matters.
          </p>
        </div>

        {/* Primary "+ Add Task" button */}
        <Button
          onClick={handleOpenCreate}
          className="rounded-xl h-11 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-semibold flex items-center gap-2 self-start sm:self-auto min-h-[44px]"
        >
          <Plus className="w-5 h-5" />
          <span>Add Task</span>
        </Button>
      </header>

      {/* 2. TASK FILTERS & SEARCH CONTROLS */}
      <section aria-label="Task controls" className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Tabs */}
          <TaskFilterTabs
            currentFilter={currentFilter}
            onSelectFilter={setCurrentFilter}
            counts={counts}
          />

          {/* Category Filter Pills (if categories exist) */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto snap-x hide-scrollbar text-xs">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider flex items-center gap-1 shrink-0 pl-1">
                <Filter className="w-3 h-3" /> Category:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0",
                  selectedCategory === "all"
                    ? "bg-primary/10 text-primary font-semibold"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0",
                    selectedCategory === c.id
                      ? "bg-primary/10 text-primary font-semibold"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title or description..."
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Summary Counter */}
        {!loading && !error && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="font-medium text-foreground/80">{currentFilter}</span>
            <span>{summaryText}</span>
          </div>
        )}
      </section>

      {/* 3. TASK LIST / EMPTY / ERROR / LOADING STATES */}
      <section aria-label="Task list" className="w-full">
        {loading ? (
          <TaskListSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-destructive/20 bg-destructive/5 space-y-3">
            <div className="p-3 rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Couldn&apos;t load your tasks.
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              An error occurred while communicating with the server. Please check your connection and try again.
            </p>
            <Button
              variant="outline"
              onClick={fetchData}
              className="rounded-xl px-5 gap-2 min-h-[40px] mt-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        ) : filteredTasks.length === 0 ? (
          /* Empty States */
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-border/60 bg-card/40 space-y-3 min-h-[260px]">
            <div className="p-3.5 rounded-full bg-secondary text-muted-foreground/70 mb-1">
              {searchQuery ? (
                <Search className="w-7 h-7" />
              ) : currentFilter === "Completed" ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : currentFilter === "Upcoming" ? (
                <Calendar className="w-7 h-7" />
              ) : (
                <Inbox className="w-7 h-7" />
              )}
            </div>

            {searchQuery ? (
              <>
                <h3 className="text-base font-semibold text-foreground">
                  No matching tasks found
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  No tasks matched &ldquo;{searchQuery}&rdquo;. Try another search keyword or clear the search.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="rounded-xl px-4 mt-2"
                >
                  Clear search
                </Button>
              </>
            ) : currentFilter === "Today" ? (
              <>
                <h3 className="text-base font-semibold text-foreground">
                  No tasks for today.
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Enjoy the space, or add something you need to get done.
                </p>
                <Button
                  onClick={handleOpenCreate}
                  className="rounded-xl px-5 mt-2 gap-1.5 font-medium"
                >
                  <Plus className="w-4 h-4" /> Add Task
                </Button>
              </>
            ) : currentFilter === "Upcoming" ? (
              <>
                <h3 className="text-base font-semibold text-foreground">
                  Nothing scheduled yet.
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Plan ahead by adding tasks with future due dates.
                </p>
                <Button
                  onClick={handleOpenCreate}
                  className="rounded-xl px-5 mt-2 gap-1.5 font-medium"
                >
                  <Plus className="w-4 h-4" /> Add Task
                </Button>
              </>
            ) : currentFilter === "Completed" ? (
              <>
                <h3 className="text-base font-semibold text-foreground">
                  No completed tasks yet.
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  When you complete tasks, they will be archived here.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-foreground">
                  No tasks yet.
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Get organized and track your daily priorities easily.
                </p>
                <Button
                  onClick={handleOpenCreate}
                  className="rounded-xl px-5 mt-2 gap-1.5 font-medium"
                >
                  <Plus className="w-4 h-4" /> Add Task
                </Button>
              </>
            )}
          </div>
        ) : (
          /* Task Cards Grid */
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* 4. CREATE / EDIT TASK MODAL */}
      {isFormOpen && (
        <TaskFormModal
          key={editingTask ? `edit-${editingTask.id}` : "create"}
          isOpen={isFormOpen}
          mode={formMode}
          initialTask={editingTask}
          categories={categories}
          onCategoryCreated={handleCategoryCreated}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTask(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* 5. DELETE CONFIRMATION DIALOG */}
      <TaskDeleteDialog
        isOpen={isDeleteOpen}
        taskTitle={deleteTarget?.title || ""}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<TaskListSkeleton />}>
      <TasksMain />
    </Suspense>
  );
}
