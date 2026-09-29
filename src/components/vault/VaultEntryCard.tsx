"use client";

import { useState } from "react";
import { DecryptedVaultEntry } from "@/services/api/vault";
import {
  KeyRound,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Check,
  Globe,
  Mail,
  Wifi,
  Briefcase,
  GraduationCap,
  Shield,
  CreditCard,
  Layers,
} from "lucide-react";
import { motion } from "framer-motion";

interface VaultEntryCardProps {
  entry: DecryptedVaultEntry;
  onView: (entry: DecryptedVaultEntry) => void;
  onEdit: (entry: DecryptedVaultEntry) => void;
  onDelete: (entry: DecryptedVaultEntry) => void;
}

export function VaultEntryCard({
  entry,
  onView,
  onEdit,
  onDelete,
}: VaultEntryCardProps) {
  const [copied, setCopied] = useState(false);

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case "login":
        return <KeyRound className="w-4 h-4" />;
      case "finance":
        return <CreditCard className="w-4 h-4" />;
      case "social":
      case "email":
        return <Mail className="w-4 h-4" />;
      case "wi-fi":
        return <Wifi className="w-4 h-4" />;
      case "work":
        return <Briefcase className="w-4 h-4" />;
      case "college":
        return <GraduationCap className="w-4 h-4" />;
      case "personal":
        return <Shield className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  const handleCopyPassword = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const secretToCopy = entry.password || entry.secret;
    if (!secretToCopy) return;

    try {
      await navigator.clipboard.writeText(secretToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      onClick={() => onView(entry)}
      className="group p-4 rounded-2xl border border-border/70 bg-card/60 hover:bg-card/90 dark:bg-card/30 dark:hover:bg-card/60 backdrop-blur-sm transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
    >
      {/* Left: Icon, Title, Username, Category */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0">
          {getCategoryIcon(entry.category)}
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-foreground tracking-tight truncate">
              {entry.title}
            </h3>
            {entry.category && (
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/60">
                {entry.category}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground truncate">
            {entry.username && (
              <span className="truncate font-mono">{entry.username}</span>
            )}
            {entry.url && (
              <span className="flex items-center gap-1 text-[11px] opacity-80 truncate">
                <Globe className="w-3 h-3 shrink-0" />
                <span className="truncate">{entry.url.replace(/^https?:\/\//, "")}</span>
              </span>
            )}
            {/* Masked Password Indication */}
            <span className="font-mono tracking-widest text-muted-foreground/60 text-[11px]">
              ••••••••
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
        {(entry.password || entry.secret) && (
          <button
            type="button"
            onClick={handleCopyPassword}
            aria-label={`Copy password for ${entry.title}`}
            title="Copy Password"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border/70 bg-secondary/50 hover:bg-secondary text-xs font-medium text-foreground transition-colors min-h-[36px]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView(entry);
          }}
          aria-label={`View details for ${entry.title}`}
          title="View Secret"
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
        >
          <Eye className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(entry);
          }}
          aria-label={`Edit ${entry.title}`}
          title="Edit Secret"
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(entry);
          }}
          aria-label={`Delete ${entry.title}`}
          title="Delete Secret"
          className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
