"use server"

import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { sendEmail } from "@/lib/email"

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

        // Send welcome email (fire-and-forget, don't block signup)
        sendEmail({
            to: email,
            subject: "Welcome to Afterword – Your vault is ready",
            html: `
                <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #111;">
                    <h2 style="font-size: 24px; font-weight: 700;">Welcome to Afterword 🌿</h2>
                    <p>Your secure vault has been created and is ready to use.</p>
                    <p>Start by adding your first item — passwords, letters, documents, or anything you want to protect and pass on when the time comes.</p>
                    <p><strong>Remember to check in regularly</strong> so your vault knows you're still here. If you ever miss a check-in, your beneficiaries will be notified.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                    <p style="color: #666; font-size: 13px;">This is an automated message from Afterword. If you didn't sign up, you can safely ignore this email.</p>
                </div>
            `
        }).catch(err => console.error("[Welcome Email Failed]", err))

        return { success: true }
    } catch {
        return { error: "Failed to create user" }
    }
}

