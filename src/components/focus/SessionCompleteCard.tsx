"use client";

import { motion } from "framer-motion";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionCompleteCardProps {
  durationMinutes: number;
  mode: string;
  onDone: () => void;
  onStartAnother: () => void;
}

export function SessionCompleteCard({
  durationMinutes,
  mode,
  onDone,
  onStartAnother,
}: SessionCompleteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center p-8 sm:p-10 rounded-3xl border border-primary/20 bg-gradient-to-b from-card via-card to-primary/5 shadow-xl max-w-md mx-auto w-full space-y-5"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-xs">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Focus session complete 🎉
        </h2>
        <p className="text-base text-muted-foreground font-medium">
          <span className="font-bold text-foreground">{durationMinutes} minute{durationMinutes === 1 ? "" : "s"}</span> focused in <span className="capitalize font-semibold text-primary">{mode}</span> mode.
        </p>
        <p className="text-xs text-muted-foreground/80 pt-1">
          Great job staying with it. Take a short breather!
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2 w-full">
        <Button
          variant="outline"
          onClick={onDone}
          className="flex-1 rounded-xl h-11 border-border/80 font-semibold cursor-pointer"
        >
          Done
        </Button>
        <Button
          onClick={onStartAnother}
          className="flex-1 rounded-xl h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> Start Another
        </Button>
      </div>
    </motion.div>
  );
}
