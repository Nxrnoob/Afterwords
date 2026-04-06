import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { revalidatePath } from "next/cache"
import { Settings, ShieldCheck, ArrowLeft, KeyRound, Trash2, Send } from "lucide-react"
import Link from "next/link"
import { ChangePasswordForm } from "@/components/ChangePasswordForm"
import { DeleteAccountButton } from "@/components/DeleteAccountButton"
import { SettingsFormWrapper } from "@/components/SettingsFormWrapper"
import { ReleaseAllButton } from "@/components/ReleaseAllButton"

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

        const scheduledReleaseStr = formData.get("scheduledRelease") as string
        const scheduledReleaseDate = scheduledReleaseStr ? new Date(scheduledReleaseStr) : null
        const timezone = formData.get("timezone") as string || "UTC"
        const isPaused = formData.get("isPaused") === "on"

        await prisma.vaultSetting.upsert({
            where: { userId: session.user.id },
            update: {
                checkinIntervalDays: Number(formData.get("interval")),
                trustedContactEmail: formData.get("trustedContact") as string,
                scheduledReleaseDate,
                timezone,
                isPaused,
            },
            create: {
                userId: session.user.id,
                checkinIntervalDays: Number(formData.get("interval")),
                trustedContactEmail: formData.get("trustedContact") as string,
                scheduledReleaseDate,
                timezone,
                isPaused,
            }
        })
        revalidatePath("/settings")
        revalidatePath("/dashboard")
    }

    return (
        <div className="min-h-screen bg-black text-neutral-50 p-4 md:p-8 lg:p-12 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[0%] right-[0%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full point-events-none" />

            <div className="max-w-2xl mx-auto space-y-8 relative z-10 pb-32 md:pb-12">
                <header className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-full">
                        <Link href="/dashboard">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent">
                            Settings
                        </h1>
                        <p className="text-sm text-neutral-400 mt-1">Manage vault, security, and account preferences.</p>
                    </div>
                </header>

                {/* Dead Man's Switch */}
                <Card className="bg-neutral-900/60 backdrop-blur-xl border-neutral-800 text-white overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    <CardHeader className="pb-6">
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-blue-500" />
                            Dead Man&apos;s Switch
                        </CardTitle>
                        <CardDescription className="text-neutral-400">
                            Configure how long the system waits before notifying your trusted contacts.
                        </CardDescription>
                    </CardHeader>
                    <SettingsFormWrapper action={updateSettings}>
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
                                <p className="text-xs text-neutral-500">You must sign in and click &quot;Check In&quot; at least once during this period.</p>
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

                            <div className="space-y-3">
                                <Label htmlFor="scheduledRelease" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Scheduled Release Date (Optional)</Label>
                                <Input
                                    id="scheduledRelease"
                                    name="scheduledRelease"
                                    type="datetime-local"
                                    className="h-12 bg-neutral-950/50 border-neutral-800 focus-visible:ring-neutral-600 text-white transition-colors [color-scheme:dark]"
                                    defaultValue={settings?.scheduledReleaseDate ? new Date(settings.scheduledReleaseDate).toISOString().slice(0, 16) : ""}
                                />
                                <p className="text-xs text-neutral-500">
                                    If set, your vault will be automatically released on this exact date regardless of check-ins.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="timezone" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Timezone</Label>
                                <select
                                    id="timezone"
                                    name="timezone"
                                    className="flex h-12 w-full rounded-md border border-neutral-800 bg-neutral-950/50 px-4 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-600 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209L12%2015L18%209%22%20stroke%3D%22%23666666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[position:right_16px_center] bg-no-repeat"
                                    defaultValue={settings?.timezone || "UTC"}
                                >
                                    <option value="UTC">UTC</option>
                                    <option value="America/New_York">Eastern Time (US)</option>
                                    <option value="America/Chicago">Central Time (US)</option>
                                    <option value="America/Denver">Mountain Time (US)</option>
                                    <option value="America/Los_Angeles">Pacific Time (US)</option>
                                    <option value="Europe/London">London (GMT/BST)</option>
                                    <option value="Europe/Paris">Central Europe (CET)</option>
                                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                                    <option value="Asia/Calcutta">India (IST)</option>
                                    <option value="Australia/Sydney">Sydney (AEDT)</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-neutral-950/50 rounded-lg border border-neutral-800">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isPaused" className="text-sm font-medium text-white">Emergency Pause</Label>
                                    <p className="text-xs text-neutral-400">Suspend the dead man&apos;s switch. No warnings or releases will occur.</p>
                                </div>
                                <Switch id="isPaused" name="isPaused" defaultChecked={settings?.isPaused || false} />
                            </div>

                            <div className="pt-4 border-t border-neutral-800/50 mt-4">
                                <Button type="submit" className="w-full sm:w-auto px-8 h-12 font-semibold bg-white text-black hover:bg-neutral-200 transition-colors rounded-full">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Save Configuration
                                </Button>
                            </div>
                        </CardContent>
                    </SettingsFormWrapper>
                </Card>

                {/* Change Password */}
                <Card className="bg-neutral-900/60 backdrop-blur-xl border-neutral-800 text-white overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <CardHeader className="pb-6">
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-emerald-500" />
                            Change Password
                        </CardTitle>
                        <CardDescription className="text-neutral-400">
                            Update the password you use to sign in to Afterword.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChangePasswordForm />
                    </CardContent>
                </Card>

                {/* Emergency Controls (Release All overrides) */}
                <Card className="bg-neutral-900/60 backdrop-blur-xl border-red-900/30 text-white overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                    <CardHeader className="pb-6">
                        <CardTitle className="flex items-center gap-2 text-red-500">
                            <Send className="w-5 h-5 text-red-500" />
                            Emergency Controls
                        </CardTitle>
                        <CardDescription className="text-neutral-400">
                            Explicitly and immediately trigger the release of your entire vault to the configured beneficiaries. This cannot be undone once sent.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ReleaseAllButton />
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="bg-neutral-900/60 backdrop-blur-xl border-red-900/30 text-white overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                    <CardHeader className="pb-6">
                        <CardTitle className="flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription className="text-neutral-400">
                            Permanently delete your account and all associated data. This cannot be undone.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DeleteAccountButton />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}


