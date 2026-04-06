"use client"

import { useMemo } from "react"

interface DashboardGreetingProps {
    name: string
    itemCount: number
    contactCount: number
    daysRemaining: number
}

export function DashboardGreeting({ name, itemCount, contactCount }: DashboardGreetingProps) {
    const greeting = useMemo(() => {
        const hour = new Date().getHours()
        if (hour < 12) return "Good morning"
        if (hour < 17) return "Good afternoon"
        return "Good evening"
    }, [])

    const firstName = name?.split(" ")[0] || "there"

    return (
        <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent">
                {greeting}, {firstName}.
            </h1>
            <p className="text-neutral-400 mt-1">
                {itemCount === 0
                    ? "Your vault is empty. Start securing your digital legacy."
                    : `You have ${itemCount} secured ${itemCount === 1 ? "item" : "items"} across ${contactCount} ${contactCount === 1 ? "beneficiary" : "beneficiaries"}.`
                }
            </p>
        </div>
    )
}
