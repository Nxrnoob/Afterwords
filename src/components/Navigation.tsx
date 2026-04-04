"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Users, Shield, Clock, Settings } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils" // Assumes shadcn cn utility exists

const NAV_ITEMS = [
    { label: "Vault", href: "/dashboard", icon: Home },
    { label: "Beneficiaries", href: "/beneficiaries", icon: Users },
    { label: "Security", href: "/security", icon: Shield },
    { label: "Activity", href: "/activity", icon: Clock },
    { label: "Settings", href: "/settings", icon: Settings },
]

export function Navigation() {
    const pathname = usePathname()

    return (
        <>
            {/* Desktop Sidebar */}
            <nav className="hidden md:flex flex-col w-64 h-screen border-r border-neutral-800 bg-black/50 backdrop-blur-xl p-4 sticky top-0">
                <div className="flex items-center gap-3 px-2 mb-10 mt-4">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                        <span className="text-black font-bold text-xl leading-none -mt-0.5">⬡</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">Afterword</span>
                </div>
                
                <div className="space-y-2 flex-1">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                        
                        return (
                            <Link 
                                key={item.href} 
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors relative group",
                                    isActive ? "text-white" : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 bg-neutral-800/80 rounded-lg border border-neutral-700/50"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <Icon className="w-5 h-5 relative z-10" />
                                <span className="font-medium relative z-10">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>

                <div className="mt-auto px-3 py-4 border-t border-neutral-800/50">
                     <p className="text-xs text-neutral-600 font-mono">Vault Connection: Secure</p>
                </div>
            </nav>

            {/* Mobile Bottom Dock */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe pointer-events-none">
                <nav className="mx-auto max-w-sm pointer-events-auto">
                    <div className="flex items-center justify-between bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-2xl p-2 shadow-2xl">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="relative flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors"
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="dock-active"
                                            className="absolute inset-0 bg-white/10 rounded-xl"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <Icon className={cn("w-5 h-5 relative z-10 mb-1 transition-colors", isActive ? "text-white" : "text-neutral-500")} />
                                    <span className={cn("text-[10px] font-medium relative z-10 transition-colors", isActive ? "text-white" : "text-neutral-500")}>
                                        {item.label}
                                    </span>
                                </Link>
                            )
                        })}
                    </div>
                </nav>
            </div>
        </>
    )
}
