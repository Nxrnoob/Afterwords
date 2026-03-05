import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// In a real Phase 1 MVP, this would be an Inngest cron job. 
// For this quick demo mockup, we expose an endpoint that simulates the daily cron checking for expired check-ins.
export async function POST(req: Request) {
    const users = await prisma.user.findMany({
        include: { settings: true, gracePeriods: true }
    })

    const results = []

    for (const user of users) {
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
                results.push({ user: user.email, action: "Started Grace Period (sent warning 1 email)" })
            } else {
                const daysInGrace = Math.floor((Date.now() - activeGracePeriod.startedAt.getTime()) / (1000 * 60 * 60 * 24))
                const graceLimit = user.settings?.gracePeriodDays || 14

                if (daysInGrace >= graceLimit) {
                    // RELEASE VAULT
                    results.push({ user: user.email, action: "RELEASE_VAULT (Simulated email to recipients)" })
                    // Logic to unlock vault and send emails.
                } else if (daysInGrace >= 7 && !activeGracePeriod.warning2SentAt) {
                    // WARNING 2
                    await prisma.gracePeriod.update({
                        where: { id: activeGracePeriod.id },
                        data: { warning2SentAt: new Date() }
                    })
                    results.push({ user: user.email, action: "Warning 2 Sent (Trusted Contact Notified)" })
                }
            }
        } else {
            results.push({ user: user.email, action: "Safe" })
        }
    }

    return NextResponse.json({ success: true, processed: results })
}
