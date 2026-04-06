import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { decryptString } from "@/lib/encryption"

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const items = await prisma.vaultItem.findMany({
        where: { userId: session.user.id }
    })

    const processed = items.map(item => {
        const clientEncrypted = item.encryptedContent.startsWith("CLIENT_ENCRYPTED:")
        let decryptedContent = null
        if (!clientEncrypted) {
            try {
               decryptedContent = decryptString(item.encryptedContent)
            } catch(e) {
               console.error("Failed to decypt server legacy item", e)
            }
        }
        return {
            id: item.id,
            title: item.title,
            itemType: item.itemType,
            recipientEmail: item.recipientEmail,
            clientEncrypted,
            rawCiphertext: clientEncrypted ? item.encryptedContent : null,
            decryptedContent
        }
    })

    return NextResponse.json(processed)
}
