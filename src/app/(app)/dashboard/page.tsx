import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Lock, Clock, LogOut, Settings, Users, ShieldCheck } from "lucide-react"
import CheckinButton from "./CheckinButton"
import VaultItemViewer from "./VaultItemViewer"
import { ExportVaultButton } from "@/components/ExportVaultButton"
import { ReleaseAllButton } from "@/components/ReleaseAllButton"
import { AddItemSheet } from "@/components/AddItemSheet"
import { DashboardGreeting } from "@/components/DashboardGreeting"
import Link from "next/link"

export default async function DashboardPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            settings: true,
            items: true,
            Contact: true,
        }
    })

    if (!user) {
        redirect("/login")
    }

    const daysSinceCheckin = Math.floor((Date.now() - user.lastCheckinAt.getTime()) / (1000 * 60 * 60 * 24))
    const checkinInterval = user.settings?.checkinIntervalDays || 30
    const daysRemaining = checkinInterval - daysSinceCheckin

    const isWarning = daysRemaining <= 7
    const isCritical = daysRemaining <= 0

    return (
        <div className="min-h-screen bg-black text-neutral-50 p-4 md:p-8 lg:p-12 relative overflow-hidden pb-32 md:pb-12">
            {/* Background Effects */}
            <div className="absolute top-[0%] left-[0%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />
            <div className={`absolute top-[40%] right-[0%] w-[40%] h-[40%] blur-[150px] rounded-full pointer-events-none transition-colors duration-1000 ${isCritical ? 'bg-red-900/20' : isWarning ? 'bg-yellow-900/20' : 'bg-emerald-900/10'}`} />

            <div className="max-w-4xl mx-auto space-y-10 relative z-10">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <DashboardGreeting
                        name={user.email.split('@')[0]}
                        itemCount={user.items.length}
                        contactCount={user.Contact.length}
                        daysRemaining={Math.max(0, daysRemaining)}
                    />
                    <div className="flex items-center gap-3">
                        <ReleaseAllButton />
                        <ExportVaultButton />
                        <Link href="/settings">
                            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors">
                                <Settings className="w-5 h-5" />
                            </Button>
                        </Link>
                        <form action="/api/auth/signout" method="POST">
                            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-400 hover:bg-red-950/30 transition-colors">
                                <LogOut className="w-5 h-5" />
                            </Button>
                        </form>
                    </div>
                </header>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/60 border border-neutral-800 text-sm">
                        <Lock className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-white font-semibold">{user.items.length}</span>
                        <span className="text-neutral-500">secured {user.items.length === 1 ? "item" : "items"}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/60 border border-neutral-800 text-sm">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-white font-semibold">{user.Contact.length}</span>
                        <span className="text-neutral-500">{user.Contact.length === 1 ? "beneficiary" : "beneficiaries"}</span>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm ${isCritical ? "bg-red-950/30 border-red-900/50" : isWarning ? "bg-yellow-950/30 border-yellow-900/50" : "bg-emerald-950/30 border-emerald-900/50"}`}>
                        <ShieldCheck className={`w-3.5 h-3.5 ${isCritical ? "text-red-400" : isWarning ? "text-yellow-400" : "text-emerald-400"}`} />
                        <span className={`font-semibold ${isCritical ? "text-red-400" : isWarning ? "text-yellow-400" : "text-emerald-400"}`}>{Math.max(0, daysRemaining)}d</span>
                        <span className="text-neutral-500">until check-in</span>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Status Card */}
                    <Card className="bg-neutral-900/60 backdrop-blur-xl border-neutral-800 text-white overflow-hidden relative">
                        <div className={`absolute top-0 left-0 w-1 h-full ${isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                <Clock className={`w-5 h-5 ${isCritical ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-emerald-500'}`} />
                                Check-In Status
                            </CardTitle>
                            <CardDescription className="text-neutral-400">
                                You last checked in {daysSinceCheckin} days ago.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-6 bg-neutral-950/50 rounded-2xl border border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-inner">
                                <div>
                                    <p className="font-medium text-lg mb-1">Time until grace period</p>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-5xl font-black tracking-tighter ${isCritical ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]' : isWarning ? 'text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}>
                                            {Math.max(0, daysRemaining)}
                                        </span>
                                        <span className="text-neutral-500 font-medium">days remaining</span>
                                    </div>
                                </div>
                                <CheckinButton isCritical={isCritical} isWarning={isWarning} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items Section */}
                    <section className="space-y-6 pt-4">
                        <div className="flex justify-between items-center px-1">
                            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                                <Lock className="w-5 h-5 text-neutral-400" />
                                Secured Data
                            </h2>
                        </div>

                        {user.items.length === 0 ? (
                            <div className="py-20 px-4 text-center bg-neutral-900/40 border border-neutral-800/50 border-dashed rounded-[32px] text-neutral-500 flex flex-col items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6">
                                    <Lock className="w-8 h-8 opacity-50 text-neutral-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Your vault is pristine</h3>
                                <p className="text-neutral-400 max-w-sm">Tap the plus button below to begin securing your digital legacy.</p>
                            </div>
                        ) : (
                            <VaultItemViewer items={user.items} />
                        )}
                    </section>
                </div>
            </div>

            {/* Render the Native FAB and Sheet flow */}
            <AddItemSheet />
        </div>
    )
}
