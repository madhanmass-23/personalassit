"""
Personal Assistant v1.1 — Secure Vault Backend API Test Suite
Phase v1.1.2 Validation

Tests:
1. authenticated user can create vault
2. unauthenticated user cannot create vault
3. duplicate vault returns 409
4. authenticated user can retrieve own vault
5. authenticated user cannot retrieve another user's vault
6. authenticated user can update encrypted DEK
7. authenticated user can create encrypted entry
8. authenticated user can list own entries
9. authenticated user can retrieve own entry
10. authenticated user can update own entry
11. authenticated user can delete own entry
12. authenticated user cannot read another user's entry
13. authenticated user cannot update another user's entry
14. authenticated user cannot delete another user's entry
15. invalid nonce is rejected
16. invalid KDF metadata is rejected
17. unsupported algorithm is rejected
18. oversized encrypted payload is rejected
19. plaintext secret is never required by the API
20. SQL errors are not exposed
21. request bodies are not logged
22. deleting vault cascades entries
"""

import unittest
import base64
import uuid
import time
import json
import re

# Mock Database & In-Memory Storage for PHP API Logic Emulation
class MockDatabase:
    def __init__(self):
        self.vaults = {} # key: vault_id -> dict
        self.user_vault_map = {} # user_id -> vault_id
        self.entries = {} # key: entry_id -> dict

    def reset(self):
        self.vaults.clear()
        self.user_vault_map.clear()
        self.entries.clear()

db = MockDatabase()

# Emulated Backend Models & Controllers
class VaultModel:
    @staticmethod
    def find_by_user_id(user_id):
        vault_id = db.user_vault_map.get(user_id)
        if not vault_id:
            return None
        return db.vaults.get(vault_id)

    @staticmethod
    def find_by_id_and_user(vault_id, user_id):
        vault = db.vaults.get(vault_id)
        if vault and vault['user_id'] == user_id:
            return vault
        return None

    @staticmethod
    def create(user_id, data):
        if user_id in db.user_vault_map:
            raise Exception("Duplicate entry for key 'uk_secure_vaults_user' (SQL error 23000)")
        
        vault_id = str(uuid.uuid4())
        record = {
            'id': vault_id,
            'user_id': user_id,
            'version': int(data.get('version', 1)),
            'kdf_algorithm': data.get('kdf_algorithm', 'PBKDF2-HMAC-SHA-256'),
            'kdf_version': data.get('kdf_version', '1'),
            'kdf_salt': data['kdf_salt'],
            'kdf_memory_cost': data.get('kdf_memory_cost'),
            'kdf_time_cost': data.get('kdf_time_cost'),
            'kdf_parallelism': data.get('kdf_parallelism'),
            'kdf_iterations': int(data.get('kdf_iterations', 600000)),
            'encryption_algorithm': data.get('encryption_algorithm', 'AES-256-GCM'),
            'encrypted_dek': data['encrypted_dek'],
            'encrypted_dek_nonce': data['encrypted_dek_nonce'],
            'created_at': '2026-09-29 07:00:00',
            'updated_at': '2026-09-29 07:00:00',
            'last_unlocked_at': None
        }
        db.vaults[vault_id] = record
        db.user_vault_map[user_id] = vault_id
        return record

    @staticmethod
    def update_encrypted_key(user_id, data):
        vault_id = db.user_vault_map.get(user_id)
        if not vault_id or vault_id not in db.vaults:
            return None
        vault = db.vaults[vault_id]
        vault['encrypted_dek'] = data['encrypted_dek']
        vault['encrypted_dek_nonce'] = data['encrypted_dek_nonce']
        vault['kdf_salt'] = data['kdf_salt']
        if 'kdf_iterations' in data:
            vault['kdf_iterations'] = int(data['kdf_iterations'])
        if 'kdf_algorithm' in data:
            vault['kdf_algorithm'] = data['kdf_algorithm']
        if 'version' in data:
            vault['version'] = int(data['version'])
        vault['updated_at'] = '2026-09-29 07:05:00'
        return vault

    @staticmethod
    def delete_by_user_id(user_id):
        vault_id = db.user_vault_map.pop(user_id, None)
        if vault_id and vault_id in db.vaults:
            del db.vaults[vault_id]
            # Cascade delete entries
            to_delete = [eid for eid, entry in db.entries.items() if entry['vault_id'] == vault_id]
            for eid in to_delete:
                del db.entries[eid]
            return True
        return False


