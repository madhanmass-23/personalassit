"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { vaultService } from "@/services/api/vault";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteVaultEntryDialogProps {
  isOpen: boolean;
  entryId: string | null;
  entryTitle: string;
  onClose: () => void;
  onDeleted: (entryId: string) => void;
}

export function DeleteVaultEntryDialog({
  isOpen,
  entryId,
  entryTitle,
  onClose,
  onDeleted,
}: DeleteVaultEntryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !entryId) return null;

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      await vaultService.deleteVaultEntry(entryId);
      onDeleted(entryId);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to delete vault entry:", err);
      setError("Failed to delete entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 text-left">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-destructive/10 text-destructive shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Delete &ldquo;{entryTitle}&rdquo;?
            </h3>
            <p className="text-xs text-muted-foreground">Permanent deletion</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          This encrypted vault entry will be permanently deleted from the database. This action cannot be undone.
        </p>

        {error && (
          <p className="text-xs text-destructive bg-destructive/5 p-2.5 rounded-xl border border-destructive/20">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl h-10 px-4 text-xs font-medium min-h-[40px]"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={loading}
            className="rounded-xl h-10 px-5 text-xs font-semibold gap-2 min-h-[40px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Secret</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
