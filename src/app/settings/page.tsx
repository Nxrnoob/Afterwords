import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { revalidatePath } from "next/cache"
import { Settings, ShieldCheck, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function SettingsPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/login")
    }

    const settings = await prisma.vaultSetting.findUnique({
        where: { userId: session.user.id }
    })

    async function updateSettings(formData: FormData) {
        "use server"
        const session = await auth()
        if (!session?.user?.id) return

        await prisma.vaultSetting.upsert({
            where: { userId: session.user.id },
            update: {
                checkinIntervalDays: Number(formData.get("interval")),
                trustedContactEmail: formData.get("trustedContact") as string,
            },
            create: {
                userId: session.user.id,
                checkinIntervalDays: Number(formData.get("interval")),
                trustedContactEmail: formData.get("trustedContact") as string,
            }
        })
        revalidatePath("/settings")
        revalidatePath("/dashboard")
    }

    return (
        <div className="min-h-screen bg-black text-neutral-50 p-4 md:p-8 lg:p-12 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[0%] right-[0%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full point-events-none" />

            <div className="max-w-2xl mx-auto space-y-10 relative z-10">
                <header className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-full">
                        <Link href="/dashboard">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent">
                            Vault Configuration
                        </h1>
                        <p className="text-sm text-neutral-400 mt-1">Manage check-ins and trusted contacts.</p>
                    </div>
                </header>

                <Card className="bg-neutral-900/60 backdrop-blur-xl border-neutral-800 text-white overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    <CardHeader className="pb-6">
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-blue-500" />
                            Dead Man's Switch
                        </CardTitle>
                        <CardDescription className="text-neutral-400">
                            Configure how long the system waits before notifying your trusted contacts.
                        </CardDescription>
                    </CardHeader>
                    <form action={updateSettings}>
                        <CardContent className="space-y-8">
                            <div className="space-y-3">
                                <Label htmlFor="interval" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Check-in Interval</Label>
                                <select
                                    id="interval"
                                    name="interval"
                                    className="flex h-12 w-full rounded-md border border-neutral-800 bg-neutral-950/50 px-4 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-600 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209L12%2015L18%209%22%20stroke%3D%22%23666666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[position:right_16px_center] bg-no-repeat"
                                    defaultValue={settings?.checkinIntervalDays || 30}
                                >
                                    <option value="30">30 Days</option>
                                    <option value="60">60 Days</option>
                                    <option value="90">90 Days</option>
                                </select>
                                <p className="text-xs text-neutral-500">You must sign in and click "Check In" at least once during this period.</p>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="trustedContact" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Trusted Contact</Label>
                                <Input
                                    id="trustedContact"
                                    name="trustedContact"
                                    type="email"
                                    className="h-12 bg-neutral-950/50 border-neutral-800 focus-visible:ring-neutral-600 text-white transition-colors"
                                    defaultValue={settings?.trustedContactEmail || ""}
                                    placeholder="trustee@example.com"
                                />
                                <p className="text-xs text-neutral-500">
                                    They will receive access if you miss your interval and the grace period expires.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-neutral-800/50 mt-4">
                                <Button type="submit" className="w-full sm:w-auto px-8 h-12 font-semibold bg-white text-black hover:bg-neutral-200 transition-colors rounded-full">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Save Configuration
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                </Card>
            </div>
        </div>
    )
}
