"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Lock, Settings, X, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface OnboardingBannerProps {
    hasContacts: boolean
    hasItems: boolean
    hasSettings: boolean
}

const steps = [
    {
        id: "beneficiary",
        title: "Add your first beneficiary",
        description: "Choose who will receive your vault contents.",
        icon: Users,
        href: "/beneficiaries",
        cta: "Add Beneficiary",
    },
    {
        id: "item",
        title: "Secure your first item",
        description: "Encrypt a note, credential, or file.",
        icon: Lock,
        href: null, // handled by AddItemSheet FAB
        cta: "Use the + button below",
    },
    {
        id: "settings",
        title: "Configure your check-in",
        description: "Set your interval and trusted contact.",
        icon: Settings,
        href: "/settings",
        cta: "Go to Settings",
    },
]

export function OnboardingBanner({ hasContacts, hasItems, hasSettings }: OnboardingBannerProps) {
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem("afterword_onboarding_dismissed")
        if (stored === "true") setDismissed(true)
    }, [])

    function handleDismiss() {
        setDismissed(true)
        localStorage.setItem("afterword_onboarding_dismissed", "true")
    }

    // All done or dismissed
    const allDone = hasContacts && hasItems && hasSettings
    if (dismissed || allDone) return null

    const completedMap: Record<string, boolean> = {
        beneficiary: hasContacts,
        item: hasItems,
        settings: hasSettings,
    }

    const completedCount = Object.values(completedMap).filter(Boolean).length

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6 relative overflow-hidden"
            >
                {/* Accent bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500" />

                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
                    title="Dismiss onboarding"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="mb-4">
                    <h2 className="text-lg font-bold text-white">Welcome to Afterword 👋</h2>
                    <p className="text-sm text-neutral-400 mt-1">
                        Complete these steps to set up your digital vault. ({completedCount}/3)
                    </p>
                </div>

                <div className="space-y-3">
                    {steps.map((step, i) => {
                        const done = completedMap[step.id]
                        const Icon = step.icon

                        return (
                            <div
                                key={step.id}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                                    done
                                        ? "bg-emerald-950/20 border-emerald-900/30"
                                        : "bg-neutral-950/50 border-neutral-800 hover:border-neutral-700"
                                }`}
                            >
                                <div className={`p-2.5 rounded-lg shrink-0 ${
                                    done
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                                }`}>
                                    {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${done ? "text-emerald-400 line-through" : "text-white"}`}>
                                        Step {i + 1}: {step.title}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-0.5">{step.description}</p>
                                </div>

                                {!done && step.href && (
                                    <Link href={step.href}>
                                        <Button size="sm" variant="outline" className="border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 shrink-0">
                                            {step.cta} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                        </Button>
                                    </Link>
                                )}

                                {!done && !step.href && (
                                    <span className="text-xs text-neutral-500 italic shrink-0">{step.cta}</span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
