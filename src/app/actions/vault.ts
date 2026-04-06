"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { recordAuditLog } from "@/lib/audit"
import { notarizeAction, createDataHash } from "@/lib/blockchain"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function checkin(options?: boolean | FormData | { shouldRevalidate?: boolean, shouldNotarize?: boolean }) {
    let shouldRevalidate = true
    let shouldNotarize = true
    if (options === false) {
        shouldRevalidate = false
    } else if (typeof options === 'object' && !(options instanceof FormData)) {
        shouldRevalidate = options.shouldRevalidate !== false
        shouldNotarize = options.shouldNotarize !== false
    }
    
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: { lastCheckinAt: new Date() }
    })

    const checkinRecord = await prisma.checkinEvent.create({
        data: {
            userId: session.user.id,
            method: "dashboard"
        }
    })

    // Blockchain notarization (non-blocking)
    if (shouldNotarize) {
        const dataHash = createDataHash(`${session.user.id}:CHECKIN:${checkinRecord.id}:${Date.now()}`)
        notarizeAction("CHECKIN", dataHash).then(txHash => {
            if (txHash) {
                prisma.checkinEvent.update({
                    where: { id: checkinRecord.id },
                    data: { blockchainTxHash: txHash }
                }).catch(err => console.error("[BLOCKCHAIN] Failed to save checkin txHash:", err))
            }
        })
    }

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

    const scheduledReleaseStr = formData.get("scheduledRelease") as string
    const scheduledReleaseDate = scheduledReleaseStr ? new Date(scheduledReleaseStr) : null

    const newItem = await prisma.vaultItem.create({
        data: {
            userId: session.user.id,
            title,
            recipientEmail: emails.length > 0 ? emails[0] : "",
            itemType,
            encryptedContent: storedData,
            storageProvider,
            scheduledReleaseDate,
            Recipient: {
                create: emails.map(email => ({ email }))
            }
        }
    })

    await recordAuditLog({
        action: 'ITEM_CREATED',
        userId: session.user.id,
        entityType: 'VaultItem',
        entityId: newItem.id
    })

    // Blockchain notarization (non-blocking)
    const itemHash = createDataHash(`${session.user.id}:ITEM_CREATED:${newItem.id}:${Date.now()}`)
    notarizeAction("ITEM_CREATED", itemHash).then(txHash => {
        if (txHash) {
            prisma.vaultItem.update({
                where: { id: newItem.id },
                data: { blockchainTxHash: txHash }
            }).catch(err => console.error("[BLOCKCHAIN] Failed to save item txHash:", err))
        }
    })

    // Wait briefly so the blockchain nonce manager doesn't crash on high throughput
    // Normally not an issue outside of testnets, but a tiny delay helps ethers.js query the latest nonce.
    await new Promise(res => setTimeout(res, 300));
    // Check-in but do NOT notarize to avoid "REPLACEMENT_UNDERPRICED" nonce collision
    await checkin({ shouldRevalidate: false, shouldNotarize: false })

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
        const cid = item.encryptedContent.replace("ipfs://", "");

        // Detect mock CIDs (created when PINATA_JWT was not configured)
        if (cid.startsWith("mock_cid_")) {
            return { success: false, error: "This item was saved with a mock IPFS CID (no Pinata key was configured). Please delete it and re-add with a valid Pinata setup." }
        }

        const gateways = [
            `https://gateway.pinata.cloud/ipfs/${cid}`,
            `https://cloudflare-ipfs.com/ipfs/${cid}`,
            `https://ipfs.io/ipfs/${cid}`
        ];

        let fetchedContent = null;
        for (const gatewayUrl of gateways) {
            try {
                const ipfsRes = await fetch(gatewayUrl);
                if (ipfsRes.ok) {
                    fetchedContent = await ipfsRes.text();
                    break;
                }
            } catch (e) {
                console.warn(`Gateway ${gatewayUrl} failed`, e);
            }
        }

        if (!fetchedContent) {
            return { success: false, error: "IPFS network timeout. The data is propagating, please try again in a few minutes." }
        }
        itemData = fetchedContent;
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

export async function deleteVaultItem(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await prisma.vaultItem.delete({
        where: { id: id, userId: session.user.id }
    })

    await recordAuditLog({
        action: 'VAULT_ITEM_DELETED' as any,
        userId: session.user.id,
        entityType: 'VaultItem',
        entityId: id
    })

    revalidatePath("/dashboard")
    return { success: true }
}
