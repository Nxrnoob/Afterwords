"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { recordAuditLog } from "@/lib/audit"

export async function getContacts() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    return await prisma.contact.findMany({
        where: { userId: session.user.id },
        orderBy: { name: 'asc' }
    })
}

export async function addContact(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string

    if (!name || !email) throw new Error("Name and Email are required")

    const contact = await prisma.contact.create({
        data: {
            userId: session.user.id,
            name,
            email,
            phone: phone || null,
        }
    })

    await recordAuditLog({
        action: 'CONTACT_ADDED',
        userId: session.user.id,
        entityType: 'Contact',
        entityId: contact.id
    })

    revalidatePath("/beneficiaries")
}

export async function deleteContact(contactId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await prisma.contact.delete({
        where: { id: contactId, userId: session.user.id }
    })

    await recordAuditLog({
        action: 'CONTACT_DELETED',
        userId: session.user.id,
        entityType: 'Contact',
        entityId: contactId
    })

    revalidatePath("/beneficiaries")
}

export async function saveCoverLetter(encryptedContent: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const letter = await prisma.coverLetter.upsert({
        where: { userId: session.user.id },
        update: { encryptedContent },
        create: {
            userId: session.user.id,
            encryptedContent
        }
    })

    await recordAuditLog({
        action: 'COVER_LETTER_SAVED',
        userId: session.user.id,
        entityType: 'CoverLetter',
        entityId: letter.id
    })

    revalidatePath("/beneficiaries")
}
