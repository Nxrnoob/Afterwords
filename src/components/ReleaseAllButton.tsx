"use client"

import { useState, useTransition } from "react"
import { forceReleaseAll } from "@/app/actions/release"
import { Button } from "@/components/ui/button"
import { Send, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function ReleaseAllButton() {
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)

    function handleForceRelease() {
        startTransition(async () => {
            try {
                const res = await forceReleaseAll()
                if (res?.success) {
                    toast.success(`Success! Sent ${res.emailsSent} notification email(s).`)
                    setOpen(false)
                }
            } catch (err) {
                toast.error("Failed to release items.")
            }
        })
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-400 border-red-900/30 bg-red-950/10 hover:bg-red-950/30 hover:text-red-300 transition-colors">
                    <Send className="w-4 h-4 mr-2" />
                    Release All
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-neutral-950 border-neutral-800 text-white">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-400">Explicitly Release Entire Vault?</AlertDialogTitle>
                    <AlertDialogDescription className="text-neutral-400">
                        This action will strictly bypass your check-in timers and scheduled dates, and IMMEDIATELY send an email to every beneficiary attached to every item in your vault.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending} className="bg-transparent border-neutral-800 hover:bg-neutral-900">Cancel</AlertDialogCancel>
                    <Button onClick={handleForceRelease} disabled={isPending} className="bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center">
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isPending ? "Sending..." : "Yes, Release All"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
