"use client";

import { LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutDialog({
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: LogoutDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={!isLoading ? onClose : undefined}
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
            <h3 id="logout-dialog-title" className="text-base font-semibold text-foreground">
              Log out of your account?
            </h3>
            <p id="logout-dialog-desc" className="text-sm text-muted-foreground">
              You will need to sign in again to access your tasks, expenses, and focus sessions.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-xl px-4 min-h-[40px] cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isLoading}
            onClick={onConfirm}
            className="rounded-xl px-4 min-h-[40px] flex items-center gap-1.5 cursor-pointer font-semibold shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Logging out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
