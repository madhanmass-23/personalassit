import { fetchClient } from './client';

export interface VaultMetadataDTO {
  id: string;
  user_id: number;
  version: number;
  kdf_algorithm: string;
  kdf_version?: string | null;
  kdf_salt: string;
  kdf_memory_cost?: number | null;
  kdf_time_cost?: number | null;
  kdf_parallelism?: number | null;
  kdf_iterations: number;
  encryption_algorithm: string;
  encrypted_dek: string;
  encrypted_dek_nonce: string;
  created_at: string;
  updated_at: string;
  last_unlocked_at?: string | null;
}

export interface CreateVaultDTO {
  version?: number;
  kdf_algorithm: string;
  kdf_version?: string;
  kdf_salt: string;
  kdf_iterations: number;
  encryption_algorithm: string;
  encrypted_dek: string;
  encrypted_dek_nonce: string;
}

export interface UpdateVaultKeyDTO {
  encrypted_dek: string;
  encrypted_dek_nonce: string;
  kdf_salt: string;
  kdf_iterations?: number;
  kdf_algorithm?: string;
  kdf_version?: string;
  version?: number;
}

export interface EncryptedVaultEntryDTO {
  id: string;
  vault_id: string;
  encrypted_payload: string;
  payload_nonce: string;
  payload_version: number;
  created_at: string;
  updated_at: string;
}

export interface CreateVaultEntryDTO {
  encrypted_payload: string;
  payload_nonce: string;
  payload_version?: number;
}

export interface UpdateVaultEntryDTO {
  encrypted_payload?: string;
  payload_nonce?: string;
  payload_version?: number;
}

export interface DecryptedVaultEntry {
  id: string;
  vault_id: string;
  title: string;
  username?: string;
  password?: string;
  secret?: string;
  url?: string;
  notes?: string;
  category?: string;
  created_at: string;
  updated_at: string;
  payload_version: number;
}

export const vaultService = {
  /**
   * Fetch authenticated user's vault metadata & encrypted DEK.
   */
  getVault: (): Promise<{ vault: VaultMetadataDTO }> =>
    fetchClient('/vault', { method: 'GET' }),

  /**
   * Initialize a new secure vault.
   */
  createVault: (data: CreateVaultDTO): Promise<{ vault: VaultMetadataDTO }> =>
    fetchClient('/vault', { method: 'POST', body: data }),

  /**
   * Rotate master password / update wrapped DEK.
   */
  updateVaultKey: (data: UpdateVaultKeyDTO): Promise<{ vault: VaultMetadataDTO }> =>
    fetchClient('/vault/key', { method: 'PATCH', body: data }),

  /**
   * Delete vault and all cascading entries.
   */
  deleteVault: (): Promise<{ message?: string }> =>
    fetchClient('/vault', { method: 'DELETE' }),

  /**
   * Retrieve list of encrypted vault entries.
   */
  getVaultEntries: (): Promise<{ entries: EncryptedVaultEntryDTO[] }> =>
    fetchClient('/vault/entries', { method: 'GET' }),

  /**
   * Store a new encrypted vault entry.
   */
  createVaultEntry: (data: CreateVaultEntryDTO): Promise<{ entry: EncryptedVaultEntryDTO }> =>
    fetchClient('/vault/entries', { method: 'POST', body: data }),

  /**
   * Retrieve a single encrypted vault entry by ID.
   */
  getVaultEntry: (id: string): Promise<{ entry: EncryptedVaultEntryDTO }> =>
    fetchClient(`/vault/entries/${id}`, { method: 'GET' }),

  /**
   * Update an encrypted vault entry.
   */
  updateVaultEntry: (id: string, data: UpdateVaultEntryDTO): Promise<{ entry: EncryptedVaultEntryDTO }> =>
    fetchClient(`/vault/entries/${id}`, { method: 'PATCH', body: data }),

  /**
   * Delete an encrypted vault entry by ID.
   */
  deleteVaultEntry: (id: string): Promise<{ message?: string }> =>
    fetchClient(`/vault/entries/${id}`, { method: 'DELETE' }),
};
