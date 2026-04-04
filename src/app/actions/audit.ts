"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function getAuditLogs() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const logs = await prisma.auditLog.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50
    })

    return logs
}
