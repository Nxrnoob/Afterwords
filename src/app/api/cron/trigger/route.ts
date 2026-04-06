import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { getAppUrl } from "@/lib/url"

/**
 * POST /api/cron/trigger
 * 
 * This endpoint checks all users for missed check-ins and triggers
 * grace periods, warning emails, and vault releases as needed.
 * 
 * In production, this would be called by an external cron scheduler
 * (Vercel Cron, Railway, or a simple system crontab) every hour or so.
 * 
 * For testing, you can call it manually:
 *   curl -X POST http://localhost:3000/api/cron/trigger
 * 
 * Query params:
 *   ?testMode=true  — uses MINUTES instead of DAYS for quick local testing
 */
export async function POST(req: Request) {
    const url = new URL(req.url)
    const testMode = url.searchParams.get("testMode") === "true"

    const users = await prisma.user.findMany({
        include: {
            settings: true,
            gracePeriods: true,
            items: {
                include: {
                    VaultItemContact: { include: { Contact: true } }
                }
            },
            Contact: true,
        }
    })

    const results = []

    for (const user of users) {
        if (user.settings?.isPaused) {
            results.push({ user: user.email, action: "Skipped (Emergency Pause Active)" })
            continue
        }

        // --- Scheduled Release Date check (global) ---
        const scheduledReleaseDate = user.settings?.scheduledReleaseDate
        if (scheduledReleaseDate && new Date(scheduledReleaseDate) <= new Date()) {
            const emailsSent = await releaseVaultItems(user)
            results.push({ user: user.email, action: `RELEASE_VAULT (Scheduled Date Reached) — ${emailsSent} emails sent` })
            continue
        }

        // --- Per-item scheduled release check ---
        const now = new Date()
        for (const item of user.items) {
            if (item.scheduledReleaseDate && new Date(item.scheduledReleaseDate) <= now) {
                const recipients = new Set<string>()
                for (const vic of item.VaultItemContact) {
                    recipients.add(vic.Contact.email)
                }
                if (item.recipientEmail) recipients.add(item.recipientEmail)
                if (recipients.size === 0) {
                    for (const contact of user.Contact) recipients.add(contact.email)
                }
                if (recipients.size === 0 && user.settings?.trustedContactEmail) {
                    recipients.add(user.settings.trustedContactEmail)
                }

                for (const email of Array.from(recipients)) {
                    try {
                        await sendEmail({
                            to: email,
                            subject: `🔐 Scheduled Release: "${item.title}" from ${user.email}`,
                            html: `
                                <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
                                    <h2>A scheduled vault item has been released</h2>
                                    <p><strong>${user.email}</strong> scheduled the item "<strong>${item.title}</strong>" for release on ${new Date(item.scheduledReleaseDate!).toLocaleDateString()}.</p>
                                    <p style="margin-top: 20px;">
                                        <a href="${getAppUrl()}" 
                                           style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                            View on Afterword →
                                        </a>
                                    </p>
                                </div>
                            `
                        })
                    } catch (err) {
                        console.error(`[SCHEDULED RELEASE ERROR] ${email} for "${item.title}":`, err)
                    }
                }

                // Clear the scheduled date so it doesn't fire again
                await prisma.vaultItem.update({
                    where: { id: item.id },
                    data: { scheduledReleaseDate: null }
                })

                results.push({ user: user.email, action: `ITEM_RELEASED (Scheduled) — "${item.title}" sent to ${recipients.size} recipients` })
            }
        }

        // --- Check-in interval check ---
        const elapsed = Date.now() - user.lastCheckinAt.getTime()
        const interval = user.settings?.checkinIntervalDays || 30

        // In testMode, interval is treated as minutes. Normally, it's days.
        const divisor = testMode ? (1000 * 60) : (1000 * 60 * 60 * 24)
        const unitsSinceCheckin = Math.floor(elapsed / divisor)
        const unitLabel = testMode ? "minutes" : "days"

        if (unitsSinceCheckin >= interval) {
            const activeGracePeriod = user.gracePeriods.find(gp => !gp.resolved)

            if (!activeGracePeriod) {
                // --- Start grace period — send Warning 1 to user ---
                await prisma.gracePeriod.create({
                    data: {
                        userId: user.id,
                        warning1SentAt: new Date()
                    }
                })

                const emailResult = await sendEmail({
                    to: user.email,
                    subject: "⚠️ Action Required: Check in to Afterword",
                    html: `
                        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
                            <h2 style="color: #ef4444;">You missed your check-in</h2>
                            <p>You haven't checked in for <strong>${unitsSinceCheckin} ${unitLabel}</strong>.</p>
                            <p>If you don't check in during the grace period, your vault items will be released to your beneficiaries.</p>
                            <p style="margin-top: 20px;">
                                <a href="${getAppUrl()}/dashboard" 
                                   style="background: #fff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                    Check In Now →
                                </a>
                            </p>
                        </div>
                    `
                })

                results.push({
                    user: user.email,
                    action: `Started Grace Period — Warning 1 sent (${JSON.stringify(emailResult)})`
                })
            } else {
                const graceElapsed = Date.now() - activeGracePeriod.startedAt.getTime()
                const graceLimit = user.settings?.gracePeriodDays || 14
                const graceUnits = Math.floor(graceElapsed / divisor)

                if (graceUnits >= graceLimit) {
                    // --- RELEASE VAULT to all beneficiaries ---
                    const emailsSent = await releaseVaultItems(user)

                    // Mark grace period as resolved
                    await prisma.gracePeriod.update({
                        where: { id: activeGracePeriod.id },
                        data: { resolved: true, resolvedAt: new Date() }
                    })

                    results.push({
                        user: user.email,
                        action: `RELEASE_VAULT — Grace period expired after ${graceUnits} ${unitLabel}. ${emailsSent} emails sent.`
                    })
                } else if (graceUnits >= (testMode ? 1 : 7) && !activeGracePeriod.warning2SentAt) {
                    // --- Warning 2: notify trusted contact ---
                    await prisma.gracePeriod.update({
                        where: { id: activeGracePeriod.id },
                        data: { warning2SentAt: new Date() }
                    })

                    const trustedEmail = user.settings?.trustedContactEmail
                    if (trustedEmail) {
                        const emailResult = await sendEmail({
                            to: trustedEmail,
                            subject: "🔔 A trusted user may need your attention — Afterword",
                            html: `
                                <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
                                    <h2>A user you trust needs attention</h2>
                                    <p>The user <strong>${user.email}</strong> has missed their Afterword check-in and has been unresponsive for ${graceUnits} ${unitLabel}.</p>
                                    <p>If they don't check in soon, their secure vault will be released to you.</p>
                                </div>
                            `
                        })
                        results.push({ user: user.email, action: `Warning 2 — Trusted contact ${trustedEmail} notified (${JSON.stringify(emailResult)})` })
                    } else {
                        results.push({ user: user.email, action: "Warning 2 — No trusted contact email configured, skipped" })
                    }
                } else {
                    results.push({ user: user.email, action: `In grace period: ${graceUnits}/${graceLimit} ${unitLabel}` })
                }
            }
        } else {
            results.push({ user: user.email, action: `Safe (${unitsSinceCheckin}/${interval} ${unitLabel})` })
        }
    }

    return NextResponse.json({
        success: true,
        testMode,
        timestamp: new Date().toISOString(),
        processed: results
    })
}

