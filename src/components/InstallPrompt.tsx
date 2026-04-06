"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function InstallPrompt() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handler = (e: any) => {
            // Prevent Chrome 67+ from automatically showing the prompt
            e.preventDefault()
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e)
            setIsVisible(true)
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Clean up
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        
        if (outcome === 'accepted') {
            console.log('User accepted the PWA prompt')
        } else {
            console.log('User dismissed the PWA prompt')
        }
        
        setDeferredPrompt(null)
        setIsVisible(false)
    }

    if (!isVisible) return null

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom flex-col sm:flex-row">
                <div>
                    <h4 className="text-sm font-semibold text-white">Install Afterword</h4>
                    <p className="text-xs text-neutral-400">Install as an app for offline access & better experience.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)} className="text-neutral-400 hover:text-white flex-1 sm:flex-none">
                        Later
                    </Button>
                    <Button size="sm" onClick={handleInstall} className="bg-white text-black hover:bg-neutral-200 flex-1 sm:flex-none">
                        <Download className="w-4 h-4 mr-2" /> Install
                    </Button>
                </div>
            </div>
        </div>
    )
}
