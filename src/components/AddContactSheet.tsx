"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, UserPlus, Phone, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addContact } from "@/app/actions/contacts"

export function AddContactSheet() {
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const vibrate = (ms: number | number[] = 30) => {
        if (typeof window !== "undefined" && navigator.vibrate) {
            navigator.vibrate(ms)
        }
    }

    const handleOpen = () => {
        vibrate()
        setIsOpen(true)
    }

    const handleClose = () => {
        vibrate()
        setIsOpen(false)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        vibrate(30)
        setIsSubmitting(true)
        
        try {
            const formData = new FormData(e.currentTarget)
            await addContact(formData)
            vibrate([30, 50, 30]) // Success success haptic
            setIsOpen(false)
        } catch (error) {
            console.error(error)
            vibrate([50, 100, 50]) // Error haptic
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <Button onClick={handleOpen} className="bg-white text-black hover:bg-neutral-200 shrink-0 h-10 px-4 rounded-full font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all active:scale-95">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Beneficiary
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-x-0 bottom-0 z-50 bg-neutral-900 border-t border-neutral-800 rounded-t-[32px] p-6 max-h-[90vh] overflow-y-auto shadow-2xl"
                        >
                            <div className="flex flex-col h-full max-w-lg mx-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-white tracking-tight">New Contact</h2>
                                    <button onClick={handleClose} className="p-2 rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6 flex-1">
                                    <div className="space-y-2">
                                        <Label className="text-neutral-300">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3.5 h-4 w-4 text-neutral-500" />
                                            <Input 
                                                name="name"
                                                required 
                                                placeholder="Jane Smith" 
                                                className="pl-10 h-12 bg-neutral-950/50 border-neutral-800 text-white rounded-xl focus-visible:ring-emerald-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-neutral-300">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-neutral-500" />
                                            <Input 
                                                name="email"
                                                type="email" 
                                                required 
                                                placeholder="jane@example.com" 
                                                className="pl-10 h-12 bg-neutral-950/50 border-neutral-800 text-white rounded-xl focus-visible:ring-emerald-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-neutral-300">Phone Number (Optional)</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3.5 h-4 w-4 text-neutral-500" />
                                            <Input 
                                                name="phone"
                                                type="tel" 
                                                placeholder="+1 (555) 000-0000" 
                                                className="pl-10 h-12 bg-neutral-950/50 border-neutral-800 text-white rounded-xl focus-visible:ring-emerald-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 pb-8">
                                        <Button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-lg shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                        >
                                            {isSubmitting ? "Adding..." : "Add to Vault"}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
