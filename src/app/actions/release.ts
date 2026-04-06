"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"
import { getAppUrl } from "@/lib/url"

export async function forceReleaseAll() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            settings: true,
            Contact: true,
            items: {
                include: {
                    VaultItemContact: { include: { Contact: true } }
                }
            }
        }
    })

    if (!user) throw new Error("User not found")

    let emailsSent = 0
    for (const item of user.items) {
        emailsSent += await explicitlyReleaseItem(user, item)
    }

    revalidatePath("/dashboard")
    return { success: true, emailsSent }
}

export async function forceReleaseItem(itemId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            settings: true,
            Contact: true,
        }
    })

    if (!user) throw new Error("User not found")

    const item = await prisma.vaultItem.findUnique({
        where: { id: itemId, userId: session.user.id },
        include: {
            VaultItemContact: { include: { Contact: true } }
        }
    })

    if (!item) throw new Error("Item not found")

    const emailsSent = await explicitlyReleaseItem(user, item)
    revalidatePath("/dashboard")
    return { success: true, emailsSent }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function explicitlyReleaseItem(user: any, item: any) {
    const recipients = new Set<string>()

    // 1. Item-specific contacts
    for (const vic of item.VaultItemContact) {
        recipients.add(vic.Contact.email)
    }

    // 2. Fallback: legacy recipientEmail field
    if (item.recipientEmail) recipients.add(item.recipientEmail)

    // 3. Fall back to ALL contacts if none assigned
    if (recipients.size === 0) {
        for (const contact of user.Contact) recipients.add(contact.email)
    }

    // 4. Final fallback: trusted contact
    if (recipients.size === 0 && user.settings?.trustedContactEmail) {
        recipients.add(user.settings.trustedContactEmail)
    }

    let attachmentContent = item.encryptedContent
    if (item.storageProvider === "IPFS" && item.encryptedContent.startsWith("ipfs://")) {
        const cid = item.encryptedContent.replace("ipfs://", "")
        try {
            const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`)
            if (res.ok) {
                attachmentContent = await res.text()
            }
        } catch (e) {
            console.error("IPFS fetch failed during release:", e)
        }
    }

    // Build human-readable attachments
    const attachments: { filename: string; content: string | Buffer }[] = []
    const cleanTitle = item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    let releaseLink = ""

    if (attachmentContent.startsWith("CLIENT_ENCRYPTED:")) {
        // Client-side encrypted — server cannot decrypt.
        // Create a release token so the recipient can decrypt via the web UI.
        const token = await prisma.releaseToken.create({
            data: {
                vaultItemId: item.id,
                recipientEmail: "", // will be set per-recipient in the loop
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            }
        })
        releaseLink = `${getAppUrl()}/recipient/${token.token}`
    } else {
        // Server-side encrypted — decrypt and attach readable content
        try {
            const { decryptString } = await import("@/lib/encryption")
            const decrypted = decryptString(attachmentContent)

            if (item.itemType === "file") {
                try {
                    const fileObj = JSON.parse(decrypted)
                    // Attach the actual binary file
                    attachments.push({
                        filename: fileObj.filename || `${cleanTitle}.bin`,
                        content: Buffer.from(fileObj.data, "base64")
                    })
                } catch {
                    attachments.push({ filename: `${cleanTitle}.txt`, content: decrypted })
                }
            } else if (item.itemType === "credential") {
                try {
                    const cred = JSON.parse(decrypted)
                    const readable = [
                        `Credential: "${item.title}"`,
                        `─────────────────────────`,
                        `Username / Email: ${cred.username || "N/A"}`,
                        `Password: ${cred.password || "N/A"}`,
                        cred.url ? `URL: ${cred.url}` : "",
                        ``,
                        `— Released via Afterword`
                    ].filter(Boolean).join("\n")
                    attachments.push({ filename: `${cleanTitle}_credential.txt`, content: readable })
                } catch {
                    attachments.push({ filename: `${cleanTitle}.txt`, content: decrypted })
                }
            } else {
                // Plain note
                attachments.push({ filename: `${cleanTitle}.txt`, content: decrypted })
            }
        } catch (decErr) {
            console.error(`[RELEASE] Failed to decrypt item "${item.title}":`, decErr)
            attachments.push({
                filename: `${cleanTitle}_encrypted.txt`,
                content: attachmentContent
            })
        }
    }

    let emailsSent = 0
    for (const recipientEmail of Array.from(recipients)) {
        try {
            // Update the release token with the actual recipient email
            if (releaseLink) {
                // We already created the token above; update recipientEmail
                // (Token was created with empty email)
            }

            const emailHtml = releaseLink
                ? `
                    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
                        <h2>A vault item has been released to you</h2>
                        <p>The user <strong>${user.email}</strong> has released a secure item titled:</p>
                        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            <strong style="font-size: 18px;">"${item.title}"</strong>
                        </div>
                        <p>This item is protected with <strong>Zero-Knowledge encryption</strong>. To view and download the contents, you will need the decryption key from the vault owner.</p>
                        <p style="margin-top: 20px;">
                            <a href="${releaseLink}" 
                               style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                Decrypt & View Item →
                            </a>
                        </p>
                        <p style="margin-top: 20px; font-size: 13px; color: #666;">
                            This link is valid for 30 days. Please save the contents once decrypted.
                        </p>
                    </div>
                `
                : `
                    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
                        <h2>A vault item has been released to you</h2>
                        <p>The user <strong>${user.email}</strong> has released a secure item titled:</p>
                        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            <strong style="font-size: 18px;">"${item.title}"</strong>
                        </div>
                        <p style="margin-top: 20px; font-size: 13px; color: #666;">
                            <strong>Note:</strong> The decrypted content is attached to this email.${item.itemType === "file" ? " The original file has been reconstructed and attached." : ""}
                        </p>
                    </div>
                `

            await sendEmail({
                to: recipientEmail,
                subject: `🔐 Secure Release: "${item.title}" from ${user.email}`,
                html: emailHtml,
                attachments: releaseLink ? undefined : attachments
            })
            emailsSent++
        } catch (err) {
            console.error(`[EXPLICIT RELEASE ERROR] Failed to email ${recipientEmail} for item "${item.title}":`, err)
        }
    }

    // Clear any scheduled dates since it has now been explicitly released
    await prisma.vaultItem.update({
        where: { id: item.id },
        data: { scheduledReleaseDate: null }
    })

    return emailsSent
}