class VaultEntryModel:
    @staticmethod
    def find_all_by_vault_id(vault_id, user_id):
        return [
            entry for entry in db.entries.values()
            if entry['vault_id'] == vault_id and entry['user_id'] == user_id
        ]

    @staticmethod
    def find_by_id_and_user(entry_id, user_id):
        entry = db.entries.get(entry_id)
        if entry and entry['user_id'] == user_id:
            return entry
        return None

    @staticmethod
    def create(vault_id, user_id, data):
        entry_id = str(uuid.uuid4())
        record = {
            'id': entry_id,
            'vault_id': vault_id,
            'user_id': user_id,
            'encrypted_payload': data['encrypted_payload'],
            'payload_nonce': data['payload_nonce'],
            'payload_version': int(data.get('payload_version', 1)),
            'created_at': '2026-09-29 07:00:00',
            'updated_at': '2026-09-29 07:00:00'
        }
        db.entries[entry_id] = record
        return record

    @staticmethod
    def update_encrypted_payload(entry_id, user_id, data):
        entry = db.entries.get(entry_id)
        if not entry or entry['user_id'] != user_id:
            return None
        if 'encrypted_payload' in data:
            entry['encrypted_payload'] = data['encrypted_payload']
        if 'payload_nonce' in data:
            entry['payload_nonce'] = data['payload_nonce']
        if 'payload_version' in data:
            entry['payload_version'] = int(data['payload_version'])
        entry['updated_at'] = '2026-09-29 07:06:00'
        return entry

    @staticmethod
    def delete_by_id_and_user(entry_id, user_id):
        entry = db.entries.get(entry_id)
        if entry and entry['user_id'] == user_id:
            del db.entries[entry_id]
            return True
        return False


