"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { checkin } from "@/app/actions/vault"

export function AutoCheckinWrapper() {
    const pathname = usePathname()
    const lastPung = useRef("")

    useEffect(() => {
        // Prevent double pings on same route loading
        if (lastPung.current === pathname) return
        lastPung.current = pathname

        // Only ping if the user is likely on a protected route to save bandwidth
        const protectedRoutes = ["/dashboard", "/settings", "/beneficiaries", "/security", "/activity"]
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
            checkin(false).catch(() => {
                // Silently ignore if unauthorized or network error
            })
        }
    }, [pathname])

    return null
}
