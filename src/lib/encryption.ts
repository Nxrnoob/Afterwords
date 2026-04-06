import { randomBytes, createCipheriv, createDecipheriv } from "crypto"

// We must use a separate system-level encryption key for encrypting vault items at rest so the database only holds ciphertext.
// In production, this would be an environment variable.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef" // 32 bytes for aes-256-gcm

export function encryptString(text: string): string {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()

    // Format: iv:encrypted:authTag
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`
}

export function decryptString(text: string): string {
    const parts = text.split(':')
    if (parts.length !== 3) {
        try {
            const decoded = Buffer.from(text, 'base64').toString('utf8')
            if (decoded.startsWith("ENCRYPTED:")) {
                return decoded.replace("ENCRYPTED:", "")
            }
        } catch {
            // Ignore error
        }
        throw new Error("Invalid encrypted text format")
    }

    try {
        const [ivHex, encryptedHex, authTagHex] = parts
        const iv = Buffer.from(ivHex, 'hex')
        const authTag = Buffer.from(authTagHex, 'hex')
        const decipher = createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv)

        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    } catch {
        throw new Error("Decryption failed. The key may have changed or data is corrupted.")
    }
}
