"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function changePassword(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: "All fields are required" }
    }
    if (newPassword.length < 8) {
        return { error: "New password must be at least 8 characters" }
    }
    if (newPassword !== confirmPassword) {
        return { error: "Passwords do not match" }
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return { error: "User not found" }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) return { error: "Current password is incorrect" }

    const newHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash: newHash },
    })

    revalidatePath("/settings")
    return { success: true }
}

export async function deleteAccount() {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    // Cascaded deletes are handled via `onDelete: Cascade` in the Prisma schema
    await prisma.user.delete({ where: { id: session.user.id } })

    redirect("/login")
}
