"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  deriveKeyFromMasterPassword,
  decryptVaultKey,
} from "@/lib/crypto/vault";
import { VaultMetadataDTO } from "@/services/api/vault";
import { vaultSession } from "@/lib/vault/vaultSession";
import {
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  Loader2,
  HelpCircle,
  X,
  ShieldAlert,
} from "lucide-react";

interface UnlockVaultFormProps {
  metadata: VaultMetadataDTO;
  onSuccess: () => void;
}

export function UnlockVaultForm({ metadata, onSuccess }: UnlockVaultFormProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Derive KEK using PBKDF2 with stored salt and iteration count
      const kek = await deriveKeyFromMasterPassword(password, metadata.kdf_salt, {
        iterations: metadata.kdf_iterations,
      });

      // 2. Attempt AES-256-GCM unwrapping of DEK
      const dek = await decryptVaultKey(
        metadata.encrypted_dek,
        metadata.encrypted_dek_nonce,
        kek
      );

      // 3. Keep DEK in volatile memory only
      vaultSession.unlock(dek, metadata);

      // Clear password string reference
      setPassword("");

      onSuccess();
    } catch {
      // AEAD authentication tag mismatch or invalid password
      setError("Incorrect master password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-sm mx-auto py-12 px-4 space-y-6 text-center">
      {/* Vault Locked Icon */}
      <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 dark:bg-primary/15 text-primary border border-primary/20 shadow-lg shadow-primary/10">
        <Lock className="w-10 h-10" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Vault Locked
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter your master password to decrypt your secrets.
        </p>
      </div>

      {error && (
        <div className="w-full flex items-start gap-2.5 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-sm text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleUnlock} className="w-full space-y-4 text-left">
        <div className="space-y-1.5">
          <label
            htmlFor="unlock-password"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Master Password
          </label>
          <div className="relative">
            <input
              id="unlock-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter master password..."
              autoComplete="current-password"
              autoFocus
              required
              className="w-full pl-3.5 pr-10 py-3 rounded-xl border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all font-mono"
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
        </div>

        <Button
          type="submit"
          disabled={!password || loading}
          className="w-full rounded-2xl h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md min-h-[48px] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying & Decrypting...</span>
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              <span>Unlock Vault</span>
            </>
          )}
        </Button>

        {/* Forgot Password Trigger */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsForgotModalOpen(true)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Forgot master password?</span>
          </button>
        </div>
      </form>

      {/* Forgot Password Explanation Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>Zero-Knowledge Recovery</span>
              </div>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              There is no server-side recovery for your Secure Vault master password. Because your data is encrypted with zero-knowledge keys, the server does not hold the master password or private encryption keys.
            </p>

            <p className="text-xs text-muted-foreground/80 leading-relaxed bg-secondary/50 p-3 rounded-xl border border-border/50">
              Without the correct master password, encrypted vault contents cannot be decrypted.
            </p>

            <Button
              onClick={() => setIsForgotModalOpen(false)}
              className="w-full rounded-xl h-10 font-semibold"
            >
              I Understand
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
