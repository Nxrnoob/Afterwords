"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"

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

    const attachments = [{
        filename: `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_secure_payload.txt`,
        content: attachmentContent
    }]

    let emailsSent = 0
    for (const recipientEmail of Array.from(recipients)) {
        try {
            await sendEmail({
                to: recipientEmail,
                subject: `🔐 Explicit Secure Release: "${item.title}" from ${user.email}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
                        <h2>A vault item has been released to you manually</h2>
                        <p>The user <strong>${user.email}</strong> requested an immediate, manual release of their secure item titled:</p>
                        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            <strong style="font-size: 18px;">"${item.title}"</strong>
                        </div>
                        <p style="margin-top: 20px;">
                            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" 
                               style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                View on Afterword →
                            </a>
                        </p>
                        <p style="margin-top: 20px; font-size: 13px; color: #666;">
                            <strong>Note:</strong> The securely encrypted payload is also attached to this email as a text file for permanent safekeeping.
                        </p>
                    </div>
                `,
                attachments
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
