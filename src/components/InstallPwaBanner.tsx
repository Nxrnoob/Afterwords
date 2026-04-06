"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

export function InstallPwaBanner() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showBanner, setShowBanner] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setShowBanner(true)
        }

        window.addEventListener('beforeinstallprompt', handler)

        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
        }
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return
        
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        
        if (outcome === 'accepted') {
            setShowBanner(false)
        }
        setDeferredPrompt(null)
    }

    if (!showBanner) return null

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center animate-in slide-in-from-bottom-12 duration-500 fade-in">
            <div className="w-full max-w-md bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <p className="text-sm font-medium text-white">Install Afterword</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Add to Home Screen for the full app experience.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleInstallClick} size="sm" className="bg-white text-black hover:bg-neutral-200 h-8 font-medium">
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Install
                    </Button>
                    <button onClick={() => setShowBanner(false)} className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
