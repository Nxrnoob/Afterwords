import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

// In a real Phase 1 MVP, this would be an Inngest cron job. 
// For this quick demo mockup, we expose an endpoint that simulates the daily cron checking for expired check-ins.
export async function POST(req: Request) {
    const users = await prisma.user.findMany({
        include: { settings: true, gracePeriods: true, items: true }
    })

    const results = []

    for (const user of users) {
        if (user.settings?.isPaused) {
            results.push({ user: user.email, action: "Skipped (Emergency Pause Active)" })
            continue;
        }

        const scheduledReleaseDate = user.settings?.scheduledReleaseDate;

        if (scheduledReleaseDate && new Date(scheduledReleaseDate) <= new Date()) {
            results.push({ user: user.email, action: "RELEASE_VAULT (Scheduled Date Reached)" })
            
            for (const item of user.items) {
                if (item.recipientEmail) {
                    await sendEmail({
                        to: item.recipientEmail,
                        subject: `A Secure Vault Item has been released to you by ${user.email}`,
                        html: `<p>A secure vault item titled "<strong>${item.title}</strong>" has been released to you.</p><p>Please log in to your Afterword portal to retrieve it, or contact the sender's trusted representative.</p>`
                    })
                }
            }
            continue;
        }

        const daysSinceCheckin = Math.floor((Date.now() - user.lastCheckinAt.getTime()) / (1000 * 60 * 60 * 24))
        const interval = user.settings?.checkinIntervalDays || 30

        // Are they past interval?
        if (daysSinceCheckin >= interval) {
            // Are they already in a grace period?
            const activeGracePeriod = user.gracePeriods.find(gp => !gp.resolved)

            if (!activeGracePeriod) {
                // Start grace period
                await prisma.gracePeriod.create({
                    data: {
                        userId: user.id,
                        warning1SentAt: new Date()
                    }
                })
                await sendEmail({
                    to: user.email,
                    subject: "Action Required: Check in to Afterword",
                    html: "<p>You have missed your check-in interval. Please sign in to verify your identity immediately, otherwise your secure vault will be released.</p>"
                })
                results.push({ user: user.email, action: "Started Grace Period (sent warning 1 email to user)" })
            } else {
                const daysInGrace = Math.floor((Date.now() - activeGracePeriod.startedAt.getTime()) / (1000 * 60 * 60 * 24))
                const graceLimit = user.settings?.gracePeriodDays || 14

                if (daysInGrace >= graceLimit) {
                    // RELEASE VAULT
                    for (const item of user.items) {
                        if (item.recipientEmail) {
                            await sendEmail({
                                to: item.recipientEmail,
                                subject: `A Secure Vault Item has been released to you by ${user.email}`,
                                html: `<p>A secure vault item titled "<strong>${item.title}</strong>" has been released to you.</p><p>Please log in to your Afterword portal to retrieve it, or contact the sender's trusted representative.</p>`
                            })
                        }
                    }
                    results.push({ user: user.email, action: "RELEASE_VAULT (Executed real emails to beneficiaries)" })
                } else if (daysInGrace >= 7 && !activeGracePeriod.warning2SentAt) {
                    // WARNING 2
                    await prisma.gracePeriod.update({
                        where: { id: activeGracePeriod.id },
                        data: { warning2SentAt: new Date() }
                    })
                    if (user.settings?.trustedContactEmail) {
                        await sendEmail({
                            to: user.settings.trustedContactEmail,
                            subject: "Action Required: A trusted user needs attention",
                            html: `<p>The user ${user.email} has missed their check-in for Afterword and has been unreachable.</p>`
                        })
                    }
                    results.push({ user: user.email, action: "Warning 2 Sent (Trusted Contact Notified via Email)" })
                }
            }
        } else {
            results.push({ user: user.email, action: "Safe" })
        }
    }

    return NextResponse.json({ success: true, processed: results })
}
