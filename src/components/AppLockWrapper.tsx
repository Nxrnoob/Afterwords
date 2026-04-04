"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, Delete } from "lucide-react"

const LOCK_TIMEOUT_MS = 1000 // 1 second of backgrounding triggers lock

export function AppLockWrapper({ children }: { children: React.ReactNode }) {
    const [isLocked, setIsLocked] = useState(false)
    const [pinEntry, setPinEntry] = useState("")
    const [error, setError] = useState(false)
    const hiddenTimeRef = useRef<number | null>(null)

    useEffect(() => {
        const handleVisibilityChange = async () => {
            const savedPinHash = localStorage.getItem("afterword_app_lock_pin")
            if (!savedPinHash) return // App lock not enabled

            if (document.visibilityState === "hidden") {
                hiddenTimeRef.current = Date.now()
            } else if (document.visibilityState === "visible") {
                if (hiddenTimeRef.current && Date.now() - hiddenTimeRef.current > LOCK_TIMEOUT_MS) {
                    setIsLocked(true)
                    setPinEntry("")
                    setError(false)
                }
                hiddenTimeRef.current = null
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
    }, [])

    const vibrate = (ms: number | number[] = 50) => {
        if (typeof window !== "undefined" && navigator.vibrate) {
            navigator.vibrate(ms)
        }
    }

    const handlePinInput = async (digit: string) => {
        if (pinEntry.length >= 4) return
        
        vibrate(30) // light tap
        const newPin = pinEntry + digit
        setPinEntry(newPin)
        setError(false)

        if (newPin.length === 4) {
            // Verify PIN
            const savedPinHash = localStorage.getItem("afterword_app_lock_pin")
            const encoder = new TextEncoder()
            const data = encoder.encode(newPin)
            const hashBuffer = await window.crypto.subtle.digest("SHA-256", data)
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

            if (hashHex === savedPinHash) {
                // Success
                vibrate([30, 50, 30]) // Success success haptic
                setIsLocked(false)
                setPinEntry("")
            } else {
                // Failure
                vibrate([50, 100, 50, 100, 50]) // Error vibration
                setError(true)
                setTimeout(() => setPinEntry(""), 500) // Clear after showing error briefly
            }
        }
    }

    const handleDelete = () => {
        vibrate(30)
        setPinEntry(prev => prev.slice(0, -1))
        setError(false)
    }

    return (
        <>
            {children}
            
            <AnimatePresence>
                {isLocked && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
                    >
                        <Lock className="w-12 h-12 text-emerald-400 mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">App Locked</h2>
                        <p className="text-neutral-400 mb-8 text-center max-w-xs">
                            Enter your PIN to resume your session.
                        </p>

                        <div className="flex gap-4 mb-12">
                            {[0, 1, 2, 3].map((i) => (
                                <motion.div 
                                    key={i}
                                    animate={error ? { x: [-5, 5, -5, 5, 0], backgroundColor: "#ef4444" } : {}}
                                    transition={{ duration: 0.4 }}
                                    className={`w-4 h-4 rounded-full border-2 transition-colors ${
                                        pinEntry.length > i 
                                            ? "bg-white border-white" 
                                            : "bg-transparent border-neutral-600"
                                    }`}
                                />
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-6 max-w-[280px]">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => handlePinInput(num.toString())}
                                    className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 text-2xl font-medium text-white hover:bg-neutral-800 transition-colors flex items-center justify-center"
                                >
                                    {num}
                                </button>
                            ))}
                            <div /> {/* Emtpy slot for bottom left */}
                            <button
                                onClick={() => handlePinInput("0")}
                                className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 text-2xl font-medium text-white hover:bg-neutral-800 transition-colors flex items-center justify-center"
                            >
                                0
                            </button>
                            <button
                                onClick={handleDelete}
                                className="w-16 h-16 rounded-full bg-neutral-900/50 text-neutral-400 hover:text-white transition-colors flex items-center justify-center"
                            >
                                <Delete className="w-6 h-6" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
