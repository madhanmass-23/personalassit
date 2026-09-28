"use client";

import { Sparkles, Brain, ShieldAlert } from "lucide-react";
import { FocusMode } from "@/services/api/focusSession";
import { cn } from "@/lib/utils";

interface FocusModeSelectorProps {
  selectedMode: FocusMode;
  onSelectMode: (mode: FocusMode) => void;
  disabled?: boolean;
}

const MODES: {
  id: FocusMode;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Brain;
}[] = [
  {
    id: "normal",
    title: "Normal",
    subtitle: "Flexible focus",
    description: "Gentle pacing with natural breaks whenever you need.",
    icon: Sparkles,
  },
  {
    id: "focus",
    title: "Focus",
    subtitle: "Deep work",
    description: "Stay focused for the session with uninterrupted rhythm.",
    icon: Brain,
  },
  {
    id: "strict",
    title: "Strict",
    subtitle: "Minimal interruptions",
    description: "Pure concentration view to protect your headspace.",
    icon: ShieldAlert,
  },
];

export function FocusModeSelector({
  selectedMode,
  onSelectMode,
  disabled = false,
}: FocusModeSelectorProps) {
  return (
    <div className="space-y-2.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Focus Mode
        </label>
        <span className="text-[11px] text-muted-foreground">
          Choose your concentration style
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Focus mode selection"
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
      >
        {MODES.map((m) => {
          const isSelected = selectedMode === m.id;
          const Icon = m.icon;

          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelectMode(m.id)}
              className={cn(
                "relative flex flex-col items-start p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer min-h-[92px] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isSelected
                  ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-xs"
                  : "border-border/70 bg-card hover:border-border hover:bg-secondary/40"
              )}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span
                  className={cn(
                    "p-1.5 rounded-xl transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </span>
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>

              <span className="text-sm font-semibold text-foreground">
                {m.title}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                {m.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
