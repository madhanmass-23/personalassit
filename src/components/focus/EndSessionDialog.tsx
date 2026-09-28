"use client";

import { AlertTriangle, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EndSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function EndSessionDialog({
  isOpen,
  onClose,
  onConfirm,
}: EndSessionDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-session-title"
      aria-describedby="end-session-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 id="end-session-title" className="text-base font-semibold text-foreground">
              End focus session?
            </h3>
            <p id="end-session-desc" className="text-sm text-muted-foreground">
              Your current session will be stopped and partial focus time will be saved.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl px-4 min-h-[40px] cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-xl px-4 min-h-[40px] flex items-center gap-1.5 cursor-pointer"
          >
            <Square className="w-4 h-4 fill-current" />
            End Session
          </Button>
        </div>
      </div>
    </div>
  );
}
