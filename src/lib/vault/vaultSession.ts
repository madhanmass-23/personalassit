import { VaultMetadataDTO } from '@/services/api/vault';

export type VaultState = 'NO_VAULT' | 'LOCKED' | 'UNLOCKING' | 'UNLOCKED';

type VaultStateListener = (state: VaultState) => void;

// Inactivity auto-lock threshold: 15 minutes (in ms)
export const INACTIVITY_LOCK_TIMEOUT_MS = 15 * 60 * 1000;

// Background tab lock threshold: 5 minutes (in ms)
export const BACKGROUND_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * In-Memory Zero-Knowledge Vault Session Manager.
 * 
 * SECURITY GUARANTEES:
 * 1. Holds DEK (CryptoKey) strictly in volatile JavaScript heap memory.
 * 2. NEVER writes DEK or master password to localStorage, sessionStorage, or IndexedDB.
 * 3. Clears key references immediately upon manual lock, logout, or auto-lock timeout.
 * 4. Page refresh naturally clears all volatile memory and returns vault to LOCKED.
 */
class VaultSessionManager {
  private dek: CryptoKey | null = null;
  private metadata: VaultMetadataDTO | null = null;
  private state: VaultState = 'LOCKED';
  private listeners: Set<VaultStateListener> = new Set();
  
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private hiddenTimestamp: number | null = null;
  private backgroundTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupVisibilityListener();
    }
  }

  /**
   * Subscribe to vault state transitions.
   */
  public subscribe(listener: VaultStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const currentState = this.state;
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error('Vault listener error:', err);
      }
    });
  }

  /**
   * Get current vault lifecycle state.
   */
  public getState(): VaultState {
    return this.state;
  }

  /**
   * Set vault state explicitly (e.g. UNLOCKING or NO_VAULT).
   */
  public setState(nextState: VaultState): void {
    if (this.state !== nextState) {
      this.state = nextState;
      this.notify();
    }
  }

  /**
   * Get in-memory DEK (only available when UNLOCKED).
   */
  public getDek(): CryptoKey | null {
    if (this.state !== 'UNLOCKED') return null;
    return this.dek;
  }

  /**
   * Get vault metadata.
   */
  public getMetadata(): VaultMetadataDTO | null {
    return this.metadata;
  }

  /**
   * Set vault metadata.
   */
  public setMetadata(metadata: VaultMetadataDTO | null): void {
    this.metadata = metadata;
  }

  /**
   * Unlock the vault session in memory.
   */
  public unlock(dek: CryptoKey, metadata: VaultMetadataDTO): void {
    this.dek = dek;
    this.metadata = metadata;
    this.state = 'UNLOCKED';
    this.resetInactivityTimer();
    this.notify();
  }

  /**
   * Lock the vault and wipe volatile references.
   */
  public lock(): void {
    this.clearTimers();
    this.dek = null;
    this.state = 'LOCKED';
    this.notify();
  }

  /**
   * Reset the session completely (e.g. user logs out).
   */
  public reset(): void {
    this.clearTimers();
    this.dek = null;
    this.metadata = null;
    this.state = 'LOCKED';
    this.notify();
  }

  /**
   * Touch activity tracker on user interaction with Vault UI.
   */
  public touch(): void {
    if (this.state === 'UNLOCKED') {
      this.resetInactivityTimer();
    }
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    this.inactivityTimer = setTimeout(() => {
      if (this.state === 'UNLOCKED') {
        this.lock();
      }
    }, INACTIVITY_LOCK_TIMEOUT_MS);
  }

  private clearTimers(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.backgroundTimer) {
      clearTimeout(this.backgroundTimer);
      this.backgroundTimer = null;
    }
    this.hiddenTimestamp = null;
  }

  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (this.state !== 'UNLOCKED') return;

      if (document.visibilityState === 'hidden') {
        this.hiddenTimestamp = Date.now();
        // Set background timer for 5 minutes
        if (this.backgroundTimer) clearTimeout(this.backgroundTimer);
        this.backgroundTimer = setTimeout(() => {
          if (document.visibilityState === 'hidden' && this.state === 'UNLOCKED') {
            this.lock();
          }
        }, BACKGROUND_LOCK_TIMEOUT_MS);
      } else if (document.visibilityState === 'visible') {
        if (this.backgroundTimer) {
          clearTimeout(this.backgroundTimer);
          this.backgroundTimer = null;
        }
        if (this.hiddenTimestamp) {
          const elapsed = Date.now() - this.hiddenTimestamp;
          if (elapsed >= BACKGROUND_LOCK_TIMEOUT_MS) {
            this.lock();
          } else {
            this.touch();
          }
        }
        this.hiddenTimestamp = null;
      }
    });
  }
}

// Global in-memory singleton instance
export const vaultSession = new VaultSessionManager();
