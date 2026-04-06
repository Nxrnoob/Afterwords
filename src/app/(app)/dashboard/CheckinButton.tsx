"use client"

import { useState } from "react"
import { checkin } from "@/app/actions/vault"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function CheckinButton() {
    const [loading, setLoading] = useState(false)

    async function handleCheckin() {
        setLoading(true)
        try {
            await checkin(true)
            toast.success("Successfully checked in. Grace period stopped.")
        } catch {
            toast.error("Failed to check in.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleCheckin}
            disabled={loading}
            className="w-full sm:w-auto h-12 px-8 font-semibold bg-white text-black hover:bg-neutral-200 transition-all rounded-full shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
        >
            {loading ? "Checking In..." : "Check In Now"}
        </Button>
    )
}
