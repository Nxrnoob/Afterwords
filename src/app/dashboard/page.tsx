import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { addVaultItem, checkin } from "@/app/actions/vault"
import { Lock, Clock, FileText, PlusCircle, Settings, LogOut } from "lucide-react"
import AddItemClientWrapper from "./AddItemClientWrapper"
import CheckinButton from "./CheckinButton"
import VaultItemViewer from "./VaultItemViewer"

export default async function DashboardPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            settings: true,
            items: true
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
        <div className="min-h-screen bg-black text-neutral-50 p-4 md:p-8 lg:p-12 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[0%] left-[0%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full point-events-none" />
            <div className={`absolute top-[40%] right-[0%] w-[40%] h-[40%] blur-[150px] rounded-full point-events-none transition-colors duration-1000 ${isCritical ? 'bg-red-900/20' : isWarning ? 'bg-yellow-900/20' : 'bg-emerald-900/10'}`} />

            <div className="max-w-5xl mx-auto space-y-10 relative z-10">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent">
                            Your Vault
                        </h1>
                        <p className="text-neutral-400 mt-1">Manage your secure items and check-in status.</p>
                    </div>
                    <form action="/api/auth/signout" method="POST">
                        <Button variant="ghost" className="text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors">
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </form>
                </header>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Status Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Status Card */}
                        <Card className="bg-neutral-900/60 backdrop-blur-xl border-neutral-800 text-white overflow-hidden relative">
                            <div className={`absolute top-0 left-0 w-1 h-full ${isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className={`w-5 h-5 ${isCritical ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-emerald-500'}`} />
                                    Check-In Status
                                </CardTitle>
                                <CardDescription className="text-neutral-400">
                                    You last checked in {daysSinceCheckin} days ago.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="p-6 bg-neutral-950/50 rounded-xl border border-neutral-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                    <div>
                                        <p className="font-medium text-lg mb-1">Time until grace period</p>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-4xl font-bold ${isCritical ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-emerald-500'}`}>
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
                        <section className="space-y-6">
                            <div className="flex justify-between items-center px-1">
                                <h2 className="text-xl font-semibold tracking-tight text-neutral-200">Secured Items</h2>
                            </div>

                            {user.items.length === 0 ? (
                                <div className="p-12 text-center bg-neutral-900/40 border border-neutral-800/50 border-dashed rounded-2xl text-neutral-500 flex flex-col items-center justify-center">
                                    <Lock className="w-10 h-10 mb-4 opacity-50" />
                                    <p className="font-medium text-neutral-400">Your vault is empty</p>
                                    <p className="text-sm mt-1">Add a note below to start securing data.</p>
                                </div>
                            ) : (
                                <VaultItemViewer items={user.items} />
                            )}
                        </section>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-8">
                        {/* Quick Actions */}
                        <Card className="bg-neutral-900/60 backdrop-blur-xl border-neutral-800 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg">Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button asChild className="w-full justify-start h-12 bg-neutral-950/50 border border-neutral-800 hover:bg-neutral-800/80 transition-all font-medium text-neutral-300 hover:text-white" variant="outline">
                                    <a href="#new-item">
                                        <PlusCircle className="w-4 h-4 mr-3 text-neutral-400" />
                                        Add New Note
                                    </a>
                                </Button>
                                <Button asChild className="w-full justify-start h-12 bg-neutral-950/50 border border-neutral-800 hover:bg-neutral-800/80 transition-all font-medium text-neutral-300 hover:text-white" variant="outline">
                                    <a href="/api/vault/export" download>
                                        <FileText className="w-4 h-4 mr-3 text-neutral-400" />
                                        Export Vault (ZIP)
                                    </a>
                                </Button>
                                <Button asChild className="w-full justify-start h-12 bg-neutral-950/50 border border-neutral-800 hover:bg-neutral-800/80 transition-all font-medium text-neutral-300 hover:text-white" variant="outline">
                                    <a href="/settings">
                                        <Settings className="w-4 h-4 mr-3 text-neutral-400" />
                                        Vault Settings
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Add Item Form */}
                        <Card id="new-item" className="bg-neutral-900/60 backdrop-blur-xl border-neutral-800 text-white scroll-mt-8">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-neutral-400" />
                                    Secure a New Item
                                </CardTitle>
                                <CardDescription className="text-neutral-400 text-sm">
                                    Encrypted and released only if you miss check-ins.
                                </CardDescription>
                            </CardHeader>
                            <AddItemClientWrapper />
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
