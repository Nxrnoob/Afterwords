"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateItemSchedule(itemId: string, scheduledReleaseDate: string | null) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    // Verify ownership
    const item = await prisma.vaultItem.findFirst({
        where: { id: itemId, userId: session.user.id }
    })
    if (!item) throw new Error("Item not found")

    await prisma.vaultItem.update({
        where: { id: itemId },
        data: {
            scheduledReleaseDate: scheduledReleaseDate ? new Date(scheduledReleaseDate) : null,
        }
    })

    revalidatePath("/dashboard")
    return { success: true }
}
