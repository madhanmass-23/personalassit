"use client";

import { useState } from "react";
import { DecryptedVaultEntry } from "@/services/api/vault";
import { Button } from "@/components/ui/button";
import {
  X,
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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const safeUrl = entry.url ? getSafeUrl(entry.url) : null;

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

  const secretValue = entry.password || entry.secret || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6 text-left">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                {entry.title}
              </h2>
              {entry.category && (
                <span className="text-xs uppercase font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {entry.category}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Decrypted client-side from authenticated AES-256-GCM ciphertext.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close details"
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Secret Attributes */}
        <div className="space-y-4">
          {/* Username / Email */}
          {entry.username && (
            <div className="p-3.5 rounded-2xl border border-border/70 bg-secondary/30 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Username / Email
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm text-foreground select-all break-all">
                  {entry.username}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(entry.username!, "username")}
                  aria-label="Copy username"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0"
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

          {/* Password / Secret */}
          {secretValue && (
            <div className="p-3.5 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> Password / Secret
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {secretValue.length} chars
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm text-foreground select-all break-all font-medium tracking-wide">
                  {showSecret ? secretValue : "••••••••••••••••"}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    aria-label={showSecret ? "Hide password" : "Show password"}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(secretValue, "secret")}
                    aria-label="Copy secret"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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

          {/* Website URL */}
          {entry.url && (
            <div className="p-3.5 rounded-2xl border border-border/70 bg-secondary/30 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Website URL
              </span>
              <div className="flex items-center justify-between gap-2">
                {safeUrl ? (
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline font-mono truncate flex items-center gap-1.5"
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
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0"
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

          {/* Notes / Recovery codes */}
          {entry.notes && (
            <div className="p-3.5 rounded-2xl border border-border/70 bg-secondary/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Notes & Recovery Codes
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(entry.notes!, "notes")}
                  aria-label="Copy notes"
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {copiedField === "notes" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-foreground font-mono whitespace-pre-wrap select-all leading-relaxed max-h-40 overflow-y-auto">
                {entry.notes}
              </p>
            </div>
          )}

          {/* Metadata Timestamps */}
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Created: {new Date(entry.created_at).toLocaleDateString()}
            </span>
            {entry.updated_at && (
              <span>Updated: {new Date(entry.updated_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-border">
          <Button
            variant="destructive"
            onClick={() => {
              onClose();
              onDelete(entry);
            }}
            className="rounded-xl h-11 px-4 text-xs font-semibold gap-2 min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-11 px-4 text-xs font-medium min-h-[44px]"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                onClose();
                onEdit(entry);
              }}
              className="rounded-xl h-11 px-5 text-xs font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px]"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Secret</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
