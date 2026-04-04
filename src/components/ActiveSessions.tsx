"use client"

import { useState, useEffect } from "react"
import { Monitor, Smartphone, Trash2 } from "lucide-react"

export function ActiveSessions() {
    const [deviceType, setDeviceType] = useState<"desktop" | "mobile">("desktop")
    const [browserName, setBrowserName] = useState("Browser")
    const [osName, setOsName] = useState("Unknown OS")

    useEffect(() => {
        if (typeof window !== "undefined") {
            const ua = window.navigator.userAgent

            // Very basic UA parsing for UX purposes
            if (/Mobi|Android|iPhone/i.test(ua)) setDeviceType("mobile")
            else setDeviceType("desktop")

            if (/Chrome/i.test(ua)) setBrowserName("Chrome")
            else if (/Safari/i.test(ua)) setBrowserName("Safari")
            else if (/Firefox/i.test(ua)) setBrowserName("Firefox")
            else if (/Edg/i.test(ua)) setBrowserName("Edge")

            if (/Mac OS X/i.test(ua)) setOsName("macOS")
            else if (/Windows NT/i.test(ua)) setOsName("Windows")
            else if (/Linux/i.test(ua)) setOsName("Linux")
            else if (/Android/i.test(ua)) setOsName("Android")
            else if (/iPhone|iPad/i.test(ua)) setOsName("iOS")
        }
    }, [])

    return (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="divide-y divide-neutral-800/50">
                {/* Current Device - Dynamically built based on UserAgent */}
                <div className="p-6 flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 shrink-0">
                            {deviceType === "mobile" ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-white flex items-center gap-2">
                                {osName} - {browserName}
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Current</span>
                            </p>
                            <p className="text-sm text-neutral-400">Location hidden for privacy</p>
                            <p className="text-xs text-neutral-500">Active right now</p>
                        </div>
                    </div>
                </div>

                {/* Info about sessions */}
                <div className="p-4 bg-neutral-950/50 flex justify-center text-xs text-neutral-500 text-center">
                    Additional concurrent device tracking requires Advanced telemetry. NextAuth defaults to stateless JWTs to preserve your privacy.
                </div>
            </div>
        </div>
    )
}
