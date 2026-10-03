"use client";

import { useState, useEffect } from "react";
import { DecryptedVaultEntry } from "@/services/api/vault";
import { Button } from "@/components/ui/button";
import { getCategoryIcon } from "./VaultEntryCard";
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Globe,
  ExternalLink,
  Edit2,
  Trash2,
  KeyRound,
  FileText,
  User,
  Calendar,
  ArrowLeft,
  ShieldCheck,
  Clock,
} from "lucide-react";

interface VaultEntryDetailProps {
  entry: DecryptedVaultEntry;
  onClose: () => void;
  onEdit: (entry: DecryptedVaultEntry) => void;
  onDelete: (entry: DecryptedVaultEntry) => void;
}

function getSafeUrl(rawUrl: string): string | null {
  try {
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(candidate);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

export function VaultEntryDetail({
  entry,
  onClose,
  onEdit,
  onDelete,
}: VaultEntryDetailProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [autoMaskSeconds, setAutoMaskSeconds] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const safeUrl = entry.url ? getSafeUrl(entry.url) : null;
  const secretValue = entry.password || entry.secret || "";

  // Auto-remask secret after 15 seconds of visibility
  useEffect(() => {
    if (!showSecret) return;

    const interval = setInterval(() => {
      setAutoMaskSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setShowSecret(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showSecret]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  const handleToggleSecret = () => {
    if (showSecret) {
      setShowSecret(false);
      setAutoMaskSeconds(null);
    } else {
      setShowSecret(true);
      setAutoMaskSeconds(15);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto py-2 px-1 space-y-5 animate-in fade-in">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground active:scale-95 transition-all py-1.5 px-2 rounded-xl hover:bg-secondary min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Passwords</span>
        </button>

        <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium bg-secondary/70 px-2.5 py-1 rounded-full border border-border/50">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          Private Locker
        </span>
      </div>

      {/* Header Card */}
      <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center gap-3.5">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0">
          {getCategoryIcon(entry.category)}
        </div>
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              {entry.title}
            </h2>
            {entry.category && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {entry.category}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Zero-knowledge encrypted secret
          </p>
        </div>
      </div>

      {/* Secret Detail Fields */}
      <div className="space-y-3.5">
        {/* Username / ID */}
        {entry.username && (
          <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-1.5 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Username / ID
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm text-foreground select-all break-all font-medium">
                {entry.username}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(entry.username!, "username")}
                aria-label="Copy username"
                title="Copy Username"
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                {copiedField === "username" ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Password / PIN / Secret */}
        {secretValue && (
          <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> Password / PIN / Secret
              </span>
              {showSecret && autoMaskSeconds !== null && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <Clock className="w-3 h-3 animate-pulse" />
                  Auto-masks in {autoMaskSeconds}s
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-base text-foreground select-all break-all font-semibold tracking-wider">
                {showSecret ? secretValue : "••••••••••••••••"}
              </span>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleSecret}
                  aria-label={showSecret ? "Hide secret" : "Show secret"}
                  title={showSecret ? "Hide Secret" : "Show Secret"}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => copyToClipboard(secretValue, "secret")}
                  aria-label="Copy secret"
                  title="Copy Secret"
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  {copiedField === "secret" ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Website / App URL */}
        {entry.url && (
          <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-1.5 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Website / App
            </span>
            <div className="flex items-center justify-between gap-2">
              {safeUrl ? (
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline font-mono truncate flex items-center gap-1.5 font-medium"
                >
                  <span className="truncate">{entry.url}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              ) : (
                <span className="text-sm text-foreground font-mono truncate">
                  {entry.url}
                </span>
              )}
              <button
                type="button"
                onClick={() => copyToClipboard(entry.url!, "url")}
                aria-label="Copy URL"
                title="Copy URL"
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                {copiedField === "url" ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Notes */}
        {entry.notes && (
          <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Notes
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(entry.notes!, "notes")}
                aria-label="Copy notes"
                title="Copy Notes"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all"
              >
                {copiedField === "notes" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-xs text-foreground font-mono whitespace-pre-wrap select-all leading-relaxed max-h-48 overflow-y-auto bg-secondary/30 p-3 rounded-xl border border-border/50">
              {entry.notes}
            </p>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70 px-1 pt-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Created {new Date(entry.created_at).toLocaleDateString()}
          </span>
          {entry.updated_at && (
            <span>• Updated {new Date(entry.updated_at).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* Action Buttons: Edit & Delete */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/70">
        <Button
          type="button"
          variant="outline"
          onClick={() => onDelete(entry)}
          className="rounded-2xl h-12 px-5 text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 min-h-[48px] flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </Button>

        <Button
          type="button"
          onClick={() => onEdit(entry)}
          className="rounded-2xl h-12 px-6 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md min-h-[48px] flex items-center gap-2 flex-1 sm:flex-none justify-center"
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit Secret</span>
        </Button>
      </div>
    </div>
  );
}