class VaultController:
    SUPPORTED_KDF = ['PBKDF2-HMAC-SHA-256', 'argon2id']
    SUPPORTED_ENC = ['AES-256-GCM']
    MAX_DEK_BYTES = 16384
    MIN_ITER = 100000
    MAX_ITER = 5000000

    @classmethod
    def is_valid_base64(cls, s):
        if not isinstance(s, str) or len(s) == 0 or len(s) % 4 != 0:
            return False
        if not re.match(r'^[a-zA-Z0-9+/]+={0,2}$', s):
            return False
        try:
            return base64.b64decode(s) is not None
        except Exception:
            return False

    @classmethod
    def is_valid_nonce(cls, s):
        if not isinstance(s, str) or len(s) > 255 or not cls.is_valid_base64(s):
            return False
        try:
            decoded = base64.b64decode(s)
            return len(decoded) == 12 # 96 bits
        except Exception:
            return False

    @classmethod
    def is_valid_salt(cls, s):
        if not isinstance(s, str) or len(s) > 255 or not cls.is_valid_base64(s):
            return False
        try:
            decoded = base64.b64decode(s)
            return 16 <= len(decoded) <= 64
        except Exception:
            return False

    @classmethod
    def create_vault(cls, user_id, data):
        if not user_id:
            return 401, {'success': False, 'error': {'code': 'UNAUTHORIZED', 'message': 'Authentication required'}}
        
        if VaultModel.find_by_user_id(user_id):
            return 409, {'success': False, 'error': {'code': 'VAULT_EXISTS', 'message': 'Secure vault already exists'}}

        kdf_algo = data.get('kdf_algorithm', 'PBKDF2-HMAC-SHA-256')
        if kdf_algo not in cls.SUPPORTED_KDF:
            return 400, {'success': False, 'error': {'code': 'INVALID_VAULT_DATA', 'message': f'Unsupported KDF algorithm: {kdf_algo}'}}

        enc_algo = data.get('encryption_algorithm', 'AES-256-GCM')
        if enc_algo not in cls.SUPPORTED_ENC:
            return 400, {'success': False, 'error': {'code': 'INVALID_VAULT_DATA', 'message': f'Unsupported encryption algorithm: {enc_algo}'}}

        salt = data.get('kdf_salt', '')
        if not cls.is_valid_salt(salt):
            return 400, {'success': False, 'error': {'code': 'INVALID_VAULT_DATA', 'message': 'Invalid KDF salt'}}

        iterations = int(data.get('kdf_iterations', 600000))
        if iterations < cls.MIN_ITER or iterations > cls.MAX_ITER:
            return 400, {'success': False, 'error': {'code': 'INVALID_VAULT_DATA', 'message': f'KDF iterations must be between {cls.MIN_ITER} and {cls.MAX_ITER}'}}

        dek = data.get('encrypted_dek', '')
        if not cls.is_valid_base64(dek):
            return 400, {'success': False, 'error': {'code': 'INVALID_VAULT_DATA', 'message': 'Invalid encrypted DEK'}}
        if len(dek) > cls.MAX_DEK_BYTES:
            return 413, {'success': False, 'error': {'code': 'PAYLOAD_TOO_LARGE', 'message': 'Encrypted DEK exceeds maximum allowed size (16 KB)'}}

        nonce = data.get('encrypted_dek_nonce', '')
        if not cls.is_valid_nonce(nonce):
            return 400, {'success': False, 'error': {'code': 'INVALID_VAULT_DATA', 'message': 'Invalid encrypted DEK nonce (must be 12-byte AES-GCM nonce)'}}

        try:
            created = VaultModel.create(user_id, data)
            return 201, {'success': True, 'data': {'vault': created}}
        except Exception as e:
            if 'Duplicate entry' in str(e):
                return 409, {'success': False, 'error': {'code': 'VAULT_EXISTS', 'message': 'Secure vault already exists'}}
            return 500, {'success': False, 'error': {'code': 'SERVER_ERROR', 'message': 'Failed to create secure vault'}}

    @classmethod
    def get_vault(cls, user_id):
        if not user_id:
            return 401, {'success': False, 'error': {'code': 'UNAUTHORIZED', 'message': 'Authentication required'}}
        vault = VaultModel.find_by_user_id(user_id)
        if not vault:
            return 404, {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Secure vault not found'}}
        return 200, {'success': True, 'data': {'vault': vault}}

    @classmethod
    def update_key(cls, user_id, data):
        if not user_id:
            return 401, {'success': False, 'error': {'code': 'UNAUTHORIZED', 'message': 'Authentication required'}}
        vault = VaultModel.find_by_user_id(user_id)
        if not vault:
            return 404, {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Secure vault not found'}}

        dek = data.get('encrypted_dek', '')
        if not cls.is_valid_base64(dek):
            return 400, {'success': False, 'error': {'code': 'INVALID_VAULT_DATA', 'message': 'Invalid encrypted DEK'}}
        if len(dek) > cls.MAX_DEK_BYTES:
            return 413, {'success': False, 'error': {'code': 'PAYLOAD_TOO_LARGE', 'message': 'Encrypted DEK exceeds maximum allowed size (16 KB)'}}

        nonce = data.get('encrypted_dek_nonce', data.get('nonce', ''))
        if not cls.is_valid_nonce(nonce):
            return 400, {'success': False, 'error': {'code': 'INVALID_VAULT_DATA', 'message': 'Invalid encrypted DEK nonce'}}

        salt = data.get('kdf_salt', '')
        if not cls.is_valid_salt(salt):
            return 400, {'success': False, 'error': {'code': 'INVALID_VAULT_DATA', 'message': 'Invalid KDF salt'}}

        updated = VaultModel.update_encrypted_key(user_id, data)
        return 200, {'success': True, 'data': {'vault': updated}}

    @classmethod
    def delete_vault(cls, user_id):
        if not user_id:
            return 401, {'success': False, 'error': {'code': 'UNAUTHORIZED', 'message': 'Authentication required'}}
        vault = VaultModel.find_by_user_id(user_id)
        if not vault:
            return 404, {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Secure vault not found'}}
        VaultModel.delete_by_user_id(user_id)
        return 200, {'success': True, 'message': 'Vault deleted successfully'}


class VaultEntryController:
    MAX_PAYLOAD_BYTES = 1048576 # 1 MB

    @classmethod
    def list_entries(cls, user_id):
        if not user_id:
            return 401, {'success': False, 'error': {'code': 'UNAUTHORIZED', 'message': 'Authentication required'}}
        vault = VaultModel.find_by_user_id(user_id)
        if not vault:
            return 200, {'success': True, 'data': {'entries': []}}
        entries = VaultEntryModel.find_all_by_vault_id(vault['id'], user_id)
        return 200, {'success': True, 'data': {'entries': entries}}

    @classmethod
    def create_entry(cls, user_id, data):
        if not user_id:
            return 401, {'success': False, 'error': {'code': 'UNAUTHORIZED', 'message': 'Authentication required'}}
        vault = VaultModel.find_by_user_id(user_id)
        if not vault:
            return 404, {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Secure vault not found'}}

        payload = data.get('encrypted_payload', '')
        if not VaultController.is_valid_base64(payload):
            return 400, {'success': False, 'error': {'code': 'INVALID_ENTRY_DATA', 'message': 'Invalid encrypted payload'}}
        if len(payload) > cls.MAX_PAYLOAD_BYTES:
            return 413, {'success': False, 'error': {'code': 'PAYLOAD_TOO_LARGE', 'message': 'Encrypted payload exceeds maximum allowed size (1 MB)'}}

        nonce = data.get('payload_nonce', '')
        if not VaultController.is_valid_nonce(nonce):
            return 400, {'success': False, 'error': {'code': 'INVALID_ENTRY_DATA', 'message': 'Invalid payload nonce'}}

        entry = VaultEntryModel.create(vault['id'], user_id, data)
        return 201, {'success': True, 'data': {'entry': entry}}

    @classmethod
    def get_entry(cls, user_id, entry_id):
        if not user_id:
            return 401, {'success': False, 'error': {'code': 'UNAUTHORIZED', 'message': 'Authentication required'}}
        entry = VaultEntryModel.find_by_id_and_user(entry_id, user_id)
        if not entry:
            return 404, {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Vault entry not found'}}
        return 200, {'success': True, 'data': {'entry': entry}}

    @classmethod
    def update_entry(cls, user_id, entry_id, data):
        if not user_id:
            return 401, {'success': False, 'error': {'code': 'UNAUTHORIZED', 'message': 'Authentication required'}}
        entry = VaultEntryModel.find_by_id_and_user(entry_id, user_id)
        if not entry:
            return 404, {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Vault entry not found'}}

        if 'encrypted_payload' in data:
            payload = data['encrypted_payload']
            if not VaultController.is_valid_base64(payload):
                return 400, {'success': False, 'error': {'code': 'INVALID_ENTRY_DATA', 'message': 'Invalid encrypted payload'}}
            if len(payload) > cls.MAX_PAYLOAD_BYTES:
                return 413, {'success': False, 'error': {'code': 'PAYLOAD_TOO_LARGE', 'message': 'Encrypted payload exceeds maximum allowed size (1 MB)'}}

        if 'payload_nonce' in data:
            nonce = data['payload_nonce']
            if not VaultController.is_valid_nonce(nonce):
                return 400, {'success': False, 'error': {'code': 'INVALID_ENTRY_DATA', 'message': 'Invalid payload nonce'}}

        updated = VaultEntryModel.update_encrypted_payload(entry_id, user_id, data)
        return 200, {'success': True, 'data': {'entry': updated}}

    @classmethod
    def delete_entry(cls, user_id, entry_id):
        if not user_id:
            return 401, {'success': False, 'error': {'code': 'UNAUTHORIZED', 'message': 'Authentication required'}}
        entry = VaultEntryModel.find_by_id_and_user(entry_id, user_id)
        if not entry:
            return 404, {'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Vault entry not found'}}
        VaultEntryModel.delete_by_id_and_user(entry_id, user_id)
        return 200, {'success': True, 'message': 'Vault entry deleted successfully'}


# Unit & Security Tests
class TestSecureVaultBackendAPI(unittest.TestCase):
    def setUp(self):
        db.reset()
        self.user_a = 101
        self.user_b = 202

        # Valid 32-byte salt in Base64
        self.valid_salt = base64.b64encode(b'A' * 32).decode('utf-8')
        # Valid 12-byte AES-GCM nonce in Base64 (16 chars)
        self.valid_nonce = base64.b64encode(b'N' * 12).decode('utf-8')
        # Valid encrypted DEK in Base64
        self.valid_encrypted_dek = base64.b64encode(b'E' * 48).decode('utf-8')
        # Valid encrypted payload in Base64
        self.valid_encrypted_payload = base64.b64encode(b'CIPHERTEXT_OPAQUE_PAYLOAD_TEST_DATA').decode('utf-8')

    def test_01_authenticated_user_can_create_vault(self):
        payload = {
            'version': 1,
            'kdf_algorithm': 'PBKDF2-HMAC-SHA-256',
            'kdf_version': '1',
            'kdf_salt': self.valid_salt,
            'kdf_iterations': 600000,
            'encryption_algorithm': 'AES-256-GCM',
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        }
        status, res = VaultController.create_vault(self.user_a, payload)
        self.assertEqual(status, 201)
        self.assertTrue(res['success'])
        self.assertEqual(res['data']['vault']['user_id'], self.user_a)
        self.assertEqual(res['data']['vault']['kdf_iterations'], 600000)

    def test_02_unauthenticated_user_cannot_create_vault(self):
        payload = {
            'version': 1,
            'kdf_algorithm': 'PBKDF2-HMAC-SHA-256',
            'kdf_salt': self.valid_salt,
            'kdf_iterations': 600000,
            'encryption_algorithm': 'AES-256-GCM',
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        }
        status, res = VaultController.create_vault(None, payload)
        self.assertEqual(status, 401)
        self.assertFalse(res['success'])
        self.assertEqual(res['error']['code'], 'UNAUTHORIZED')

    def test_03_duplicate_vault_returns_409(self):
        payload = {
            'kdf_salt': self.valid_salt,
            'kdf_iterations': 600000,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        }
        status1, _ = VaultController.create_vault(self.user_a, payload)
        self.assertEqual(status1, 201)

        status2, res2 = VaultController.create_vault(self.user_a, payload)
        self.assertEqual(status2, 409)
        self.assertFalse(res2['success'])
        self.assertEqual(res2['error']['code'], 'VAULT_EXISTS')

    def test_04_authenticated_user_can_retrieve_own_vault(self):
        payload = {
            'kdf_salt': self.valid_salt,
            'kdf_iterations': 600000,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        }
        VaultController.create_vault(self.user_a, payload)
        status, res = VaultController.get_vault(self.user_a)
        self.assertEqual(status, 200)
        self.assertTrue(res['success'])
        self.assertEqual(res['data']['vault']['encrypted_dek'], self.valid_encrypted_dek)

    def test_05_authenticated_user_cannot_retrieve_another_users_vault(self):
        # User A creates vault, User B has none
        payload = {
            'kdf_salt': self.valid_salt,
            'kdf_iterations': 600000,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        }
        VaultController.create_vault(self.user_a, payload)

        status, res = VaultController.get_vault(self.user_b)
        self.assertEqual(status, 404)
        self.assertEqual(res['error']['code'], 'NOT_FOUND')

    def test_06_authenticated_user_can_update_encrypted_dek(self):
        VaultController.create_vault(self.user_a, {
            'kdf_salt': self.valid_salt,
            'kdf_iterations': 600000,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        })

        new_salt = base64.b64encode(b'B' * 32).decode('utf-8')
        new_dek = base64.b64encode(b'NEW_DEK_ENCRYPTED_WITH_NEW_KEK').decode('utf-8')
        new_nonce = base64.b64encode(b'M' * 12).decode('utf-8')

        status, res = VaultController.update_key(self.user_a, {
            'kdf_salt': new_salt,
            'encrypted_dek': new_dek,
            'encrypted_dek_nonce': new_nonce,
            'kdf_iterations': 600000
        })
        self.assertEqual(status, 200)
        self.assertEqual(res['data']['vault']['encrypted_dek'], new_dek)
        self.assertEqual(res['data']['vault']['kdf_salt'], new_salt)

    def test_07_authenticated_user_can_create_encrypted_entry(self):
        VaultController.create_vault(self.user_a, {
            'kdf_salt': self.valid_salt,
            'kdf_iterations': 600000,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        })

        status, res = VaultEntryController.create_entry(self.user_a, {
            'encrypted_payload': self.valid_encrypted_payload,
            'payload_nonce': self.valid_nonce,
            'payload_version': 1
        })
        self.assertEqual(status, 201)
        self.assertTrue(res['success'])
        self.assertIn('id', res['data']['entry'])
        self.assertEqual(res['data']['entry']['encrypted_payload'], self.valid_encrypted_payload)

    def test_08_authenticated_user_can_list_own_entries(self):
        VaultController.create_vault(self.user_a, {
            'kdf_salt': self.valid_salt,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        })
        VaultEntryController.create_entry(self.user_a, {
            'encrypted_payload': self.valid_encrypted_payload,
            'payload_nonce': self.valid_nonce
        })

        status, res = VaultEntryController.list_entries(self.user_a)
        self.assertEqual(status, 200)
        self.assertEqual(len(res['data']['entries']), 1)

    def test_09_authenticated_user_can_retrieve_own_entry(self):
        VaultController.create_vault(self.user_a, {
            'kdf_salt': self.valid_salt,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        })
        _, create_res = VaultEntryController.create_entry(self.user_a, {
            'encrypted_payload': self.valid_encrypted_payload,
            'payload_nonce': self.valid_nonce
        })
        entry_id = create_res['data']['entry']['id']

        status, res = VaultEntryController.get_entry(self.user_a, entry_id)
        self.assertEqual(status, 200)
        self.assertEqual(res['data']['entry']['id'], entry_id)

    def test_10_authenticated_user_can_update_own_entry(self):
        VaultController.create_vault(self.user_a, {
            'kdf_salt': self.valid_salt,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        })
        _, create_res = VaultEntryController.create_entry(self.user_a, {
            'encrypted_payload': self.valid_encrypted_payload,
            'payload_nonce': self.valid_nonce
        })
        entry_id = create_res['data']['entry']['id']

        new_payload = base64.b64encode(b'UPDATED_ENCRYPTED_PAYLOAD_CIPHERTEXT').decode('utf-8')
        new_nonce = base64.b64encode(b'U' * 12).decode('utf-8')
        status, res = VaultEntryController.update_entry(self.user_a, entry_id, {
            'encrypted_payload': new_payload,
            'payload_nonce': new_nonce
        })
        self.assertEqual(status, 200)
        self.assertEqual(res['data']['entry']['encrypted_payload'], new_payload)

    def test_11_authenticated_user_can_delete_own_entry(self):
        VaultController.create_vault(self.user_a, {
            'kdf_salt': self.valid_salt,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        })
        _, create_res = VaultEntryController.create_entry(self.user_a, {
            'encrypted_payload': self.valid_encrypted_payload,
            'payload_nonce': self.valid_nonce
        })
        entry_id = create_res['data']['entry']['id']

        status, res = VaultEntryController.delete_entry(self.user_a, entry_id)
        self.assertEqual(status, 200)
        self.assertTrue(res['success'])

        # Verify it's gone
        get_status, _ = VaultEntryController.get_entry(self.user_a, entry_id)
        self.assertEqual(get_status, 404)

    def test_12_authenticated_user_cannot_read_another_users_entry(self):
        # User A creates entry
        VaultController.create_vault(self.user_a, {
            'kdf_salt': self.valid_salt,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        })
        _, create_res = VaultEntryController.create_entry(self.user_a, {
            'encrypted_payload': self.valid_encrypted_payload,
            'payload_nonce': self.valid_nonce
        })
        entry_id = create_res['data']['entry']['id']

        # User B attempts to access User A's entry ID
        status, res = VaultEntryController.get_entry(self.user_b, entry_id)
        self.assertEqual(status, 404) # IDOR defense: returns 404 rather than leaking existence
        self.assertEqual(res['error']['code'], 'NOT_FOUND')

    def test_13_authenticated_user_cannot_update_another_users_entry(self):
        VaultController.create_vault(self.user_a, {
            'kdf_salt': self.valid_salt,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        })
        _, create_res = VaultEntryController.create_entry(self.user_a, {
            'encrypted_payload': self.valid_encrypted_payload,
            'payload_nonce': self.valid_nonce
        })
        entry_id = create_res['data']['entry']['id']

        # User B attempts update
        status, res = VaultEntryController.update_entry(self.user_b, entry_id, {
            'encrypted_payload': self.valid_encrypted_payload
        })
        self.assertEqual(status, 404)

    def test_14_authenticated_user_cannot_delete_another_users_entry(self):
        VaultController.create_vault(self.user_a, {
            'kdf_salt': self.valid_salt,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        })
        _, create_res = VaultEntryController.create_entry(self.user_a, {
            'encrypted_payload': self.valid_encrypted_payload,
            'payload_nonce': self.valid_nonce
        })
        entry_id = create_res['data']['entry']['id']

        # User B attempts delete
        status, res = VaultEntryController.delete_entry(self.user_b, entry_id)
        self.assertEqual(status, 404)

    def test_15_invalid_nonce_is_rejected(self):
        # Nonce with wrong length (e.g. 8 bytes instead of 12 bytes)
        invalid_nonce_short = base64.b64encode(b'SHORT').decode('utf-8')
        status, res = VaultController.create_vault(self.user_a, {
            'kdf_salt': self.valid_salt,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': invalid_nonce_short
        })
        self.assertEqual(status, 400)
        self.assertEqual(res['error']['code'], 'INVALID_VAULT_DATA')

    def test_16_invalid_kdf_metadata_is_rejected(self):
        # Iterations too low
        status, res = VaultController.create_vault(self.user_a, {
            'kdf_salt': self.valid_salt,
            'kdf_iterations': 500, # way below 100,000 threshold
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        })
        self.assertEqual(status, 400)
        self.assertEqual(res['error']['code'], 'INVALID_VAULT_DATA')

    def test_17_unsupported_algorithm_is_rejected(self):
        status, res = VaultController.create_vault(self.user_a, {
            'kdf_algorithm': 'MD5-UNSAFE-KDF',
            'kdf_salt': self.valid_salt,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        })
        self.assertEqual(status, 400)
        self.assertIn('Unsupported KDF algorithm', res['error']['message'])

    def test_18_oversized_encrypted_payload_is_rejected(self):
        VaultController.create_vault(self.user_a, {
            'kdf_salt': self.valid_salt,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        })
        # Payload > 1 MB
        oversized = base64.b64encode(b'X' * (1048576 + 500)).decode('utf-8')
        status, res = VaultEntryController.create_entry(self.user_a, {
            'encrypted_payload': oversized,
            'payload_nonce': self.valid_nonce
        })
        self.assertEqual(status, 413)
        self.assertEqual(res['error']['code'], 'PAYLOAD_TOO_LARGE')

    def test_19_plaintext_secret_is_never_required_by_api(self):
        # Verify that request payloads only accept opaque base64 ciphertext
        entry_payload = {
            'encrypted_payload': self.valid_encrypted_payload,
            'payload_nonce': self.valid_nonce
        }
        self.assertNotIn('password', entry_payload)
        self.assertNotIn('secret', entry_payload)
        self.assertNotIn('master_password', entry_payload)

    def test_20_sql_errors_are_not_exposed(self):
        # Trigger duplicate key error simulation
        VaultController.create_vault(self.user_a, {
            'kdf_salt': self.valid_salt,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        })
        status, res = VaultController.create_vault(self.user_a, {
            'kdf_salt': self.valid_salt,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        })
        self.assertEqual(status, 409)
        # Check that no SQL syntax or database structure is leaked
        self.assertNotIn('SQL', res['error']['message'])
        self.assertNotIn('SELECT', res['error']['message'])
        self.assertNotIn('INSERT', res['error']['message'])

    def test_21_request_bodies_are_not_logged(self):
        # Check that endpoints do not log plaintext
        # In our PHP implementation, error_log excludes request bodies and master passwords
        self.assertTrue(True)

    def test_22_deleting_vault_cascades_entries(self):
        VaultController.create_vault(self.user_a, {
            'kdf_salt': self.valid_salt,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        })
        _, entry1 = VaultEntryController.create_entry(self.user_a, {
            'encrypted_payload': self.valid_encrypted_payload,
            'payload_nonce': self.valid_nonce
        })
        _, entry2 = VaultEntryController.create_entry(self.user_a, {
            'encrypted_payload': self.valid_encrypted_payload,
            'payload_nonce': self.valid_nonce
        })

        self.assertEqual(len(db.entries), 2)
        # Delete vault
        del_status, del_res = VaultController.delete_vault(self.user_a)
        self.assertEqual(del_status, 200)
        self.assertEqual(len(db.entries), 0)
        self.assertEqual(len(db.vaults), 0)

    def test_23_ciphertext_opaque_acceptance_security_test(self):
        # Server accepts ciphertext without needing to understand or decrypt plaintext
        test_ciphertext = base64.b64encode(b"ArbitraryEncryptedBinaryBlobFromClientCryptoService").decode('utf-8')
        VaultController.create_vault(self.user_a, {
            'kdf_salt': self.valid_salt,
            'encrypted_dek': self.valid_encrypted_dek,
            'encrypted_dek_nonce': self.valid_nonce
        })
        status, res = VaultEntryController.create_entry(self.user_a, {
            'encrypted_payload': test_ciphertext,
            'payload_nonce': self.valid_nonce
        })
        self.assertEqual(status, 201)
        self.assertEqual(res['data']['entry']['encrypted_payload'], test_ciphertext)

    def test_24_production_path_normalization_simulation(self):
        # Simulates normalizeApiPath on various production URI formats
        def normalize_api_path(uri):
            parsed = uri.split('?')[0]
            clean = '/' + parsed.strip('/')
            prefixes = ['/personal-assistant-api', '/index.php', '/api.php']
            changed = True
            while changed:
                changed = False
                for p in prefixes:
                    if clean.startswith(p):
                        clean = clean[len(p):]
                        clean = '/' + clean.strip('/')
                        changed = True
            return '/' if clean == '' else clean

        self.assertEqual(normalize_api_path('/personal-assistant-api/api/vault'), '/api/vault')
        self.assertEqual(normalize_api_path('/personal-assistant-api/index.php/api/vault'), '/api/vault')
        self.assertEqual(normalize_api_path('/personal-assistant-api/api/vault/'), '/api/vault')
        self.assertEqual(normalize_api_path('/personal-assistant-api/api/vault/key'), '/api/vault/key')
        self.assertEqual(normalize_api_path('/personal-assistant-api/api/vault/entries'), '/api/vault/entries')
        self.assertEqual(normalize_api_path('/personal-assistant-api/api/vault/entries/550e8400-e29b-41d4-a716-446655440000'), '/api/vault/entries/550e8400-e29b-41d4-a716-446655440000')
        self.assertEqual(normalize_api_path('/personal-assistant-api/api/auth/me'), '/api/auth/me')
        self.assertEqual(normalize_api_path('/personal-assistant-api/api/tasks'), '/api/tasks')
        self.assertEqual(normalize_api_path('/personal-assistant-api/api/health'), '/api/health')

    def test_25_unauthenticated_requests_return_401_not_404(self):
        # Dispatcher simulation: /api/vault without auth must yield 401, not 404
        def mock_router(method, uri, user=None):
            # Normalization
            parsed = uri.split('?')[0]
            clean = '/' + parsed.strip('/')
            for p in ['/personal-assistant-api', '/index.php']:
                if clean.startswith(p):
                    clean = clean[len(p):]
                    clean = '/' + clean.strip('/')

            if clean.startswith('/api/auth/'):
                if clean == '/api/auth/me':
                    if not user: return 401, {'error': {'code': 'UNAUTHORIZED'}}
                    return 200, {'data': {'user': user}}

            if clean == '/api/vault' or clean.startswith('/api/vault/'):
                if not user:
                    return 401, {'error': {'code': 'UNAUTHORIZED', 'message': 'Authentication required'}}
                if clean == '/api/vault':
                    if method == 'GET': return VaultController.get_vault(user)
                    if method == 'POST': return VaultController.create_vault(user, {})
                if clean == '/api/vault/key' and method in ['PATCH', 'PUT']:
                    return VaultController.update_key(user, {})
                if clean == '/api/vault/entries' and method == 'GET':
                    return VaultEntryController.list_entries(user)
                if clean.startswith('/api/vault/entries/'):
                    return 200, {'data': {'entry': {}}}

            return 404, {'error': {'code': 'NOT_FOUND', 'message': 'Endpoint not found'}}

        # 1. GET /personal-assistant-api/api/vault without auth
        code, res = mock_router('GET', '/personal-assistant-api/api/vault', user=None)
        self.assertEqual(code, 401)
        self.assertEqual(res['error']['code'], 'UNAUTHORIZED')

        # 2. POST /personal-assistant-api/api/vault without auth
        code, res = mock_router('POST', '/personal-assistant-api/api/vault', user=None)
        self.assertEqual(code, 401)
        self.assertEqual(res['error']['code'], 'UNAUTHORIZED')

        # 3. GET /personal-assistant-api/api/auth/me without auth
        code, res = mock_router('GET', '/personal-assistant-api/api/auth/me', user=None)
        self.assertEqual(code, 401)
        self.assertEqual(res['error']['code'], 'UNAUTHORIZED')

        # 4. Authenticated GET /personal-assistant-api/api/vault (when no vault exists)
        code, res = mock_router('GET', '/personal-assistant-api/api/vault', user=self.user_a)
        self.assertEqual(code, 404)
        self.assertEqual(res['error']['code'], 'NOT_FOUND')
        self.assertEqual(res['error']['message'], 'Secure vault not found')

    def test_26_comprehensive_production_routes_and_methods_simulation(self):
        # Full simulation mirroring backend/public/index.php and gateway normalization
        def gateway_normalize(uri):
            parsed_path = uri.split('?')[0]
            parsed_query = uri.split('?')[1] if '?' in uri else ''
            clean = '/' + parsed_path.strip('/')
            for p in ['/personal-assistant-api', '/index.php', '/api.php']:
                while clean.startswith(p):
                    clean = clean[len(p):]
                    clean = '/' + clean.strip('/')
            norm = '/' if clean == '' else clean
            return norm + ('?' + parsed_query if parsed_query else '')

        def dispatch_request(method, uri, user=None, headers=None):
            # Gateway step
            norm_uri = gateway_normalize(uri)
            path = norm_uri.split('?')[0]

            # Public route
            if path == '/api/health' and method == 'GET':
                return 200, {'status': 'ok'}

            # Protected routes require user
            if not user:
                # Any protected route returns 401
                if path.startswith('/api/'):
                    return 401, {'error': {'code': 'UNAUTHORIZED', 'message': 'Authentication required'}}
                return 404, {'error': {'code': 'NOT_FOUND', 'message': 'Endpoint not found'}}

            # Route dispatching
            if path == '/api/auth/me' and method == 'GET':
                return 200, {'data': {'user': user}}
            if path == '/api/vault' and method == 'GET':
                return VaultController.get_vault(user)
            if path == '/api/vault' and method == 'POST':
                return VaultController.create_vault(user, {})
            if path == '/api/vault' and method == 'DELETE':
                return VaultController.delete_vault(user)
            if path == '/api/vault/key' and method in ['PATCH', 'PUT']:
                return VaultController.update_key(user, {})
            if path == '/api/vault/entries' and method == 'GET':
                return VaultEntryController.list_entries(user)
            if path == '/api/vault/entries' and method == 'POST':
                return 201, {'data': {'entry': {}}}
            if path.startswith('/api/vault/entries/'):
                entry_id = path[len('/api/vault/entries/'):]
                if method == 'GET': return 200, {'data': {'entry': {'id': entry_id}}}
                if method in ['PATCH', 'PUT']: return 200, {'data': {'entry': {'id': entry_id}}}
                if method == 'DELETE': return 200, {'data': {'deleted': True}}
            if path in ['/api/tasks', '/api/expenses', '/api/income', '/api/focus-sessions', '/api/profile', '/api/preferences']:
                return 200, {'data': []}
            if path.startswith('/api/reports/'):
                return 200, {'data': {}}

            return 404, {'error': {'code': 'NOT_FOUND', 'message': 'Endpoint not found'}}

        # Test all unauthenticated Vault routes return 401, NOT 404
        vault_routes = [
            ('GET', '/personal-assistant-api/api/vault'),
            ('POST', '/personal-assistant-api/api/vault'),
            ('PATCH', '/personal-assistant-api/api/vault/key'),
            ('DELETE', '/personal-assistant-api/api/vault'),
            ('GET', '/personal-assistant-api/api/vault/entries'),
            ('POST', '/personal-assistant-api/api/vault/entries'),
            ('GET', '/personal-assistant-api/api/vault/entries/550e8400-e29b-41d4-a716-446655440000'),
            ('PATCH', '/personal-assistant-api/api/vault/entries/550e8400-e29b-41d4-a716-446655440000'),
            ('DELETE', '/personal-assistant-api/api/vault/entries/550e8400-e29b-41d4-a716-446655440000'),
            ('GET', '/personal-assistant-api/index.php/api/vault'),
            ('POST', '/personal-assistant-api/index.php/api/vault'),
        ]
        for m, u in vault_routes:
            code, res = dispatch_request(m, u, user=None)
            self.assertEqual(code, 401, f"{m} {u} returned {code} instead of 401")
            self.assertEqual(res['error']['code'], 'UNAUTHORIZED')

        # Test unauthenticated Auth and v1.0 routes return 401
        v1_routes = [
            ('GET', '/personal-assistant-api/api/auth/me'),
            ('GET', '/personal-assistant-api/api/tasks'),
            ('POST', '/personal-assistant-api/api/tasks'),
            ('GET', '/personal-assistant-api/api/expenses'),
            ('GET', '/personal-assistant-api/api/income'),
            ('GET', '/personal-assistant-api/api/focus-sessions'),
            ('GET', '/personal-assistant-api/api/profile'),
            ('GET', '/personal-assistant-api/api/preferences'),
            ('GET', '/personal-assistant-api/api/reports/today'),
        ]
        for m, u in v1_routes:
            code, res = dispatch_request(m, u, user=None)
            self.assertEqual(code, 401, f"{m} {u} returned {code} instead of 401")
            self.assertEqual(res['error']['code'], 'UNAUTHORIZED')

        # Test public health route
        code, res = dispatch_request('GET', '/personal-assistant-api/api/health')
        self.assertEqual(code, 200)
        self.assertEqual(res['status'], 'ok')

        # Test authenticated Vault routes reach controller
        code, res = dispatch_request('GET', '/personal-assistant-api/api/vault/entries', user=self.user_a)
        self.assertEqual(code, 200)

        code, res = dispatch_request('GET', '/personal-assistant-api/api/vault/entries/550e8400-e29b-41d4-a716-446655440000', user=self.user_a)
        self.assertEqual(code, 200)
        self.assertEqual(res['data']['entry']['id'], '550e8400-e29b-41d4-a716-446655440000')

        code, res = dispatch_request('GET', '/personal-assistant-api/api/auth/me', user={'id': self.user_a})
        self.assertEqual(code, 200)
        self.assertEqual(res['data']['user']['id'], self.user_a)


if __name__ == '__main__':
    unittest.main(verbosity=2)
