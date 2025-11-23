/**
 * Bundle containing encrypted master key and all parameters needed for decryption.
 */
export interface EncryptedMasterKeyBundle {
    /** Base64-encoded encrypted master key */
    encryptedMasterKey: string;
    /** Base64-encoded nonce/IV used for master key encryption */
    masterKeyNonce: string;
    /** Base64-encoded salt used for key derivation */
    masterKeySalt: string;
    /** Number of PBKDF2 iterations (maps to argon_memory on backend) */
    iterations: number;
}

/**
 * Encrypted data structure for content encryption.
 */
export interface EncryptedData {
    /** Base64-encoded ciphertext */
    ciphertext: string;
    /** Base64-encoded initialization vector */
    iv: string;
}

/**
 * CryptoManager - Handles end-to-end encryption for the application.
 * 
 * Implements AES-GCM encryption with PBKDF2 key derivation. Manages the master key
 * lifecycle including generation, encryption, decryption, and storage in memory.
 * Uses Web Crypto API for all cryptographic operations.
 * 
 * Security features:
 * - AES-GCM 256-bit encryption
 * - PBKDF2 key derivation with 600,000 iterations
 * - Random nonces/IVs for each encryption
 * - Master key stored only in memory, never persisted
 */
export class CryptoManager {
    private static instance: CryptoManager;
    private masterKey: CryptoKey | null = null;
    private readonly ALGORITHM = 'AES-GCM';
    private readonly KDF_ALGORITHM = 'PBKDF2';
    private readonly HASH_ALGORITHM = 'SHA-256';
    private readonly KEY_LENGTH = 256;
    private readonly SALT_LENGTH = 16;
    private readonly IV_LENGTH = 12;
    private readonly DEFAULT_ITERATIONS = 600000; // OWASP recommendation for PBKDF2

    private constructor() {}

    // TODO: Remove this method in production
    /**
     * Use this method to log internal details for debugging purposes.
     * Shall only be used in development environment.
     * Remove or disable in production!
     */
    public logCryptoManagerDetails() {
        console.log("Master Key Value: ", this.masterKey);
        console.log("Algorithm: ", this.ALGORITHM);
    }

    public static getInstance(): CryptoManager {
        if (!CryptoManager.instance) {
            CryptoManager.instance = new CryptoManager();
        }
        return CryptoManager.instance;
    }

    /**
     * Checks if the master key is loaded in memory.
     */
    public hasMasterKey(): boolean {
        return this.masterKey !== null;
    }

    /**
     * Clears the master key from memory (e.g., on logout).
     */
    public clearMasterKey(): void {
        this.masterKey = null;
    }

