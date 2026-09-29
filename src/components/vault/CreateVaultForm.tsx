"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  generateSalt,
  deriveKeyFromMasterPassword,
  generateVaultKey,
  encryptVaultKey,
  evaluatePasswordStrength,
  MIN_MASTER_PASSWORD_LENGTH,
} from "@/lib/crypto/vault";
import { vaultService } from "@/services/api/vault";
import { vaultSession } from "@/lib/vault/vaultSession";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  Loader2,
  Check,
  X,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateVaultFormProps {
  onBack?: () => void;
  onSuccess: () => void;
}

export function CreateVaultForm({ onBack, onSuccess }: CreateVaultFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = evaluatePasswordStrength(password);
  const isMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = strength.hasMinLength && isMatch && acknowledged && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Generate 32-byte cryptographically secure random salt
      const salt = generateSalt();

      // 2. Derive 256-bit AES-GCM KEK using PBKDF2 (600,000 iterations)
      const kek = await deriveKeyFromMasterPassword(password, salt, {
        iterations: 600000,
      });

      // 3. Generate random 256-bit AES-GCM Data Encryption Key (DEK)
      const dek = await generateVaultKey();

      // 4. Encrypt/wrap DEK with KEK
      const encryptedKey = await encryptVaultKey(dek, kek);

      // 5. Submit cryptographic metadata + wrapped DEK to server (ZERO plaintext secrets)
      const res = await vaultService.createVault({
        version: 1,
        kdf_algorithm: 'PBKDF2-HMAC-SHA-256',
        kdf_version: '1',
        kdf_salt: salt,
        kdf_iterations: 600000,
        encryption_algorithm: 'AES-256-GCM',
        encrypted_dek: encryptedKey.encryptedDek,
        encrypted_dek_nonce: encryptedKey.nonce,
      });

      // 6. Initialize in-memory vault session with decrypted DEK
      vaultSession.unlock(dek, res.vault);

      // Clear password states from component memory
      setPassword("");
      setConfirmPassword("");

      onSuccess();
    } catch (err: unknown) {
      console.error("Failed to initialize secure vault:", err);
      const msg = err instanceof Error ? err.message : "Failed to create secure vault. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 px-4 space-y-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2.5 text-primary">
          <KeyRound className="w-6 h-6" />
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Create Master Password
          </h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your master password is the single key used to encrypt and decrypt all your vault secrets. Choose a strong, memorable passphrase.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Master Password Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="master-password"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Master Password
          </label>
          <div className="relative">
            <input
              id="master-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter at least 12 characters..."
              autoComplete="new-password"
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

          {/* Password Strength Meter */}
          {password.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Strength: <strong className="text-foreground">{strength.label}</strong>
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {password.length} / {MIN_MASTER_PASSWORD_LENGTH}+ chars
                </span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex gap-0.5">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    strength.score <= 1 && "w-1/4 bg-destructive",
                    strength.score === 2 && "w-2/4 bg-amber-500",
                    strength.score === 3 && "w-3/4 bg-blue-500",
                    strength.score >= 4 && "w-full bg-emerald-500"
                  )}
                />
              </div>

              {/* Requirement Checklist */}
              <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                <div className={cn("flex items-center gap-1.5", strength.hasMinLength ? "text-emerald-500 font-medium" : "text-muted-foreground")}>
                  {strength.hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>12+ characters</span>
                </div>
                <div className={cn("flex items-center gap-1.5", strength.hasUpper && strength.hasLower ? "text-emerald-500 font-medium" : "text-muted-foreground")}>
                  {strength.hasUpper && strength.hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>Upper & lowercase</span>
                </div>
                <div className={cn("flex items-center gap-1.5", strength.hasNumber ? "text-emerald-500 font-medium" : "text-muted-foreground")}>
                  {strength.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>Numbers</span>
                </div>
                <div className={cn("flex items-center gap-1.5", strength.hasSymbol ? "text-emerald-500 font-medium" : "text-muted-foreground")}>
                  {strength.hasSymbol ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span>Special symbols</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Master Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="confirm-master-password"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Confirm Master Password
          </label>
          <div className="relative">
            <input
              id="confirm-master-password"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your master password..."
              autoComplete="new-password"
              required
              className={cn(
                "w-full pl-3.5 pr-10 py-3 rounded-xl border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all font-mono",
                confirmPassword.length > 0
                  ? isMatch
                    ? "border-emerald-500/50 focus:ring-emerald-500/60"
                    : "border-destructive/50 focus:ring-destructive/60"
                  : "border-input focus:ring-primary/60"
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword.length > 0 && !isMatch && (
            <p className="text-[11px] text-destructive flex items-center gap-1">
              <X className="w-3 h-3" /> Passwords do not match
            </p>
          )}
        </div>

        {/* Security Warning Acknowledgment */}
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-foreground leading-relaxed">
              <strong>Your master password is the key to your Secure Vault.</strong> Because this is a zero-knowledge service, there is no password reset option. If you lose this password, your encrypted vault cannot be recovered.
            </p>
          </div>
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="rounded border-amber-500/40 text-primary focus:ring-primary h-4 w-4 mt-0.5"
            />
            <span className="text-xs font-medium text-foreground">
              I understand that my master password cannot be reset or recovered by anyone.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-2xl h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md min-h-[48px] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Deriving Keys & Initializing...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Create Secure Vault</span>
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
