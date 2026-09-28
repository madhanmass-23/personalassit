"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Timer,
  Target,
  Sparkles,
  Flame,
  AlertCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  focusSessionService,
  FocusMode,
  FocusSessionItem,
} from "@/services/api/focusSession";
import { FocusModeSelector } from "@/components/focus/FocusModeSelector";
import { DurationSelector } from "@/components/focus/DurationSelector";
import { ActiveTimer } from "@/components/focus/ActiveTimer";
import { EndSessionDialog } from "@/components/focus/EndSessionDialog";
import { SessionCompleteCard } from "@/components/focus/SessionCompleteCard";
import { FocusSkeleton } from "@/components/focus/FocusSkeleton";

type SessionState = "setup" | "active" | "completed";

function formatSessionDate(dateStr: string): string {
  try {
    const date = new Date(dateStr.replace(" ", "T"));
    if (isNaN(date.getTime())) return dateStr;

    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) {
      return `Today · ${timeStr}`;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return `Yesterday · ${timeStr}`;
    }

    return `${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} · ${timeStr}`;
  } catch {
    return dateStr;
  }
}

function formatDurationDisplay(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins === 0 && seconds > 0) {
    return `${seconds} sec`;
  }
  return `${mins} min`;
}

export default function FocusPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<FocusSessionItem[]>([]);

  // Session configuration state
  const [sessionState, setSessionState] = useState<SessionState>("setup");
  const [selectedMode, setSelectedMode] = useState<FocusMode>("focus");
  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);

  // Active session tracking state
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [activeSessionStartTime, setActiveSessionStartTime] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // End Session Dialog & Completion state
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [pendingElapsedSeconds, setPendingElapsedSeconds] = useState(0);
  const [lastCompletedMinutes, setLastCompletedMinutes] = useState(25);

  // Load session history from real backend API
  const fetchSessions = useCallback(async () => {
    try {
      setError(null);
      const data = await focusSessionService.getAll();
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setError("Couldn't load your focus history. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Today's summary calculations (100% deterministic from real data)
  const todayStr = useMemo(() => new Date().toLocaleDateString("en-CA"), []);

  const todaySessions = useMemo(() => {
    return sessions.filter(
      (s) => s.started_at && s.started_at.startsWith(todayStr)
    );
  }, [sessions, todayStr]);

  const todayTotalSeconds = useMemo(() => {
    return todaySessions.reduce(
      (acc, s) => acc + (Number(s.duration_seconds) || 0),
      0
    );
  }, [todaySessions]);

  const allTimeTotalSeconds = useMemo(() => {
    return sessions.reduce(
      (acc, s) => acc + (Number(s.duration_seconds) || 0),
      0
    );
  }, [sessions]);

  const formattedTodayTotal = useMemo(() => {
    const hours = Math.floor(todayTotalSeconds / 3600);
    const mins = Math.floor((todayTotalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, [todayTotalSeconds]);

  const formattedAllTimeTotal = useMemo(() => {
    const hours = Math.floor(allTimeTotalSeconds / 3600);
    const mins = Math.floor((allTimeTotalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, [allTimeTotalSeconds]);

  // Play gentle completion chime via Web Audio API
  const playCompletionChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.85);
    } catch {
      // Audio playback fails silently if restricted by browser policy
    }
  };

  // Start Focus Session: creates real session in backend
  const handleStartFocus = async () => {
    try {
      setActionLoading(true);
      setError(null);

      const nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");
      const newSession = await focusSessionService.create({
        started_at: nowStr,
        duration_seconds: selectedMinutes * 60,
        mode: selectedMode,
      });

      setActiveSessionId(newSession.id);
      setActiveSessionStartTime(nowStr);
      setSessionState("active");
    } catch {
      setError("Couldn't start your focus session. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Timer complete handler (natural finish at 00:00)
  const handleTimerComplete = async () => {
    playCompletionChime();
    setLastCompletedMinutes(selectedMinutes);
    setSessionState("completed");

    if (activeSessionId) {
      try {
        const nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");
        await focusSessionService.update(activeSessionId, {
          ended_at: nowStr,
          duration_seconds: selectedMinutes * 60,
        });
        fetchSessions();
      } catch {
        // Session logged locally, refresh anyway
        fetchSessions();
      }
    }
  };

  // Request End Session from ActiveTimer (triggers confirmation dialog)
  const handleRequestEnd = (actualElapsedSeconds: number) => {
    setPendingElapsedSeconds(actualElapsedSeconds);
    setIsEndDialogOpen(true);
  };

  // Confirmed End Session handler
  const handleConfirmEndSession = async () => {
    const elapsed = Math.max(0, pendingElapsedSeconds);
    setSessionState("setup");

    if (activeSessionId) {
      try {
        const nowStr = new Date().toISOString().slice(0, 19).replace("T", " ");
        await focusSessionService.update(activeSessionId, {
          ended_at: nowStr,
          duration_seconds: elapsed,
        });
        fetchSessions();
      } catch {
        fetchSessions();
      } finally {
        setActiveSessionId(null);
        setActiveSessionStartTime(null);
      }
    }
  };

  // Handlers for Session Completion card
  const handleCompletionDone = () => {
    setSessionState("setup");
    setActiveSessionId(null);
    setActiveSessionStartTime(null);
    fetchSessions();
  };

  const handleStartAnother = () => {
    setSessionState("setup");
    setActiveSessionId(null);
    setActiveSessionStartTime(null);
    fetchSessions();
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-16 max-w-xl mx-auto w-full">
      {/* Top Navigation & Header */}
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-3 pt-1"
      >
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg py-1 px-1.5 -ml-1.5"
            aria-label="Return to Home Dashboard"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Dashboard</span>
          </Link>

          {sessionState === "active" && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-primary animate-pulse">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Session in progress
            </span>
          )}
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Focus
          </h1>
          <p className="text-sm text-muted-foreground">
            Protect your time and concentrate on what matters.
          </p>
        </div>
      </motion.header>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
          role="alert"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            className="rounded-xl h-8 px-3 text-xs border-destructive/30 hover:bg-destructive/10 text-destructive font-semibold"
          >
            Try again
          </Button>
        </motion.div>
      )}

      {/* Main Focus Experience */}
      {loading ? (
        <FocusSkeleton />
      ) : (
        <div className="space-y-8">
          {/* Main Interactive Stage */}
          <section aria-label="Focus Session Controls" className="w-full">
            <AnimatePresence mode="wait">
              {sessionState === "active" ? (
                /* ACTIVE TIMER VIEW */
                <motion.div
                  key="active-timer"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-3xl border bg-card/90 dark:bg-card/40 p-6 sm:p-8 shadow-sm"
                >
                  <ActiveTimer
                    totalSeconds={selectedMinutes * 60}
                    mode={selectedMode}
                    onComplete={handleTimerComplete}
                    onRequestEnd={handleRequestEnd}
                  />
                </motion.div>
              ) : sessionState === "completed" ? (
                /* SESSION COMPLETE CELEBRATION VIEW */
                <motion.div
                  key="completed-session"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <SessionCompleteCard
                    durationMinutes={lastCompletedMinutes}
                    mode={selectedMode}
                    onDone={handleCompletionDone}
                    onStartAnother={handleStartAnother}
                  />
                </motion.div>
              ) : (
                /* SETUP / READY VIEW */
                <motion.div
                  key="setup-focus"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-3xl border bg-card/90 dark:bg-card/40 p-6 sm:p-7 shadow-sm space-y-6"
                >
                  {/* Mode Selector */}
                  <FocusModeSelector
                    selectedMode={selectedMode}
                    onSelectMode={setSelectedMode}
                    disabled={actionLoading}
                  />

                  {/* Duration Selector */}
                  <DurationSelector
                    selectedMinutes={selectedMinutes}
                    onSelectMinutes={setSelectedMinutes}
                    disabled={actionLoading}
                  />

                  {/* Summary Preview & Start Button */}
                  <div className="pt-2 border-t border-border/60 flex flex-col gap-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Ready to focus:</span>
                      <span className="font-semibold text-foreground capitalize">
                        {selectedMode} mode · {selectedMinutes} min
                      </span>
                    </div>

                    <Button
                      onClick={handleStartFocus}
                      disabled={actionLoading}
                      size="lg"
                      className="w-full h-13 rounded-2xl text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-2 cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>{actionLoading ? "Starting..." : "Start Focus"}</span>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Today's Focus Summary (Real Backend Metrics) */}
          <section aria-label="Today's Focus Summary" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-foreground uppercase tracking-wider text-[11px]">
                Today&apos;s Focus
              </h2>
              {todaySessions.length > 0 && (
                <Badge variant="secondary" size="sm">
                  {todaySessions.length} session{todaySessions.length === 1 ? "" : "s"}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Card className="rounded-2xl border bg-card/80 dark:bg-card/40 shadow-xs">
                <CardContent className="p-4 sm:p-5 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Today&apos;s Focus
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-0.5">
                      {todayTotalSeconds > 0 ? formattedTodayTotal : "0m"}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {todayTotalSeconds > 0
                      ? `${todaySessions.length} session${todaySessions.length === 1 ? "" : "s"} completed`
                      : "No focus sessions today"}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-card/80 dark:bg-card/40 shadow-xs">
                <CardContent className="p-4 sm:p-5 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Total Focus Time
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-0.5">
                      {allTimeTotalSeconds > 0 ? formattedAllTimeTotal : "0m"}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {sessions.length > 0
                      ? `Across ${sessions.length} recorded session${sessions.length === 1 ? "" : "s"}`
                      : "Start your first session"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Recent Sessions (Real Backend Data) */}
          <section aria-label="Recent Focus Sessions" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-foreground uppercase tracking-wider text-[11px]">
                Recent Sessions
              </h2>
            </div>

            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-border/80 bg-card/50 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Your focus history will appear here.
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    You haven&apos;t started a focus session today. Choose your mode and duration above to get started.
                  </p>
                </div>
                {sessionState !== "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="rounded-xl text-xs mt-1"
                  >
                    Start Focus
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border bg-card/80 dark:bg-card/40 divide-y divide-border/60 overflow-hidden shadow-xs">
                {sessions.slice(0, 5).map((s) => {
                  const modeBadgeVariant =
                    s.mode === "strict"
                      ? "danger"
                      : s.mode === "focus"
                      ? "default"
                      : "secondary";

                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 p-3.5 sm:p-4 hover:bg-secondary/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Target className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground capitalize truncate">
                              {s.mode || "Focus"}
                            </span>
                            <Badge
                              variant={modeBadgeVariant}
                              size="sm"
                              className="uppercase tracking-wider text-[10px]"
                            >
                              {s.mode}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatSessionDate(s.started_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-sm font-bold text-foreground">
                          {formatDurationDisplay(s.duration_seconds)}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3 inline" />
                          {s.ended_at ? "Completed" : "Logged"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Confirmation Dialog for Early Ending */}
      <EndSessionDialog
        isOpen={isEndDialogOpen}
        onClose={() => setIsEndDialogOpen(false)}
        onConfirm={handleConfirmEndSession}
      />
    </div>
  );
}
