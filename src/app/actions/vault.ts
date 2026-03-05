"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function checkin(payload?: boolean | FormData) {
    const shouldRevalidate = payload === false ? false : true
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: { lastCheckinAt: new Date() }
    })

    await prisma.checkinEvent.create({
        data: {
            userId: session.user.id,
            method: "dashboard"
        }
    })

    // Cancel any active grace period
    await prisma.gracePeriod.updateMany({
        where: { userId: session.user.id, resolved: false },
        data: { resolved: true, resolvedAt: new Date() }
    })

    if (shouldRevalidate) {
        revalidatePath("/dashboard")
    }
    return { success: true }
}

export async function addVaultItem(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const title = formData.get("title") as string
    const recipientEmail = formData.get("recipientEmail") as string
    const itemType = formData.get("itemType") as string

    let rawContent = ""
    if (itemType === "credential") {
        rawContent = JSON.stringify({
            username: formData.get("username") as string,
            password: formData.get("password") as string,
            url: formData.get("url") as string || ""
        })
    } else if (itemType === "file") {
        const file = formData.get("file") as File
        if (!file || file.size === 0) throw new Error("File is required")
        const arrayBuffer = await file.arrayBuffer()
        const base64Data = Buffer.from(arrayBuffer).toString("base64")

        rawContent = JSON.stringify({
            filename: file.name,
            mimeType: file.type,
            data: base64Data
        })
    } else {
        rawContent = formData.get("content") as string
    }

    const { encryptString } = await import("@/lib/encryption")
    const encryptedContent = encryptString(rawContent)

    await prisma.vaultItem.create({
        data: {
            userId: session.user.id,
            title,
            recipientEmail,
            itemType,
            encryptedContent
        }
    })

    // Auto check-in on activity from PRD
    await checkin(false) // Pass false so it doesn't revalidate immediately

    revalidatePath("/dashboard")
    return { success: true }
}

export async function getDecryptedVaultItem(id: string) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const item = await prisma.vaultItem.findUnique({
        where: { id: id, userId: session.user.id }
    })

    if (!item) {
        throw new Error("Item not found or unauthorized")
    }

    const { decryptString } = await import("@/lib/encryption")

    try {
        const decrypted = decryptString(item.encryptedContent)

        // If it's a credential or file, parse the JSON
        if (item.itemType === "credential" || item.itemType === "file") {
            try {
                const parsed = JSON.parse(decrypted)
                return { success: true, item: { ...item, decryptedContent: null, credentials: parsed } }
            } catch (e) {
                return { success: false, error: "Failed to parse structured data" }
            }
        }

        return { success: true, item: { ...item, decryptedContent: decrypted, credentials: null } }
    } catch (e) {
        return { success: false, error: "Failed to decrypt item. Key may have changed." }
    }
}
