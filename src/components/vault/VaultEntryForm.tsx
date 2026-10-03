"use client";

import { useState, useEffect } from "react";
import { DecryptedVaultEntry, vaultService } from "@/services/api/vault";
import { encryptVaultPayload } from "@/lib/crypto/vault";
import { vaultSession, VaultState } from "@/lib/vault/vaultSession";
import { Button } from "@/components/ui/button";
import { PasswordGenerator } from "./PasswordGenerator";
import { VAULT_CATEGORIES, VaultCategory } from "./VaultSearch";
import {
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  Lock,
} from "lucide-react";

interface VaultEntryFormProps {
  mode: "create" | "edit";
  initialEntry?: DecryptedVaultEntry | null;
  isOpen?: boolean;
  onClose: () => void;
  onSaved: (entry: DecryptedVaultEntry) => void;
  onUnlockRequest?: () => void;
}

export function VaultEntryForm({
  mode,
  initialEntry,
  isOpen = true,
  onClose,
  onSaved,
  onUnlockRequest,
}: VaultEntryFormProps) {
  const [sessionState, setSessionState] = useState<VaultState>(vaultSession.getState());
  const [hasDek, setHasDek] = useState<boolean>(vaultSession.getDek() !== null);

  const [title, setTitle] = useState(initialEntry?.title || "");
  const [category, setCategory] = useState<VaultCategory>(
    (initialEntry?.category as VaultCategory) || "Login"
  );
  const [username, setUsername] = useState(initialEntry?.username || "");
  const [password, setPassword] = useState(initialEntry?.password || initialEntry?.secret || "");
  const [url, setUrl] = useState(initialEntry?.url || "");
  const [notes, setNotes] = useState(initialEntry?.notes || "");

  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to vault session changes and keep active on user interaction
  useEffect(() => {
    vaultSession.touch();

    const unsubscribe = vaultSession.subscribe((state) => {
      setSessionState(state);
      setHasDek(vaultSession.getDek() !== null);
    });

    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  // Session state validation check
  const isUnlocked = sessionState === "UNLOCKED" && hasDek;

  const handleTouch = () => {
    vaultSession.touch();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || loading) return;

    handleTouch();

    const dek = vaultSession.getDek();
    if (!dek || sessionState !== "UNLOCKED") {
      setError("Vault session is locked. Please unlock the vault again.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Assemble clean plaintext payload
      const payload = {
        title: title.trim(),
        username: username.trim() || undefined,
        password: password || undefined,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
        category: category || "Other",
      };

      // 2. Encrypt locally using client-side AES-256-GCM DEK + fresh 96-bit nonce
      const encryptedResult = await encryptVaultPayload(payload, dek, 1);

      let savedEntry: DecryptedVaultEntry;

      if (mode === "create") {
        const res = await vaultService.createVaultEntry({
          encrypted_payload: encryptedResult.encryptedPayload,
          payload_nonce: encryptedResult.nonce,
          payload_version: 1,
        });

        savedEntry = {
          id: res.entry.id,
          vault_id: res.entry.vault_id,
          ...payload,
          created_at: res.entry.created_at,
          updated_at: res.entry.updated_at,
          payload_version: res.entry.payload_version,
        };
      } else if (mode === "edit" && initialEntry) {
        const res = await vaultService.updateVaultEntry(initialEntry.id, {
          encrypted_payload: encryptedResult.encryptedPayload,
          payload_nonce: encryptedResult.nonce,
          payload_version: 1,
        });

        savedEntry = {
          id: res.entry.id,
          vault_id: res.entry.vault_id,
          ...payload,
          created_at: res.entry.created_at,
          updated_at: res.entry.updated_at,
          payload_version: res.entry.payload_version,
        };
      } else {
        throw new Error("Invalid form state");
      }

      // 3. Clear component memory
      setTitle("");
      setUsername("");
      setPassword("");
      setUrl("");
      setNotes("");

      onSaved(savedEntry);
    } catch (err: unknown) {
      console.error("Failed to save vault entry:", err);
      const msg = err instanceof Error ? err.message : "Failed to encrypt and save entry.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // If session is locked, show clear prompt with unlock action instead of failing on submit
  if (!isUnlocked) {
    return (
      <div className="w-full max-w-lg mx-auto py-12 px-4 text-center space-y-5 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold tracking-tight text-foreground">Vault is locked</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Your secure session has locked. Please unlock the vault again to {mode === "create" ? "create" : "edit"} secrets.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl h-11 px-5 min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (onUnlockRequest) {
                onUnlockRequest();
              } else {
                onClose();
              }
            }}
            className="rounded-xl h-11 px-6 font-semibold bg-primary text-primary-foreground min-h-[44px] flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Unlock Vault</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onPointerDown={handleTouch}
      onKeyDown={handleTouch}
      className="w-full max-w-lg mx-auto py-2 px-1 space-y-5 animate-in fade-in"
    >
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground active:scale-95 transition-all py-1.5 px-2 rounded-xl hover:bg-secondary min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium bg-secondary/70 px-2.5 py-1 rounded-full border border-border/50">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          Encrypted with Master Key
        </span>
      </div>

      {/* Form Card */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card shadow-lg space-y-6 text-left">
        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {mode === "create" ? "Create New Secret" : "Edit Secret"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Store a password, credential, or confidential note in your private locker.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Name / Service */}
          <div className="space-y-1.5">
            <label
              htmlFor="entry-title"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Name / Service <span className="text-destructive">*</span>
            </label>
            <input
              id="entry-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Google, Instagram, GitHub, PhonePe, Wi-Fi, Bank"
              required
              className="w-full px-3.5 py-3 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all font-medium min-h-[46px]"
            />
          </div>

          {/* 2. Type */}
          <div className="space-y-1.5">
            <label
              htmlFor="entry-category"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Type
            </label>
            <select
              id="entry-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as VaultCategory)}
              className="w-full px-3.5 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all font-medium min-h-[46px]"
            >
              {VAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Username / ID */}
          <div className="space-y-1.5">
            <label
              htmlFor="entry-username"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Username / ID
            </label>
            <input
              id="entry-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., user@example.com or user ID"
              autoComplete="off"
              className="w-full px-3.5 py-3 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all font-mono min-h-[46px]"
            />
          </div>

          {/* 4. Password / PIN / Secret */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="entry-password"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Password / PIN / Secret
              </label>
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium py-1 px-1.5 rounded-lg active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{showGenerator ? "Hide Generator" : "Generate Strong Password"}</span>
              </button>
            </div>

            <div className="relative">
              <input
                id="entry-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password, PIN, or secret..."
                autoComplete="new-password"
                className="w-full pl-3.5 pr-11 py-3 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all font-mono min-h-[46px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2 rounded-lg"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Generator Drawer */}
            {showGenerator && (
              <div className="pt-2 animate-in fade-in">
                <PasswordGenerator
                  onSelectPassword={(pwd) => {
                    setPassword(pwd);
                    setShowPassword(true);
                    setShowGenerator(false);
                  }}
                  onClose={() => setShowGenerator(false)}
                />
              </div>
            )}
          </div>

          {/* 5. Website / App URL (optional) */}
          <div className="space-y-1.5">
            <label
              htmlFor="entry-url"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Website / App URL <span className="text-muted-foreground/60 font-normal lowercase">(optional)</span>
            </label>
            <input
              id="entry-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g., https://github.com or app link"
              autoComplete="off"
              className="w-full px-3.5 py-3 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all font-mono min-h-[46px]"
            />
          </div>

          {/* 6. Notes (optional) */}
          <div className="space-y-1.5">
            <label
              htmlFor="entry-notes"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Notes <span className="text-muted-foreground/60 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id="entry-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Recovery codes, PIN, or private instructions..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all font-mono leading-relaxed"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-12 px-5 text-sm min-h-[48px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || loading}
              className="rounded-xl h-12 px-6 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md min-h-[48px] flex items-center justify-center gap-2 flex-1 sm:flex-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Securely...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{mode === "create" ? "Save Securely" : "Update Secret"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