/**
 * Sends release emails for ALL vault items belonging to a user.
 * Uses the new Contact model + VaultItemContact assignments.
 * Falls back to item.recipientEmail for legacy items.
 */
async function releaseVaultItems(user: {
    email: string
    items: Array<{
        id: string
        title: string
        itemType: string
        recipientEmail: string | null
        encryptedContent: string
        storageProvider: string
        VaultItemContact: Array<{ Contact: { email: string; name: string } }>
    }>
    Contact: Array<{ email: string; name: string }>
    settings: { trustedContactEmail: string | null } | null
}) {
    let emailsSent = 0

    for (const item of user.items) {
        // Collect all recipients for this item
        const recipients = new Set<string>()

        // 1. Item-specific contacts (from VaultItemContact M:N)
        for (const vic of item.VaultItemContact) {
            recipients.add(vic.Contact.email)
        }

        // 2. Fallback: legacy recipientEmail field
        if (item.recipientEmail) {
            recipients.add(item.recipientEmail)
        }

        // 3. If no specific assignment, fall back to ALL contacts
        if (recipients.size === 0) {
            for (const contact of user.Contact) {
                recipients.add(contact.email)
            }
        }

        // 4. Final fallback: trusted contact email from settings
        if (recipients.size === 0 && user.settings?.trustedContactEmail) {
            recipients.add(user.settings.trustedContactEmail)
        }

        // Prepare Attachment Content
        let attachmentContent = item.encryptedContent
        if (item.storageProvider === "IPFS" && item.encryptedContent.startsWith("ipfs://")) {
            const cid = item.encryptedContent.replace("ipfs://", "")
            try {
                const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`)
                if (res.ok) {
                    attachmentContent = await res.text()
                }
            } catch (e) {
                console.error("IPFS fetch failed during global cron release:", e)
            }
        }

        // Build human-readable attachments
        const attachments: { filename: string; content: string | Buffer }[] = []
        const cleanTitle = item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        let releaseLink = ""

        if (attachmentContent.startsWith("CLIENT_ENCRYPTED:")) {
            // Create a release token for the recipient to decrypt via web UI
            const token = await prisma.releaseToken.create({
                data: {
                    vaultItemId: item.id,
                    recipientEmail: "",
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                }
            })
            releaseLink = `${getAppUrl()}/recipient/${token.token}`
        } else {
            try {
                const { decryptString } = await import("@/lib/encryption")
                const decrypted = decryptString(attachmentContent)

                if (item.title && decrypted) {
                    // Try to detect item type from content
                    try {
                        const parsed = JSON.parse(decrypted)
                        if (parsed.filename && parsed.data) {
                            // File type
                            attachments.push({
                                filename: parsed.filename || `${cleanTitle}.bin`,
                                content: Buffer.from(parsed.data, "base64")
                            })
                        } else if (parsed.username) {
                            // Credential type
                            const readable = [
                                `Credential: "${item.title}"`,
                                `─────────────────────────`,
                                `Username / Email: ${parsed.username || "N/A"}`,
                                `Password: ${parsed.password || "N/A"}`,
                                parsed.url ? `URL: ${parsed.url}` : "",
                                ``,
                                `— Released via Afterword`
                            ].filter(Boolean).join("\n")
                            attachments.push({ filename: `${cleanTitle}_credential.txt`, content: readable })
                        } else {
                            attachments.push({ filename: `${cleanTitle}.txt`, content: decrypted })
                        }
                    } catch {
                        // Plain text note
                        attachments.push({ filename: `${cleanTitle}.txt`, content: decrypted })
                    }
                }
            } catch (decErr) {
                console.error(`[CRON RELEASE] Failed to decrypt item "${item.title}":`, decErr)
                attachments.push({
                    filename: `${cleanTitle}_encrypted.txt`,
                    content: attachmentContent
                })
            }
        }

        // Send to each recipient
        for (const recipientEmail of Array.from(recipients)) {
            try {
                const emailHtml = releaseLink
                    ? `
                        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
                            <h2>A vault item has been released to you</h2>
                            <p>The user <strong>${user.email}</strong> stored a secure item titled:</p>
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
                            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                            <p style="color: #999; font-size: 12px;">This is an automated message from Afterword.</p>
                        </div>
                    `
                    : `
                        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
                            <h2>A vault item has been released to you</h2>
                            <p>The user <strong>${user.email}</strong> stored a secure item titled:</p>
                            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                                <strong style="font-size: 18px;">"${item.title}"</strong>
                            </div>
                            <p>This item has been automatically released because the user did not check in within their configured interval.</p>
                            <p style="margin-top: 20px; font-size: 13px; color: #666;">
                                <strong>Note:</strong> The decrypted content is attached to this email.${item.itemType === "file" ? " The original file has been reconstructed and attached." : ""}
                            </p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                            <p style="color: #999; font-size: 12px;">This is an automated message from Afterword.</p>
                        </div>
                    `

                await sendEmail({
                    to: recipientEmail,
                    subject: `🔐 A Secure Vault Item has been released to you by ${user.email}`,
                    html: emailHtml,
                    attachments: releaseLink ? undefined : attachments
                })
                emailsSent++
                console.log(`[VAULT RELEASE] Sent email to ${recipientEmail} for item "${item.title}"`)
            } catch (err) {
                console.error(`[VAULT RELEASE ERROR] Failed to email ${recipientEmail} for item "${item.title}":`, err)
            }
        }
    }

    return emailsSent
}

// Also support GET for easy browser testing
export async function GET(req: Request) {
    return POST(req)
}
