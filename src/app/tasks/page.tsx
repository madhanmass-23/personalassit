"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { taskService } from "@/services/api/task";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Today");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const data = await taskService.getAll();
        setTasks(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const toggleTask = async (task: any) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const now = new Date().toISOString().slice(0, 19).replace('T', ' '); // simple datetime
    
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, completed_at: newStatus === 'completed' ? now : null } : t));
    
    try {
      await taskService.update(task.id, { 
        status: newStatus,
        completed_at: newStatus === 'completed' ? now : null
      });
    } catch {
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status, completed_at: task.completed_at } : t));
    }
  };

  const todayStr = new Date().toLocaleDateString('en-CA');

  const filteredTasks = tasks.filter(task => {
    if (filter === "Today") {
      return task.due_date === todayStr && task.status !== 'completed';
    } else if (filter === "Upcoming") {
      return (task.due_date > todayStr || !task.due_date) && task.status !== 'completed';
    } else if (filter === "Completed") {
      return task.status === 'completed';
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 p-6 pt-safe pb-24 h-full min-h-screen-safe">
      <header className="flex items-center justify-between mt-4">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <Button size="icon" className="rounded-full shadow-lg h-12 w-12 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-6 h-6" />
        </Button>
      </header>

      <div className="flex gap-2 pb-2 overflow-x-auto snap-x hide-scrollbar">
        {["Today", "Upcoming", "Completed"].map(lbl => (
          <FilterChip 
            key={lbl}
            label={lbl} 
            active={filter === lbl} 
            onClick={() => setFilter(lbl)}
          />
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">Loading...</div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center py-10 text-red-500">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col justify-center items-center py-20 text-muted-foreground text-center">
          <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
          <p>You&apos;re all caught up.</p>
          <p className="text-sm opacity-80 mt-1">No {filter.toLowerCase()} tasks found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTasks.map(task => (
            <Card key={task.id} className={cn("overflow-hidden transition-all", task.status === 'completed' && "opacity-60")}>
              <CardContent className="p-4 flex gap-4">
                <button className="mt-0.5" onClick={() => toggleTask(task)}>
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                  )}
                </button>
                <div className="flex-1 flex flex-col gap-1.5">
                  <p className={cn("font-medium leading-none", task.status === 'completed' && "line-through text-muted-foreground")}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                    {task.due_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {task.due_time}
                      </span>
                    )}
                    {task.priority === 'high' && (
                      <span className="text-destructive bg-destructive/10 px-1.5 rounded-sm">High Priority</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap snap-start transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      )}
    >
      {label}
    </button>
  );
}