    /**
     * Generates a new random Master Key and encrypts it with the user's password.
     * Used during Registration.
     */
    public async generateAndEncryptMasterKey(password: string): Promise<EncryptedMasterKeyBundle> {
        // 1. Generate a new Master Key (AES-GCM 256)
        const masterKey = await window.crypto.subtle.generateKey(
            {
                name: this.ALGORITHM,
                length: this.KEY_LENGTH,
            },
            true, // extractable (we need to export it to encrypt it)
            ['encrypt', 'decrypt']
        );

        // 2. Generate a random Salt
        const salt = window.crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));

        // 3. Derive a Wrapping Key from the password
        const wrappingKey = await this.deriveKeyFromPassword(password, salt, this.DEFAULT_ITERATIONS);

        // 4. Export the Master Key to raw bytes
        const masterKeyRaw = await window.crypto.subtle.exportKey('raw', masterKey);

        // 5. Encrypt the Master Key using the Wrapping Key
        const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
        const encryptedMasterKeyBuffer = await window.crypto.subtle.encrypt(
            {
                name: this.ALGORITHM,
                iv: iv,
            },
            wrappingKey,
            masterKeyRaw
        );

        // 6. Store the master key in memory for immediate use
        this.masterKey = masterKey;

        // 7. Return the bundle to be sent to the server
        return {
            encryptedMasterKey: this.arrayBufferToBase64(encryptedMasterKeyBuffer),
            masterKeyNonce: this.arrayBufferToBase64(iv),
            masterKeySalt: this.arrayBufferToBase64(salt),
            iterations: this.DEFAULT_ITERATIONS,
        };
    }

    /**
     * Decrypts the Master Key using the user's password and the bundle from the server.
     * Used during Login.
     */
    public async decryptMasterKey(password: string, bundle: EncryptedMasterKeyBundle): Promise<void> {
        try {
            const salt = this.base64ToArrayBuffer(bundle.masterKeySalt);
            const iv = this.base64ToArrayBuffer(bundle.masterKeyNonce);
            const encryptedMasterKey = this.base64ToArrayBuffer(bundle.encryptedMasterKey);
            const iterations = bundle.iterations || this.DEFAULT_ITERATIONS;

            // 1. Derive the Wrapping Key from the password
            const wrappingKey = await this.deriveKeyFromPassword(password, new Uint8Array(salt), iterations);

            // 2. Decrypt the Master Key
            const masterKeyRaw = await window.crypto.subtle.decrypt(
                {
                    name: this.ALGORITHM,
                    iv: new Uint8Array(iv),
                },
                wrappingKey,
                encryptedMasterKey
            );

            // 3. Import the Master Key back into a CryptoKey object
            this.masterKey = await window.crypto.subtle.importKey(
                'raw',
                masterKeyRaw,
                {
                    name: this.ALGORITHM,
                    length: this.KEY_LENGTH,
                },
                false, // not extractable anymore, we keep it in memory
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error("Failed to decrypt master key:", error);
            throw new Error("Invalid password or corrupted key data.");
        }
    }

    /**
     * Encrypts a string (e.g., note content) using the loaded Master Key.
     */
    public async encryptData(plaintext: string): Promise<EncryptedData> {
        if (!this.masterKey) {
            throw new Error("Master key not loaded.");
        }

        const encodedText = new TextEncoder().encode(plaintext);
        const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

        const ciphertextBuffer = await window.crypto.subtle.encrypt(
            {
                name: this.ALGORITHM,
                iv: iv,
            },
            this.masterKey,
            encodedText
        );

        return {
            ciphertext: this.arrayBufferToBase64(ciphertextBuffer),
            iv: this.arrayBufferToBase64(iv),
        };
    }

    /**
     * Decrypts a string (e.g., note content) using the loaded Master Key.
     */
    public async decryptData(encryptedData: EncryptedData): Promise<string> {
        if (!this.masterKey) {
            throw new Error("Master key not loaded.");
        }

        const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);
        const iv = this.base64ToArrayBuffer(encryptedData.iv);

        const plaintextBuffer = await window.crypto.subtle.decrypt(
            {
                name: this.ALGORITHM,
                iv: new Uint8Array(iv),
            },
            this.masterKey,
            ciphertext
        );

        return new TextDecoder().decode(plaintextBuffer);
    }

    // --- Helper Methods ---

    /**
     * Derive an encryption key from a password using PBKDF2.
     * @param password - User's password
     * @param salt - Salt for key derivation
     * @param iterations - Number of PBKDF2 iterations
     * @returns Derived AES-GCM encryption key
     */
    private async deriveKeyFromPassword(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
        const passwordBuffer = new TextEncoder().encode(password);

        // Import password as a key
        const passwordKey = await window.crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: this.KDF_ALGORITHM },
            false,
            ['deriveKey']
        );

        // Derive the AES-GCM key
        return window.crypto.subtle.deriveKey(
            {
                name: this.KDF_ALGORITHM,
                salt: salt as unknown as BufferSource,
                iterations: iterations,
                hash: this.HASH_ALGORITHM,
            },
            passwordKey,
            {
                name: this.ALGORITHM,
                length: this.KEY_LENGTH,
            },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Convert ArrayBuffer to base64 string for transmission/storage.
     * @param buffer - ArrayBuffer or typed array to encode
     * @returns Base64-encoded string
     */
    private arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferView): string {
        let binary = '';
        let bytes: Uint8Array;
        
        if (buffer instanceof Uint8Array) {
            bytes = buffer;
        } else if (ArrayBuffer.isView(buffer)) {
            bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        } else {
            bytes = new Uint8Array(buffer as ArrayBuffer);
        }

        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    /**
     * Convert base64 string to ArrayBuffer for cryptographic operations.
     * @param base64 - Base64-encoded string
     * @returns Decoded ArrayBuffer
     */
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
}
