"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { recordAuditLog } from "@/lib/audit"
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

    await recordAuditLog({
        action: 'CHECKIN',
        userId: session.user.id,
        entityType: 'User',
        entityId: session.user.id
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
    const storageProvider = formData.get("storageProvider") as "DATABASE" | "IPFS" || "DATABASE"

    // Support Phase 2 Client-Side Encryption
    const clientEncryptedContent = formData.get("encryptedContent") as string
    let finalEncryptedContent = ""

    if (clientEncryptedContent && clientEncryptedContent.startsWith("CLIENT_ENCRYPTED:")) {
        finalEncryptedContent = clientEncryptedContent
    } else {
        // Phase 1 Legacy Server-Side Encryption Fallback
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
        finalEncryptedContent = encryptString(rawContent)
    }

    let storedData = finalEncryptedContent;
    if (storageProvider === "IPFS") {
        const { uploadToIPFS } = await import("@/lib/ipfs")
        storedData = await uploadToIPFS(finalEncryptedContent, title)
    }

    const emails = recipientEmail.split(",").map((e: string) => e.trim()).filter(Boolean);

    const newItem = await prisma.vaultItem.create({
        data: {
            userId: session.user.id,
            title,
            recipientEmail: emails.length > 0 ? emails[0] : "",
            itemType,
            encryptedContent: storedData,
            storageProvider,
            Recipient: {
                create: emails.map((email: string) => ({ email }))
            }
        }
    })

    await recordAuditLog({
        action: 'ITEM_CREATED',
        userId: session.user.id,
        entityType: 'VaultItem',
        entityId: newItem.id
    })

    await checkin(false)

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

    let itemData = item.encryptedContent;
    if (item.storageProvider === "IPFS" && item.encryptedContent.startsWith("ipfs://")) {
        // Fetch from public IPFS gateway
        const cid = item.encryptedContent.replace("ipfs://", "");
        try {
            const ipfsRes = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
            if (ipfsRes.ok) {
                itemData = await ipfsRes.text();
            } else {
                throw new Error("Failed to fetch from IPFS gateway");
            }
        } catch (e) {
            console.error("IPFS Fetch Error:", e);
            throw new Error("Encrypted payload could not be retrieved from Web3 network currently.");
        }
    }

    // Phase 2: Client-Side Encrypted Items
    if (itemData.startsWith("CLIENT_ENCRYPTED:")) {
        return { 
            success: true, 
            item: { 
                ...item, 
                decryptedContent: null, 
                credentials: null, 
                clientEncrypted: true, 
                rawCiphertext: itemData 
            } 
        }
    }

    // Phase 1: Server-Side Decryption
    const { decryptString } = await import("@/lib/encryption")

    try {
        const decrypted = decryptString(itemData)

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
