"use client"

import { useRef } from "react"
import { toast } from "sonner"

export function SettingsFormWrapper({ action, children }: { action: (formData: FormData) => Promise<void>, children: React.ReactNode }) {
    const formRef = useRef<HTMLFormElement>(null)

    async function handleSubmit(formData: FormData) {
        try {
            await action(formData)
            toast.success("Settings saved successfully!")
        } catch {
            toast.error("Failed to save settings.")
        }
    }

    return (
        <form ref={formRef} action={handleSubmit}>
            {children}
        </form>
    )
}
