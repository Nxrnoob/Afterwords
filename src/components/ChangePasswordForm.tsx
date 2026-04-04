"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound, CheckCircle2 } from "lucide-react"
import { changePassword } from "@/app/actions/account"

export function ChangePasswordForm() {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isPending, startTransition] = useTransition()

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setSuccess(false)
        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
            const result = await changePassword(formData)
            if (result?.error) {
                setError(result.error)
            } else {
                setSuccess(true)
                ;(e.target as HTMLFormElement).reset()
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Current Password</Label>
                <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                    className="h-11 bg-neutral-950/50 border-neutral-800 focus-visible:ring-neutral-600 text-white"
                    placeholder="••••••••"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">New Password</Label>
                <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    minLength={8}
                    className="h-11 bg-neutral-950/50 border-neutral-800 focus-visible:ring-neutral-600 text-white"
                    placeholder="Min. 8 characters"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Confirm New Password</Label>
                <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="h-11 bg-neutral-950/50 border-neutral-800 focus-visible:ring-neutral-600 text-white"
                    placeholder="••••••••"
                />
            </div>

            {error && <p className="text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">{error}</p>}
            {success && (
                <p className="text-sm text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 rounded-lg px-3 py-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Password changed successfully.
                </p>
            )}

            <Button
                type="submit"
                disabled={isPending}
                className="h-11 px-6 bg-white text-black hover:bg-neutral-200 font-semibold rounded-full"
            >
                <KeyRound className="w-4 h-4 mr-2" />
                {isPending ? "Saving..." : "Update Password"}
            </Button>
        </form>
    )
}
