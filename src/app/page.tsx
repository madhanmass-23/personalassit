import { mockUser, mockExpenses, mockFocus, mockTasks } from "@/mocks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Plus, Wallet, Timer, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const nextTask = mockTasks.find(t => !t.completed);
  
  return (
    <div className="flex flex-col gap-6 p-6 pt-safe pb-24">
      {/* Header */}
      <header className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{mockUser.greeting},</h1>
          <h2 className="text-3xl font-bold text-muted-foreground">{mockUser.name}.</h2>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-semibold text-lg">{mockUser.name[0]}</span>
        </div>
      </header>

      {/* Date */}
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/10">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-sm font-medium text-primary flex items-center gap-1">
              <Wallet className="w-4 h-4" /> Spent Today
            </span>
            <span className="text-2xl font-bold">{mockExpenses.currency}{mockExpenses.todayTotal}</span>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/10">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-sm font-medium text-orange-600 flex items-center gap-1">
              <Timer className="w-4 h-4" /> Focused
            </span>
            <span className="text-2xl font-bold">{mockFocus.todayTotal}</span>
          </CardContent>
        </Card>
      </div>

      {/* Next Activity / Task */}
      {nextTask && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold tracking-tight">Up Next</h3>
          <Card className="overflow-hidden border-l-4 border-l-primary">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium leading-none mb-1.5">{nextTask.title}</p>
                <p className="text-sm text-muted-foreground">{nextTask.time}</p>
              </div>
              <Button size="icon" variant="ghost" className="rounded-full text-muted-foreground hover:text-primary">
                <Circle className="w-6 h-6" />
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Quick Actions */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold tracking-tight">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-2">
          <QuickActionBtn icon={<Plus className="w-5 h-5" />} label="Task" />
          <QuickActionBtn icon={<Wallet className="w-5 h-5" />} label="Expense" />
          <QuickActionBtn icon={<Timer className="w-5 h-5" />} label="Focus" />
          <QuickActionBtn icon={<MessageSquare className="w-5 h-5" />} label="Assistant" />
        </div>
      </section>
      
      {/* Today's Tasks Summary */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold tracking-tight">Today&apos;s Tasks</h3>
        <Card>
          <CardContent className="p-0 divide-y">
            {mockTasks.slice(0, 3).map(task => (
              <div key={task.id} className="flex items-center gap-4 p-4">
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <p className={cn("font-medium text-sm", task.completed && "line-through text-muted-foreground")}>{task.title}</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">{task.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function QuickActionBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-secondary/50 hover:bg-secondary active:scale-95 transition-all">
      <div className="bg-background rounded-full p-2 shadow-sm text-foreground">
        {icon}
      </div>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
