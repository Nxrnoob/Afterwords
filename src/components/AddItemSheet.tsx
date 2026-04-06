"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Lock, ArrowLeft } from "lucide-react"
import AddItemClientWrapper from "@/app/(app)/dashboard/AddItemClientWrapper"

export function AddItemSheet({ ipfsEnabled = false }: { ipfsEnabled?: boolean }) {
    const [isOpen, setIsOpen] = useState(false)

    const vibrate = (ms = 30) => {
        if (typeof window !== "undefined" && navigator.vibrate) {
            navigator.vibrate(ms)
        }
    }

    const handleOpen = () => {
        vibrate(30)
        setIsOpen(true)
    }

    const handleClose = () => {
        vibrate(30)
        setIsOpen(false)
    }

    // Pass down a callback to AddItemClientWrapper to close sheet on success?
    // Actually AddItemClientWrapper does full window.location.reload() or revalidatePath upon completion
    // so it might just close organically, but we can pass an onClose if we modify it later. 
    // Right now, simply closing this wrapper works.

    return (
        <>
            {/* Native Floating Action Button (FAB) for Mobile / Desktop Bottom Right */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpen}
                className="fixed bottom-24 md:bottom-10 right-6 md:right-10 z-40 bg-emerald-500 hover:bg-emerald-400 text-black p-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center gap-2 font-bold pr-6 transition-colors"
            >
                <Plus className="w-6 h-6" />
                <span>Secure Item</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-50 bg-black overflow-y-auto"
                    >
                        {/* Native App Header Area */}
                        <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-neutral-800 p-4 pt-8 md:pt-4 flex items-center justify-between">
                            <button onClick={handleClose} className="p-2 -ml-2 rounded-full text-emerald-500 hover:bg-white/10 transition-colors flex items-center gap-1 font-medium">
                                <ArrowLeft className="w-5 h-5" />
                                Back
                            </button>
                            <span className="font-medium text-white/80 tracking-tight flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5" />
                                New Vault Item
                            </span>
                            <div className="w-16" /> {/* Spacer for centering */}
                        </div>

                        {/* Content Area */}
                        <div className="p-4 md:p-8 max-w-2xl mx-auto pb-32">
                            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Secure a Data Node</h2>
                            <p className="text-neutral-400 mb-8">
                                This payload will be encrypted with your master key on this device before being uploaded.
                            </p>
                            
                            <div className="bg-neutral-900/60 rounded-3xl border border-neutral-800 p-1">
                                <AddItemClientWrapper onSuccess={handleClose} ipfsEnabled={ipfsEnabled} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
