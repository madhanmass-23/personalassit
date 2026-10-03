"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { vaultService, VaultMetadataDTO, DecryptedVaultEntry } from "@/services/api/vault";
import { vaultSession, VaultState } from "@/lib/vault/vaultSession";
import { decryptVaultPayload } from "@/lib/crypto/vault";
import { VaultInitSkeleton, VaultEntryListSkeleton } from "@/components/vault/VaultSkeleton";
import { VaultWelcome } from "@/components/vault/VaultWelcome";
import { CreateVaultForm } from "@/components/vault/CreateVaultForm";
import { UnlockVaultForm } from "@/components/vault/UnlockVaultForm";
import { VaultEntryCard } from "@/components/vault/VaultEntryCard";
import { VaultEntryDetail } from "@/components/vault/VaultEntryDetail";
import { VaultEntryForm } from "@/components/vault/VaultEntryForm";
import { DeleteVaultEntryDialog } from "@/components/vault/DeleteVaultEntryDialog";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Plus,
  KeyRound,
  Lock,
  Search,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { ApiError } from "@/services/api/client";

type VaultView = "home" | "saved" | "create" | "detail" | "edit";

export default function VaultPage() {
  const [vaultState, setVaultState] = useState<VaultState>(vaultSession.getState());
  const [metadata, setMetadata] = useState<VaultMetadataDTO | null>(vaultSession.getMetadata());

  // UI Flow States
  const [currentView, setCurrentView] = useState<VaultView>("home");
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In-Memory Decrypted Secrets (NEVER PERSISTED TO LOCALSTORAGE)
  const [entries, setEntries] = useState<DecryptedVaultEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Editing & Detail Targets
  const [editingEntry, setEditingEntry] = useState<DecryptedVaultEntry | null>(null);
  const [detailEntry, setDetailEntry] = useState<DecryptedVaultEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DecryptedVaultEntry | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Helper: Verify session is active and decrypted key exists
  const isSessionUnlocked = useCallback(() => {
    return vaultSession.getState() === "UNLOCKED" && vaultSession.getDek() !== null;
  }, []);

  // Touch activity tracker on any user interaction
  const handleUserActivity = () => {
    vaultSession.touch();
  };

  // Subscribe to in-memory vault session state
  useEffect(() => {
    const unsubscribe = vaultSession.subscribe((state) => {
      setVaultState(state);
      setMetadata(vaultSession.getMetadata());
      if (state === "LOCKED" || state === "NO_VAULT") {
        // Clear sensitive decrypted entries from React memory immediately upon lock
        setEntries([]);
        setSearchQuery("");
        setCurrentView("home");
        setEditingEntry(null);
        setDetailEntry(null);
        setDeleteTarget(null);
      }
    });
    return unsubscribe;
  }, []);

  // Fetch & Decrypt Entries from API
  const fetchAndDecryptEntries = useCallback(async () => {
    const dek = vaultSession.getDek();
    if (!dek) return;

    try {
      setEntriesLoading(true);
      setError(null);

      const res = await vaultService.getVaultEntries();
      const encryptedRows = res.entries || [];

      // Decrypt each encrypted entry payload locally in client memory
      const decryptedList: DecryptedVaultEntry[] = [];

      for (const row of encryptedRows) {
        try {
          const payload = await decryptVaultPayload(
            row.encrypted_payload,
            row.payload_nonce,
            dek
          );

          decryptedList.push({
            id: row.id,
            vault_id: row.vault_id,
            title: payload.title || "Untitled Secret",
            username: payload.username,
            password: payload.password,
            secret: payload.secret,
            url: payload.url,
            notes: payload.notes,
            category: payload.category || "Other",
            created_at: row.created_at,
            updated_at: row.updated_at,
            payload_version: row.payload_version,
          });
        } catch (decryptErr) {
          console.error("Failed to decrypt individual entry:", decryptErr);
        }
      }

      // Only update entries if vault remains unlocked
      if (vaultSession.getState() === "UNLOCKED") {
        setEntries(decryptedList);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch vault entries:", err);
      setError("Couldn't load vault entries. Please check your connection.");
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  // Initial Vault Status Check
  const checkVaultStatus = useCallback(async () => {
    try {
      setInitialLoading(true);
      setError(null);

      const res = await vaultService.getVault();
      if (res?.vault) {
        vaultSession.setMetadata(res.vault);
        setMetadata(res.vault);
        if (vaultSession.getState() === "UNLOCKED") {
          await fetchAndDecryptEntries();
        } else {
          vaultSession.setState("LOCKED");
        }
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 404 || err.code === "NOT_FOUND")) {
        vaultSession.setState("NO_VAULT");
      } else {
        console.error("Vault status check failed:", err);
        setError("Failed to connect to Secure Vault. Please try again.");
      }
    } finally {
      setInitialLoading(false);
    }
  }, [fetchAndDecryptEntries]);

  useEffect(() => {
    checkVaultStatus();
  }, [checkVaultStatus]);

  // When vault state transitions to UNLOCKED, load entries
  const handleUnlockSuccess = () => {
    showToast("Vault unlocked successfully 🔓");
    setCurrentView("home");
    fetchAndDecryptEntries();
  };

  const handleCreateSuccess = () => {
    setIsCreatingVault(false);
    setCurrentView("home");
    showToast("Secure Vault initialized successfully 🎉");
    fetchAndDecryptEntries();
  };

  // Lock Vault Handler
  const handleLockVault = () => {
    vaultSession.lock();
    setCurrentView("home");
    showToast("Vault locked 🔒");
  };

  // Navigation Handlers with Session Verification
  const handleOpenCreate = () => {
    if (!isSessionUnlocked()) {
      vaultSession.lock();
      setVaultState("LOCKED");
      setCurrentView("home");
      showToast("Vault is locked. Please unlock first.");
      return;
    }
    vaultSession.touch();
    setCurrentView("create");
  };

  const handleOpenSaved = () => {
    if (!isSessionUnlocked()) {
      vaultSession.lock();
      setVaultState("LOCKED");
      setCurrentView("home");
      showToast("Vault is locked. Please unlock first.");
      return;
    }
    vaultSession.touch();
    setCurrentView("saved");
  };

  const handleOpenDetail = (entry: DecryptedVaultEntry) => {
    if (!isSessionUnlocked()) {
      vaultSession.lock();
      setVaultState("LOCKED");
      setCurrentView("home");
      showToast("Vault is locked. Please unlock first.");
      return;
    }
    vaultSession.touch();
    setDetailEntry(entry);
    setCurrentView("detail");
  };

  const handleOpenEdit = (entry: DecryptedVaultEntry) => {
    if (!isSessionUnlocked()) {
      vaultSession.lock();
      setVaultState("LOCKED");
      setCurrentView("home");
      showToast("Vault is locked. Please unlock first.");
      return;
    }
    vaultSession.touch();
    setEditingEntry(entry);
    setCurrentView("edit");
  };

  // Entry Saved Callback
  const handleEntrySaved = (saved: DecryptedVaultEntry) => {
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === saved.id);
      if (exists) {
        return prev.map((e) => (e.id === saved.id ? saved : e));
      }
      return [saved, ...prev];
    });

    if (editingEntry) {
      setDetailEntry(saved);
      setEditingEntry(null);
      setCurrentView("detail");
      showToast("Secret updated successfully");
    } else {
      setDetailEntry(saved);
      setCurrentView("saved");
      showToast("Secret saved securely");
    }
  };

  // Entry Deleted Callback
  const handleEntryDeleted = (deletedId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== deletedId));
    setDetailEntry(null);
    setDeleteTarget(null);
    setCurrentView("saved");
    showToast("Secret deleted");
  };

  // Filter & Search Decrypted Secrets
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase().trim();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.username && e.username.toLowerCase().includes(q)) ||
        (e.url && e.url.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q))
    );
  }, [entries, searchQuery]);

  return (
    <div
      onPointerDown={handleUserActivity}
      onKeyDown={handleUserActivity}
      className="flex flex-col gap-6 pb-12 w-full max-w-lg mx-auto"
    >
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-foreground text-background shadow-xl text-sm font-medium border border-border"
          >
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. INITIAL LOADING SKELETON */}
      {initialLoading ? (
        <VaultInitSkeleton />
      ) : error && vaultState === "NO_VAULT" && !isCreatingVault ? (
        /* 2. ERROR STATE */
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-destructive/20 bg-destructive/5 space-y-3">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Couldn&apos;t connect to Secure Vault
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {error}
          </p>
          <Button
            variant="outline"
            onClick={checkVaultStatus}
            className="rounded-xl px-5 gap-2 min-h-[40px] mt-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      ) : vaultState === "NO_VAULT" ? (
        /* 3. STATE: NO VAULT */
        isCreatingVault ? (
          <CreateVaultForm
            onBack={() => setIsCreatingVault(false)}
            onSuccess={handleCreateSuccess}
          />
        ) : (
          <VaultWelcome onCreateClick={() => setIsCreatingVault(true)} />
        )
      ) : vaultState === "LOCKED" && metadata ? (
        /* 4. STATE: LOCKED */
        <UnlockVaultForm
          metadata={metadata}
          onSuccess={handleUnlockSuccess}
        />
      ) : (
        /* 5. STATE: UNLOCKED */
        <div className="w-full">
          {/* VIEW A: VAULT HOME */}
          {currentView === "home" && (
            <div className="flex flex-col items-center justify-center py-6 sm:py-10 px-4 space-y-7 w-full text-center animate-in fade-in">
              {/* Header */}
              <div className="space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 text-primary border border-primary/20 shadow-md shadow-primary/5">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    SECURE VAULT
                  </h1>
                  <p className="text-sm text-muted-foreground font-medium">
                    Your private secret locker
                  </p>
                </div>
              </div>

              {/* Primary Actions: A. Create New, B. Saved Passwords */}
              <div className="w-full space-y-3.5">
                {/* Action A: Create New */}
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="group w-full p-4 sm:p-5 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 active:scale-[0.98] transition-all flex items-center justify-between gap-3 text-left shadow-xs hover:shadow-md cursor-pointer min-h-[72px]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/25 shrink-0">
                      <Plus className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                        Create New
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Save a new password or secret
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Action B: Saved Passwords */}
                <button
                  type="button"
                  onClick={handleOpenSaved}
                  className="group w-full p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:bg-accent/40 active:scale-[0.98] transition-all flex items-center justify-between gap-3 text-left shadow-xs hover:shadow-md cursor-pointer min-h-[72px]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-secondary text-primary flex items-center justify-center border border-border/60 shrink-0">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                        Saved Passwords
                      </h2>
                      <p className="text-xs text-muted-foreground font-medium">
                        {entries.length === 0
                          ? "No secrets saved yet"
                          : entries.length === 1
                          ? "1 secret saved"
                          : `${entries.length} secrets saved`}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Smaller Action: Lock Vault */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLockVault}
                  className="rounded-2xl h-11 px-5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary border-border/80 min-h-[44px] flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Lock Vault</span>
                </Button>
              </div>
            </div>
          )}

          {/* VIEW B: CREATE NEW */}
          {currentView === "create" && (
            <VaultEntryForm
              mode="create"
              isOpen={true}
              onClose={() => setCurrentView("home")}
              onSaved={handleEntrySaved}
              onUnlockRequest={() => {
                vaultSession.lock();
                setVaultState("LOCKED");
                setCurrentView("home");
              }}
            />
          )}

          {/* VIEW C: SAVED PASSWORDS */}
          {currentView === "saved" && (
            <div className="space-y-4 animate-in fade-in">
              {/* Top Navigation Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentView("home");
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground active:scale-95 transition-all py-1.5 px-2 rounded-xl hover:bg-secondary min-h-[40px]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Vault Home</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground px-2.5 py-1 rounded-full bg-secondary">
                    {entries.length} {entries.length === 1 ? "secret" : "secrets"}
                  </span>
                  <Button
                    size="sm"
                    onClick={handleOpenCreate}
                    className="rounded-xl h-9 px-3 text-xs font-semibold bg-primary text-primary-foreground flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New</span>
                  </Button>
                </div>
              </div>

              {/* Search Bar */}
              {entries.length > 0 && (
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search saved passwords..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all shadow-xs min-h-[44px]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Decrypted List */}
              <section aria-label="Saved passwords list" className="w-full pt-1">
                {entriesLoading ? (
                  <VaultEntryListSkeleton />
                ) : entries.length === 0 ? (
                  /* 7. EMPTY STATE (Requirement 7) */
                  <div className="flex flex-col items-center justify-center py-14 px-4 text-center rounded-3xl border border-border/70 bg-card/40 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-secondary text-primary/80 flex items-center justify-center border border-border/50">
                      <KeyRound className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
                        SECURE VAULT
                      </p>
                      <h3 className="text-lg font-semibold text-foreground">
                        No saved passwords yet.
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Add your first password or confidential credential to your private locker.
                      </p>
                    </div>
                    <Button
                      onClick={handleOpenCreate}
                      className="rounded-xl px-6 h-11 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px] flex items-center gap-2 mt-2 shadow-md shadow-primary/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New</span>
                    </Button>
                  </div>
                ) : filteredEntries.length === 0 ? (
                  /* Search 0 Results */
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-border/60 bg-card/40 space-y-3">
                    <Search className="w-8 h-8 text-muted-foreground" />
                    <h3 className="text-base font-semibold text-foreground">
                      No matching secrets found
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      No secrets match &ldquo;{searchQuery}&rdquo;.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="rounded-xl px-4 mt-1"
                    >
                      Clear search
                    </Button>
                  </div>
                ) : (
                  /* Passwords Cards */
                  <div className="flex flex-col gap-2.5">
                    <AnimatePresence initial={false}>
                      {filteredEntries.map((entry) => (
                        <VaultEntryCard
                          key={entry.id}
                          entry={entry}
                          onView={handleOpenDetail}
                          onEdit={handleOpenEdit}
                          onDelete={(e) => setDeleteTarget(e)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* VIEW D: SECRET DETAIL */}
          {currentView === "detail" && detailEntry && (
            <VaultEntryDetail
              entry={detailEntry}
              onClose={() => {
                setDetailEntry(null);
                setCurrentView("saved");
              }}
              onEdit={handleOpenEdit}
              onDelete={(e) => setDeleteTarget(e)}
            />
          )}

          {/* VIEW E: EDIT SECRET */}
          {currentView === "edit" && editingEntry && (
            <VaultEntryForm
              key={`edit-${editingEntry.id}`}
              mode="edit"
              initialEntry={editingEntry}
              isOpen={true}
              onClose={() => setCurrentView("detail")}
              onSaved={handleEntrySaved}
              onUnlockRequest={() => {
                vaultSession.lock();
                setVaultState("LOCKED");
                setCurrentView("home");
              }}
            />
          )}

          {/* Delete Confirmation Dialog */}
          <DeleteVaultEntryDialog
            isOpen={!!deleteTarget}
            entryId={deleteTarget?.id || null}
            entryTitle={deleteTarget?.title || ""}
            onClose={() => setDeleteTarget(null)}
            onDeleted={handleEntryDeleted}
          />
        </div>
      )}
    </div>
  );
}
