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
import { VaultHeader } from "@/components/vault/VaultHeader";
import { VaultSearch } from "@/components/vault/VaultSearch";
import { VaultEntryCard } from "@/components/vault/VaultEntryCard";
import { VaultEntryDetail } from "@/components/vault/VaultEntryDetail";
import { VaultEntryForm } from "@/components/vault/VaultEntryForm";
import { DeleteVaultEntryDialog } from "@/components/vault/DeleteVaultEntryDialog";
import { Button } from "@/components/ui/button";
import { KeyRound, Sparkles, RefreshCw, AlertCircle, Plus, Search } from "lucide-react";
import { ApiError } from "@/services/api/client";

export default function VaultPage() {
  const [vaultState, setVaultState] = useState<VaultState>(vaultSession.getState());
  const [metadata, setMetadata] = useState<VaultMetadataDTO | null>(vaultSession.getMetadata());

  // UI Flow States
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In-Memory Decrypted Secrets (NEVER PERSISTED TO LOCALSTORAGE)
  const [entries, setEntries] = useState<DecryptedVaultEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modals & Dialogs
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
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

  // Subscribe to in-memory vault session state
  useEffect(() => {
    const unsubscribe = vaultSession.subscribe((state) => {
      setVaultState(state);
      setMetadata(vaultSession.getMetadata());
      if (state === "LOCKED" || state === "NO_VAULT") {
        // Clear sensitive decrypted entries from React memory immediately upon lock
        setEntries([]);
        setSearchQuery("");
        setEditingEntry(null);
        setDetailEntry(null);
        setDeleteTarget(null);
        setIsAddFormOpen(false);
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
          // Omit corrupted entry or show placeholder
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
    fetchAndDecryptEntries();
  };

  const handleCreateSuccess = () => {
    setIsCreatingVault(false);
    showToast("Secure Vault initialized successfully 🎉");
    fetchAndDecryptEntries();
  };

  // Lock Vault Handler
  const handleLockVault = () => {
    vaultSession.lock();
    showToast("Vault locked 🔒");
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
    showToast(editingEntry ? "Secret updated successfully" : "Secret added to Secure Vault");
  };

  // Entry Deleted Callback
  const handleEntryDeleted = (deletedId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== deletedId));
    showToast("Secret deleted");
  };

  // Filter & Search Decrypted Secrets
  const filteredEntries = useMemo(() => {
    let list = entries;

    if (selectedCategory !== "all") {
      list = list.filter(
        (e) => e.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.username && e.username.toLowerCase().includes(q)) ||
          (e.url && e.url.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          (e.category && e.category.toLowerCase().includes(q))
      );
    }

    return list;
  }, [entries, selectedCategory, searchQuery]);

  // Touch Inactivity on user interaction
  const handleUserActivity = () => {
    vaultSession.touch();
  };

  return (
    <div
      onPointerDown={handleUserActivity}
      onKeyDown={handleUserActivity}
      className="flex flex-col gap-6 md:gap-8 pb-12 w-full"
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
        <div className="space-y-6">
          {/* Header */}
          <VaultHeader
            onAddClick={() => setIsAddFormOpen(true)}
            onLockClick={handleLockVault}
          />

          {/* Search & Category Filter Controls */}
          <VaultSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            totalCount={entries.length}
            filteredCount={filteredEntries.length}
          />

          {/* Decrypted Secrets List */}
          <section aria-label="Vault entries list" className="w-full">
            {entriesLoading ? (
              <VaultEntryListSkeleton />
            ) : filteredEntries.length === 0 ? (
              /* Empty States */
              <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-border/60 bg-card/40 space-y-3 min-h-[260px]">
                <div className="p-3.5 rounded-full bg-secondary text-muted-foreground/70 mb-1">
                  {searchQuery ? (
                    <Search className="w-7 h-7" />
                  ) : (
                    <KeyRound className="w-7 h-7" />
                  )}
                </div>

                {searchQuery ? (
                  <>
                    <h3 className="text-base font-semibold text-foreground">
                      No matching secrets found
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      No secrets matched &ldquo;{searchQuery}&rdquo;. Try another search keyword or clear the search.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="rounded-xl px-4 mt-2"
                    >
                      Clear search
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-semibold text-foreground">
                      Your Vault is ready
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Add your first password, login, or recovery code to get started.
                    </p>
                    <Button
                      onClick={() => setIsAddFormOpen(true)}
                      className="rounded-xl px-5 mt-2 gap-1.5 font-medium"
                    >
                      <Plus className="w-4 h-4" /> Add Secret
                    </Button>
                  </>
                )}
              </div>
            ) : (
              /* Cards Grid */
              <div className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {filteredEntries.map((entry) => (
                    <VaultEntryCard
                      key={entry.id}
                      entry={entry}
                      onView={(e) => setDetailEntry(e)}
                      onEdit={(e) => setEditingEntry(e)}
                      onDelete={(e) => setDeleteTarget(e)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* Modals & Dialogs */}
          {/* Create Secret Modal */}
          {isAddFormOpen && (
            <VaultEntryForm
              mode="create"
              isOpen={isAddFormOpen}
              onClose={() => setIsAddFormOpen(false)}
              onSaved={handleEntrySaved}
            />
          )}

          {/* Edit Secret Modal */}
          {editingEntry && (
            <VaultEntryForm
              key={`edit-${editingEntry.id}`}
              mode="edit"
              initialEntry={editingEntry}
              isOpen={!!editingEntry}
              onClose={() => setEditingEntry(null)}
              onSaved={handleEntrySaved}
            />
          )}

          {/* Secret Detail Modal */}
          {detailEntry && (
            <VaultEntryDetail
              entry={detailEntry}
              onClose={() => setDetailEntry(null)}
              onEdit={(e) => {
                setDetailEntry(null);
                setEditingEntry(e);
              }}
              onDelete={(e) => {
                setDetailEntry(null);
                setDeleteTarget(e);
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
