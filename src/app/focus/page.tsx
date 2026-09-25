import { mockFocus } from "@/mocks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Timer, Target } from "lucide-react";

export default function FocusPage() {
  return (
    <div className="flex flex-col gap-6 p-6 pt-safe pb-24 min-h-screen-safe">
      <header className="flex items-center justify-between mt-4">
        <h1 className="text-3xl font-bold tracking-tight">Focus</h1>
      </header>

      {/* Timer Section */}
      <div className="flex flex-col items-center justify-center py-10 gap-8">
        <div className="relative w-64 h-64 flex items-center justify-center rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 shadow-[inset_0_0_50px_rgba(0,0,0,0.05)] border-4 border-background dark:border-slate-900">
          <div className="absolute inset-0 rounded-full border-[12px] border-primary/20" />
          <div className="absolute inset-0 rounded-full border-[12px] border-primary border-t-transparent border-r-transparent rotate-45" />
          <div className="flex flex-col items-center">
            <span className="text-6xl font-bold tracking-tighter tabular-nums">25:00</span>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-2">Ready</span>
          </div>
        </div>
        
        <Button size="lg" className="rounded-full h-16 px-12 text-lg shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-3">
          <Play className="w-6 h-6 fill-current" /> Start Session
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center mb-1">
              <Timer className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Total Time</p>
            <p className="text-2xl font-bold">{mockFocus.todayTotal}</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-1">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Sessions</p>
            <p className="text-2xl font-bold">{mockFocus.sessions}</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">Upcoming Session</h3>
        </div>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold leading-none mb-1.5">{mockFocus.upcoming.title}</p>
              <p className="text-sm text-muted-foreground">{mockFocus.upcoming.time} • {mockFocus.upcoming.duration}</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full">Prepare</Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
