"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DurationSelectorProps {
  selectedMinutes: number;
  onSelectMinutes: (minutes: number) => void;
  disabled?: boolean;
}

const PRESETS = [15, 25, 45, 60];

export function DurationSelector({
  selectedMinutes,
  onSelectMinutes,
  disabled = false,
}: DurationSelectorProps) {
  const [isCustom, setIsCustom] = useState(
    !PRESETS.includes(selectedMinutes)
  );
  const [customInput, setCustomInput] = useState(
    !PRESETS.includes(selectedMinutes) ? String(selectedMinutes) : "30"
  );

  const handleSelectPreset = (m: number) => {
    setIsCustom(false);
    onSelectMinutes(m);
  };

  const handleCustomChange = (val: string) => {
    setCustomInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 180) {
      onSelectMinutes(parsed);
    }
  };

  return (
    <div className="space-y-2.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Session Duration
        </label>
        <span className="text-xs font-semibold text-primary">
          {selectedMinutes} minutes
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {PRESETS.map((minutes) => {
          const isSelected = !isCustom && selectedMinutes === minutes;
          return (
            <button
              key={minutes}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectPreset(minutes)}
              className={cn(
                "flex-1 min-w-[70px] py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all select-none min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card border-border/70 text-foreground hover:bg-secondary/60 hover:border-border"
              )}
            >
              {minutes}m
            </button>
          );
        })}

        {/* Custom Duration Button / Input */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setIsCustom(true);
            const parsed = parseInt(customInput, 10) || 30;
            onSelectMinutes(parsed);
          }}
          className={cn(
            "flex-1 min-w-[70px] py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all select-none min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            isCustom
              ? "bg-primary text-primary-foreground border-primary shadow-xs"
              : "bg-card border-border/70 text-foreground hover:bg-secondary/60 hover:border-border"
          )}
        >
          Custom
        </button>
      </div>

      {isCustom && (
        <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
          <input
            type="number"
            min="1"
            max="180"
            disabled={disabled}
            value={customInput}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="Minutes"
            className="w-24 px-3 py-2 rounded-xl border border-input bg-card text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/60 shadow-xs"
          />
          <span className="text-xs text-muted-foreground">
            minutes (between 1 and 180 min)
          </span>
        </div>
      )}
    </div>
  );
}
