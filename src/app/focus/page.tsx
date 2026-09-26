"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Timer, Target, Square } from "lucide-react";
import { focusSessionService } from "@/services/api/focusSession";

export default function FocusPage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await focusSessionService.getAll();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const toggleTimer = async () => {
    if (isTimerRunning) {
      // Stop and save
      setIsTimerRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      
      const durationSeconds = (25 * 60) - timeLeft;
      
      if (durationSeconds > 10 && sessionStartTime) {
        // Save to backend
        try {
          await focusSessionService.create({
            started_at: sessionStartTime,
            ended_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            duration_seconds: durationSeconds,
            mode: 'focus'
          });
          fetchSessions();
        } catch (err) {
          console.error("Failed to save focus session", err);
        }
      }
      
      setTimeLeft(25 * 60);
      setSessionStartTime(null);
    } else {
      // Start
      setIsTimerRunning(true);
      setSessionStartTime(new Date().toISOString().slice(0, 19).replace('T', ' '));
      
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            // could auto save here, but let's keep it simple
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };
  
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const todayStr = new Date().toLocaleDateString('en-CA');
  const todaySessions = sessions.filter(s => s.started_at && s.started_at.startsWith(todayStr));
  const todayTotalSeconds = todaySessions.reduce((acc, curr) => acc + (parseInt(curr.duration_seconds) || 0), 0);
  
  const formattedTodayTotal = todayTotalSeconds > 3600 
    ? `${Math.floor(todayTotalSeconds / 3600)}h ${Math.floor((todayTotalSeconds % 3600) / 60)}m`
    : `${Math.floor(todayTotalSeconds / 60)}m`;

  return (
    <div className="flex flex-col gap-6 p-6 pt-safe pb-24 min-h-screen-safe">
      <header className="flex items-center justify-between mt-4">
        <h1 className="text-3xl font-bold tracking-tight">Focus</h1>
      </header>

      {/* Timer Section */}
      <div className="flex flex-col items-center justify-center py-10 gap-8">
        <div className="relative w-64 h-64 flex items-center justify-center rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 shadow-[inset_0_0_50px_rgba(0,0,0,0.05)] border-4 border-background dark:border-slate-900">
          <div className="absolute inset-0 rounded-full border-[12px] border-primary/20" />
          {isTimerRunning && (
            <div className="absolute inset-0 rounded-full border-[12px] border-primary border-t-transparent border-r-transparent animate-spin" style={{ animationDuration: '3s' }} />
          )}
          <div className="flex flex-col items-center z-10">
            <span className="text-6xl font-bold tracking-tighter tabular-nums">{formatTime(timeLeft)}</span>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-2">
              {isTimerRunning ? 'Focusing' : 'Ready'}
            </span>
          </div>
        </div>
        
        <Button 
          onClick={toggleTimer}
          size="lg" 
          variant={isTimerRunning ? "destructive" : "default"}
          className={`rounded-full h-16 px-12 text-lg shadow-xl ${!isTimerRunning ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''} gap-3`}
        >
          {isTimerRunning ? (
            <><Square className="w-6 h-6 fill-current" /> Stop</>
          ) : (
            <><Play className="w-6 h-6 fill-current" /> Start Session</>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center mb-1">
              <Timer className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Today&apos;s Focus</p>
            <p className="text-2xl font-bold">{formattedTodayTotal}</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-1">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Sessions Today</p>
            <p className="text-2xl font-bold">{todaySessions.length}</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">Recent Sessions</h3>
        </div>
        {sessions.length === 0 && !loading ? (
          <div className="text-center text-muted-foreground py-6 bg-card rounded-xl">No focus sessions yet.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.slice(0, 3).map(s => (
              <Card key={s.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold leading-none mb-1.5">{s.mode === 'focus' ? 'Deep Work' : 'Session'}</p>
                    <p className="text-sm text-muted-foreground">{new Date(s.started_at).toLocaleDateString()}</p>
                  </div>
                  <div className="font-medium text-lg">
                    {Math.round(parseInt(s.duration_seconds) / 60)}m
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
