"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskDeleteDialogProps {
  isOpen: boolean;
  taskTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function TaskDeleteDialog({
  isOpen,
  taskTitle,
  onClose,
  onConfirm,
}: TaskDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
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
            <h3 id="delete-dialog-title" className="text-base font-semibold text-foreground">
              Delete task?
            </h3>
            <p id="delete-dialog-desc" className="text-sm text-muted-foreground">
              This task will be permanently removed.
            </p>
          </div>
        </div>

        {taskTitle && (
          <div className="rounded-lg bg-secondary/50 p-2.5 text-xs text-foreground/80 font-medium truncate border border-border/50">
            &ldquo;{taskTitle}&rdquo;
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl px-4 min-h-[40px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-xl px-4 min-h-[40px] flex items-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
