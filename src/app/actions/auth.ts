"use server"

import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
})

export async function register(formData: FormData) {
    const result = registerSchema.safeParse(Object.fromEntries(formData))
    if (!result.success) {
        return { error: "Invalid email or password" }
    }

    const { email, password } = result.data

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
        return { error: "Email already taken" }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    try {
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
            },
        })

        // Also init their VaultSettings
        await prisma.vaultSetting.create({
            data: {
                userId: user.id
            }
        })

        return { success: true }
    } catch {
        return { error: "Failed to create user" }
    }
}
