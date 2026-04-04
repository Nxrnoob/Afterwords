const ITERATIONS = 100000;
const SALT = new TextEncoder().encode("Afterword-Master-Salt"); // App-wide salt for PBKDF2

function bufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(buffer[i]);
    }
    return window.btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * Derives a strong AES-GCM key from the user's password using PBKDF2
 */
export async function deriveKey(password: string, secretKeyStr?: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterialStr = secretKeyStr ? `${password}:${secretKeyStr}` : password;
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(keyMaterialStr),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: SALT,
            iterations: ITERATIONS,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

/**
 * Exports a CryptoKey to a Base64 string for sessionStorage
 */
export async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return bufferToBase64(new Uint8Array(exported));
}

/**
 * Imports a Base64 string from sessionStorage back into a CryptoKey
 */
export async function importKey(base64Key: string): Promise<CryptoKey> {
    const binaryDer = base64ToBuffer(base64Key);
    return window.crypto.subtle.importKey(
        "raw",
        binaryDer as any,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypts data and returns: CLIENT_ENCRYPTED:${base64Iv}:${base64Cipher}
 */
export async function encryptData(text: string, key: CryptoKey): Promise<string> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    
    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            // @ts-ignore
            iv: iv,
        },
        key,
        enc.encode(text)
    );
    
    const base64Cipher = bufferToBase64(new Uint8Array(ciphertext));
    const base64Iv = bufferToBase64(iv);
    
    return `CLIENT_ENCRYPTED:${base64Iv}:${base64Cipher}`;
}

/**
 * Decrypts data formatted as: CLIENT_ENCRYPTED:${base64Iv}:${base64Cipher}
 */
export async function decryptData(encryptedStr: string, key: CryptoKey): Promise<string> {
    if (!encryptedStr.startsWith("CLIENT_ENCRYPTED:")) throw new Error("Not a client-encrypted string");
    
    const parts = encryptedStr.replace("CLIENT_ENCRYPTED:", "").split(":");
    if (parts.length !== 2) throw new Error("Invalid client-encrypted format");
    
    const iv = base64ToBuffer(parts[0]);
    const ciphertext = base64ToBuffer(parts[1]);
    
    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv as any,
        },
        key,
        ciphertext as any
    );
    
    return new TextDecoder().decode(decrypted);
}
