"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Play, Pause, Square, Sparkles, Brain, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FocusMode } from "@/services/api/focusSession";
import { cn } from "@/lib/utils";

interface ActiveTimerProps {
  totalSeconds: number;
  mode: FocusMode;
  onComplete: () => void;
  onRequestEnd: (actualElapsedSeconds: number) => void;
}

export function ActiveTimer({
  totalSeconds,
  mode,
  onComplete,
  onRequestEnd,
}: ActiveTimerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);

  // High precision target timestamp (initialized in effect to preserve component purity)
  const targetTimeRef = useRef<number | null>(null);
  const pausedRemainingMsRef = useRef<number>(totalSeconds * 1000);
  const isCompletedRef = useRef<boolean>(false);

  useEffect(() => {
    if (targetTimeRef.current === null) {
      targetTimeRef.current = Date.now() + totalSeconds * 1000;
    }
  }, [totalSeconds]);

  // Compute formatted MM:SS or HH:MM:SS
  const formatTime = (secs: number) => {
    const totalSec = Math.max(0, secs);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Check and update timer
  const updateTimer = useCallback(() => {
    if (isPaused || isCompletedRef.current || targetTimeRef.current === null) return;

    const now = Date.now();
    const diffMs = targetTimeRef.current - now;

    if (diffMs <= 0) {
      isCompletedRef.current = true;
      setRemainingSeconds(0);
      onComplete();
    } else {
      setRemainingSeconds(Math.ceil(diffMs / 1000));
    }
  }, [isPaused, onComplete]);

  // Recalculate accurately on document visibility changes (tab switch, device wake)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [updateTimer]);

  // Periodic interval (every 250ms for smooth, responsive recovery)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      updateTimer();
    }, 250);

    return () => clearInterval(interval);
  }, [isPaused, updateTimer]);

  // Pause / Resume Handlers
  const handleTogglePause = () => {
    if (isPaused) {
      // Resume: Shift targetTime by frozen remaining ms
      targetTimeRef.current = Date.now() + pausedRemainingMsRef.current;
      setIsPaused(false);
    } else {
      // Pause: Freeze remaining ms
      const currentTarget = targetTimeRef.current ?? (Date.now() + remainingSeconds * 1000);
      const remainingMs = Math.max(0, currentTarget - Date.now());
      pausedRemainingMsRef.current = remainingMs;
      setIsPaused(true);
    }
  };

  // End Session Handler
  const handleEnd = () => {
    const elapsed = Math.max(0, totalSeconds - remainingSeconds);
    onRequestEnd(elapsed);
  };

  // Calculate Progress Percent for circular ring
  const progressPercent = totalSeconds > 0
    ? Math.min(100, Math.max(0, ((totalSeconds - remainingSeconds) / totalSeconds) * 100))
    : 0;

  // Mode meta
  const modeLabel =
    mode === "strict" ? "Strict Mode" : mode === "focus" ? "Focus Mode" : "Normal Mode";
  const ModeIcon =
    mode === "strict" ? ShieldAlert : mode === "focus" ? Brain : Sparkles;

  // Circumference for r=118
  const radius = 118;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-8 sm:gap-10 py-4 sm:py-6 max-w-md mx-auto w-full select-none">
      {/* Mode Badge & Encouragement */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border",
            mode === "strict"
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
              : mode === "focus"
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-secondary text-secondary-foreground border-border/50"
          )}
        >
          <ModeIcon className="w-3.5 h-3.5" />
          <span>{modeLabel}</span>
        </span>
        <p className="text-sm text-muted-foreground font-medium">
          {isPaused ? "Session paused" : "Stay with it. Keep your rhythm."}
        </p>
      </div>

      {/* Circular Timer Ring with Big Typography */}
      <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 transform"
          viewBox="0 0 260 260"
        >
          {/* Background Track */}
          <circle
            cx="130"
            cy="130"
            r={radius}
            className="stroke-secondary fill-none"
            strokeWidth="10"
          />
          {/* Active Progress Meter */}
          <circle
            cx="130"
            cy="130"
            r={radius}
            className={cn(
              "fill-none transition-all duration-300 ease-linear",
              mode === "strict" ? "stroke-rose-500" : "stroke-primary"
            )}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* Center Display */}
        <div className="relative flex flex-col items-center justify-center z-10 text-center">
          <span className="text-5xl sm:text-6xl font-extrabold tracking-tighter tabular-nums text-foreground">
            {formatTime(remainingSeconds)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-2">
            {isPaused ? "Paused" : "Remaining"}
          </span>
        </div>
      </div>

      {/* Primary Timer Controls */}
      <div className="flex items-center gap-3 w-full max-w-xs">
        {/* Pause / Resume Button */}
        <Button
          onClick={handleTogglePause}
          size="lg"
          variant="outline"
          className="flex-1 rounded-2xl h-13 text-sm font-semibold border-border/80 gap-2 cursor-pointer shadow-xs"
        >
          {isPaused ? (
            <>
              <Play className="w-4 h-4 fill-current text-primary" />
              <span>Resume</span>
            </>
          ) : (
            <>
              <Pause className="w-4 h-4 fill-current text-foreground" />
              <span>Pause</span>
            </>
          )}
        </Button>

        {/* End Session Button */}
        <Button
          onClick={handleEnd}
          size="lg"
          variant="destructive"
          className="flex-1 rounded-2xl h-13 text-sm font-semibold gap-2 cursor-pointer shadow-xs"
        >
          <Square className="w-4 h-4 fill-current" />
          <span>End Session</span>
        </Button>
      </div>
    </div>
  );
}
