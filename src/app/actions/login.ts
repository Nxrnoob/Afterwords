"use server"
import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function loginAction(formData: FormData) {
    try {
        await signIn("credentials", Object.fromEntries(formData), { redirectTo: "/dashboard" })
    } catch (error) {
        if (error instanceof AuthError) {
            return { error: "Invalid credentials." }
        }
        throw error // Important: Re-throw to allow Next.js redirects to work
    }
}
