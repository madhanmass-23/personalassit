"use client";

import { useState } from "react";
import { DecryptedVaultEntry } from "@/services/api/vault";
import {
  KeyRound,
  Copy,
  Check,
  Globe,
  Mail,
  Wifi,
  CreditCard,
  Share2,
  Shield,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

interface VaultEntryCardProps {
  entry: DecryptedVaultEntry;
  onView: (entry: DecryptedVaultEntry) => void;
  onEdit?: (entry: DecryptedVaultEntry) => void;
  onDelete?: (entry: DecryptedVaultEntry) => void;
}

export function getCategoryIcon(category?: string) {
  const cat = category?.toLowerCase().trim();
  switch (cat) {
    case "login":
      return <KeyRound className="w-4 h-4" />;
    case "banking / upi":
    case "banking":
    case "upi":
    case "finance":
      return <CreditCard className="w-4 h-4" />;
    case "social media":
    case "social":
      return <Share2 className="w-4 h-4" />;
    case "wi-fi":
    case "wifi":
      return <Wifi className="w-4 h-4" />;
    case "email":
      return <Mail className="w-4 h-4" />;
    case "card":
      return <CreditCard className="w-4 h-4" />;
    default:
      return <Shield className="w-4 h-4" />;
  }
}

export function VaultEntryCard({
  entry,
  onView,
  onEdit,
  onDelete,
}: VaultEntryCardProps) {
  const [copied, setCopied] = useState(false);

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
      className="group p-4 rounded-2xl border border-border/80 bg-card hover:bg-accent/40 active:scale-[0.99] transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md flex items-center justify-between gap-3 select-none w-full"
    >
      {/* Left: Category Icon, Service Name, Username, Masked Password */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5 sm:mt-0">
          {getCategoryIcon(entry.category)}
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          {/* Service Name & Category */}
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

          {/* Username / ID */}
          {entry.username && (
            <p className="text-xs text-muted-foreground truncate font-mono">
              {entry.username}
            </p>
          )}

          {/* Masked Secret: Never displayed in plaintext in the list */}
          <div className="flex items-center gap-2">
            <span className="font-mono tracking-widest text-muted-foreground/70 text-xs select-none">
              ••••••••••
            </span>
            {entry.url && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground/60 truncate">
                <Globe className="w-3 h-3 shrink-0" />
                <span className="truncate">{entry.url.replace(/^https?:\/\//, "")}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Quick Copy and View Action */}
      <div className="flex items-center justify-end gap-1.5 shrink-0">
        {(entry.password || entry.secret) && (
          <button
            type="button"
            onClick={handleCopyPassword}
            aria-label={`Copy password for ${entry.title}`}
            title="Copy Password"
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-border/70 bg-secondary/60 hover:bg-secondary active:bg-secondary/90 text-xs font-medium text-foreground transition-colors min-h-[40px] min-w-[40px]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold text-[11px] hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="hidden sm:inline text-[11px]">Copy</span>
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
          className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </div>
    </motion.div>
  );
}
