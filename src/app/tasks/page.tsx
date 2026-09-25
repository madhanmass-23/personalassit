import { mockTasks } from "@/mocks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-6 p-6 pt-safe pb-24 h-full min-h-screen-safe">
      <header className="flex items-center justify-between mt-4">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <Button size="icon" className="rounded-full shadow-lg h-12 w-12 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-6 h-6" />
        </Button>
      </header>

      <div className="flex gap-2 pb-2 overflow-x-auto snap-x hide-scrollbar">
        <FilterChip label="Today" active />
        <FilterChip label="Upcoming" />
        <FilterChip label="Completed" />
      </div>

      <div className="flex flex-col gap-3">
        {mockTasks.map(task => (
          <Card key={task.id} className={cn("overflow-hidden transition-all", task.completed && "opacity-60")}>
            <CardContent className="p-4 flex gap-4">
              <button className="mt-0.5">
                {task.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </button>
              <div className="flex-1 flex flex-col gap-1.5">
                <p className={cn("font-medium leading-none", task.completed && "line-through text-muted-foreground")}>
                  {task.title}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {task.time}
                  </span>
                  {task.priority === 'high' && (
                    <span className="text-destructive bg-destructive/10 px-1.5 rounded-sm">High Priority</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FilterChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <button className={cn(
      "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap snap-start transition-colors",
      active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
    )}>
      {label}
    </button>
  );
}
