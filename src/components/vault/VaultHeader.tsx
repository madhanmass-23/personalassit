"use client";

import { Button } from "@/components/ui/button";
import { Plus, Lock, ShieldCheck } from "lucide-react";

interface VaultHeaderProps {
  onAddClick: () => void;
  onLockClick: () => void;
}

export function VaultHeader({ onAddClick, onLockClick }: VaultHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Secure Vault
          </h1>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Unlocked
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Zero-knowledge confidential storage for passwords and secrets.
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        <Button
          variant="outline"
          onClick={onLockClick}
          className="rounded-xl h-11 px-4 gap-2 text-xs font-semibold hover:bg-secondary border-border min-h-[44px]"
        >
          <Lock className="w-4 h-4 text-muted-foreground" />
          <span>Lock Vault</span>
        </Button>

        <Button
          onClick={onAddClick}
          className="rounded-xl h-11 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-semibold flex items-center gap-2 min-h-[44px]"
        >
          <Plus className="w-5 h-5" />
          <span>Add Secret</span>
        </Button>
      </div>
    </header>
  );
}
