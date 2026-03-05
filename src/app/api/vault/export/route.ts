import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import JSZip from "jszip"
import { decryptString } from "@/lib/encryption"

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const items = await prisma.vaultItem.findMany({
        where: { userId: session.user.id }
    })

    if (items.length === 0) {
        return new NextResponse("Vault is empty", { status: 404 })
    }

    const zip = new JSZip()

    // Group items into folders for organization
    const notesFolder = zip.folder("Notes")
    const credsFolder = zip.folder("Credentials")
    const filesFolder = zip.folder("Files")

    items.forEach((item: any, index: number) => {
        try {
            const decrypted = decryptString(item.encryptedContent)

            const cleanTitle = item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
            const filename = `${cleanTitle}_${index}.txt`

            if (item.itemType === "credential") {
                const credObj = JSON.parse(decrypted)
                const content = `Username: ${credObj.username}\nPassword: ${credObj.password}\nURL: ${credObj.url}\n\nRecipient: ${item.recipientEmail}`
                credsFolder?.file(filename, content)
            } else if (item.itemType === "file") {
                const fileObj = JSON.parse(decrypted)
                const originalName = fileObj.filename || `${cleanTitle}.bin`
                const buffer = Buffer.from(fileObj.data, 'base64')
                filesFolder?.file(originalName, buffer)
            } else {
                const content = `${decrypted}\n\nRecipient: ${item.recipientEmail}`
                notesFolder?.file(filename, content)
            }
        } catch (e) {
            console.error(`Failed to decrypt item ${item.id}`, e)
            zip.file(`ERROR_${item.id}.txt`, "Failed to decrypt this item. The encryption key may have changed.")
        }
    })

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    // Convert Node Buffer to an ArrayBuffer for Response
    return new NextResponse(zipBuffer as unknown as BodyInit, {
        headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="afterword_vault_export.zip"`,
        }
    })
}
