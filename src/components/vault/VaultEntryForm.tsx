"use client";

import { useState } from "react";
import { DecryptedVaultEntry, vaultService } from "@/services/api/vault";
import { encryptVaultPayload } from "@/lib/crypto/vault";
import { vaultSession } from "@/lib/vault/vaultSession";
import { Button } from "@/components/ui/button";
import { PasswordGenerator } from "./PasswordGenerator";
import { VAULT_CATEGORIES, VaultCategory } from "./VaultSearch";
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

interface VaultEntryFormProps {
  mode: "create" | "edit";
  initialEntry?: DecryptedVaultEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (entry: DecryptedVaultEntry) => void;
}

export function VaultEntryForm({
  mode,
  initialEntry,
  isOpen,
  onClose,
  onSaved,
}: VaultEntryFormProps) {
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || loading) return;

    const dek = vaultSession.getDek();
    if (!dek) {
      setError("Vault session is locked. Please unlock the vault again.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Assemble clean plaintext payload object
      const payload = {
        title: title.trim(),
        username: username.trim() || undefined,
        password: password || undefined,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
        category: category || "Other",
      };

      // 2. Encrypt authenticated payload locally using AES-256-GCM DEK + fresh 96-bit nonce
      const encryptedResult = await encryptVaultPayload(payload, dek, 1);

      let savedEntry: DecryptedVaultEntry;

      if (mode === "create") {
        // Dispatch only ciphertext to server
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

      // 3. Clear plaintext form state from component memory
      setTitle("");
      setUsername("");
      setPassword("");
      setUrl("");
      setNotes("");

      onSaved(savedEntry);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to save vault entry:", err);
      const msg = err instanceof Error ? err.message : "Failed to encrypt and save entry.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6 text-left">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {mode === "create" ? "Add New Secret" : "Edit Secret"}
              </h2>
              <p className="text-xs text-muted-foreground">
                All fields will be encrypted locally prior to transmission.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close form"
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label
              htmlFor="entry-title"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Title <span className="text-destructive">*</span>
            </label>
            <input
              id="entry-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Google Workspace, GitHub, Bank Portal..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all font-medium"
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="entry-category"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Category
            </label>
            <select
              id="entry-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as VaultCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all font-medium"
            >
              {VAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Username / Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="entry-username"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Username / Email
            </label>
            <input
              id="entry-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., user@company.com or @johndoe"
              autoComplete="off"
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all font-mono"
            />
          </div>

          {/* Password / Secret */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="entry-password"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Password / Secret
              </label>
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
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
                placeholder="Enter or generate secret..."
                autoComplete="new-password"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Embedded Password Generator Drawer */}
            {showGenerator && (
              <div className="pt-2">
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

          {/* Website URL */}
          <div className="space-y-1.5">
            <label
              htmlFor="entry-url"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Website URL
            </label>
            <input
              id="entry-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g., https://github.com or auth.college.edu"
              autoComplete="off"
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all font-mono"
            />
          </div>

          {/* Notes / Recovery Codes */}
          <div className="space-y-1.5">
            <label
              htmlFor="entry-notes"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Notes & Recovery Codes
            </label>
            <textarea
              id="entry-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Backup 2FA codes, security questions, or private instructions..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all font-mono leading-relaxed"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-11 px-5 text-sm min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || loading}
              className="rounded-xl h-11 px-6 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md min-h-[44px] flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Encrypting & Saving...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{mode === "create" ? "Save Encrypted Secret" : "Update Secret"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
