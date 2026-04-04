"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, AlertTriangle } from "lucide-react"
import { deleteAccount } from "@/app/actions/account"

export function DeleteAccountButton() {
    const [confirmed, setConfirmed] = useState(false)
    const [inputVal, setInputVal] = useState("")
    const [isPending, startTransition] = useTransition()

    const CONFIRMATION_PHRASE = "delete my account"
    const isValid = inputVal.toLowerCase() === CONFIRMATION_PHRASE

    if (!confirmed) {
        return (
            <Button
                variant="outline"
                onClick={() => setConfirmed(true)}
                className="h-11 px-6 border-red-900/50 text-red-400 bg-transparent hover:bg-red-950/30 hover:text-red-300 hover:border-red-700 font-semibold rounded-full"
            >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete My Account
            </Button>
        )
    }

    return (
        <div className="space-y-4 p-4 bg-red-950/10 border border-red-900/30 rounded-xl">
            <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-red-300">Permanent Action</p>
                    <p className="text-xs text-neutral-400 mt-1">
                        This will permanently delete your account, all vault items, contacts, and check-in history. This cannot be undone.
                    </p>
                </div>
            </div>
            <div className="space-y-2">
                <p className="text-xs text-neutral-400">
                    Type <span className="font-mono text-red-400 font-semibold">{CONFIRMATION_PHRASE}</span> to confirm:
                </p>
                <Input
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    placeholder={CONFIRMATION_PHRASE}
                    className="h-11 bg-neutral-950/50 border-red-900/50 focus-visible:ring-red-600 text-white"
                />
            </div>
            <div className="flex gap-3">
                <Button
                    variant="ghost"
                    onClick={() => { setConfirmed(false); setInputVal("") }}
                    className="h-10 text-neutral-400"
                    disabled={isPending}
                >
                    Cancel
                </Button>
                <Button
                    variant="destructive"
                    disabled={!isValid || isPending}
                    onClick={() => startTransition(async () => { await deleteAccount() })}
                    className="h-10 px-6 font-semibold"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isPending ? "Deleting..." : "Permanently Delete"}
                </Button>
            </div>
        </div>
    )
}
