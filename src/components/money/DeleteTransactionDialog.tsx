"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteTransactionDialogProps {
  isOpen: boolean;
  type: "expense" | "income";
  description: string;
  amount: number | string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteTransactionDialog({
  isOpen,
  type,
  description,
  amount,
  onClose,
  onConfirm,
}: DeleteTransactionDialogProps) {
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
      aria-labelledby="delete-trans-title"
      aria-describedby="delete-trans-desc"
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
            <h3 id="delete-trans-title" className="text-base font-semibold text-foreground">
              Delete {type === "expense" ? "expense" : "income"}?
            </h3>
            <p id="delete-trans-desc" className="text-sm text-muted-foreground">
              This transaction will be permanently removed.
            </p>
          </div>
        </div>

        {description && (
          <div className="rounded-xl bg-secondary/50 p-3 text-xs text-foreground/80 font-medium flex items-center justify-between border border-border/50">
            <span className="truncate max-w-[200px]">&ldquo;{description}&rdquo;</span>
            <span className="font-bold text-foreground">
              ₹{Number(amount).toLocaleString("en-IN")}
            </span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl px-4 min-h-[40px] cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-xl px-4 min-h-[40px] flex items-center gap-1.5 cursor-pointer"
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
