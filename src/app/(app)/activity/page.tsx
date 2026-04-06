import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Clock, ShieldCheck, FilePlus, Fingerprint, UserPlus, KeyRound, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

type ActivityEvent = {
    id: string
    type: "checkin" | "item_created" | "account_created" | "grace_period" | "contact_added"
    title: string
    description: string
    timestamp: Date
    blockchainTxHash?: string | null
}

const iconMap = {
    checkin: { Icon: ShieldCheck, color: "emerald" },
    item_created: { Icon: FilePlus, color: "blue" },
    account_created: { Icon: Fingerprint, color: "neutral" },
    grace_period: { Icon: AlertTriangle, color: "red" },
    contact_added: { Icon: UserPlus, color: "purple" },
}

const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    neutral: "bg-neutral-800 border-neutral-700 text-neutral-400",
    red: "bg-red-500/10 border-red-500/20 text-red-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
}

export default async function ActivityLogPage() {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const userId = session.user.id

    // Fetch real data from DB in parallel
    const [user, checkins, items, contacts, gracePeriods] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
        prisma.checkinEvent.findMany({ where: { userId }, orderBy: { checkedInAt: "desc" }, take: 10, select: { id: true, checkedInAt: true, method: true, blockchainTxHash: true } }),
        prisma.vaultItem.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, title: true, itemType: true, createdAt: true, blockchainTxHash: true } }),
        prisma.contact.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, createdAt: true } }),
        prisma.gracePeriod.findMany({ where: { userId }, orderBy: { startedAt: "desc" }, take: 5 }),
    ])

    // Build unified activity feed
    const events: ActivityEvent[] = []

    checkins.forEach(c => events.push({
        id: c.id,
        type: "checkin",
        title: "Checked In",
        description: `Dead man's switch timer reset via ${c.method}.`,
        timestamp: c.checkedInAt,
        blockchainTxHash: c.blockchainTxHash,
    }))

    items.forEach(item => events.push({
        id: item.id,
        type: "item_created",
        title: `Added "${item.title}"`,
        description: `Vault item of type ${item.itemType} created and encrypted.`,
        timestamp: item.createdAt,
        blockchainTxHash: item.blockchainTxHash,
    }))

    contacts.forEach(c => events.push({
        id: c.id,
        type: "contact_added",
        title: `Added Beneficiary`,
        description: `${c.name} was added as a trusted contact.`,
        timestamp: c.createdAt,
    }))

    gracePeriods.forEach(gp => events.push({
        id: gp.id,
        type: "grace_period",
        title: "Grace Period Triggered",
        description: gp.resolved ? "Check-in was missed — grace period has since resolved." : "Check-in missed. Grace period is active.",
        timestamp: gp.startedAt,
    }))

    if (user?.createdAt) {
        events.push({
            id: "account-created",
            type: "account_created",
            title: "Vault Initialized",
            description: "Account created. Cryptographic keys generated.",
            timestamp: user.createdAt,
        })
    }

    // Sort by newest first
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-10">
            <header className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg">
                        <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Activity Audit Log</h1>
                </div>
                <p className="text-neutral-400 max-w-2xl">
                    A real-time chronological timeline of all vault events and authentication activity.
                </p>
            </header>

            <Card className="bg-neutral-900/40 border-neutral-800 relative z-0">
                <CardContent className="p-0">
                    {events.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center text-neutral-500">
                            <KeyRound className="w-10 h-10 mb-4 opacity-30" />
                            <p className="font-medium">No activity yet.</p>
                            <p className="text-sm mt-1">Actions like check-ins and item creation will appear here.</p>
                        </div>
                    ) : (
                        <div className="relative p-6 space-y-8">
                            {/* Vertical Timeline Line */}
                            <div className="absolute top-0 bottom-0 left-[41px] w-px bg-neutral-800 -z-10" />

                            {events.map(event => {
                                const { Icon, color } = iconMap[event.type]
                                return (
                                    <div key={event.id} className="flex gap-6 relative">
                                        <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 z-10 ${colorClasses[color]}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 space-y-1 pt-2">
                                            <p className="font-medium text-white text-base">{event.title}</p>
                                            <p className="text-sm text-neutral-400">{event.description}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs font-mono text-neutral-500">
                                                    {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                                                </span>
                                                {event.blockchainTxHash && (
                                                    <a
                                                        href={`https://amoy.polygonscan.com/tx/${event.blockchainTxHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded-sm border border-blue-900/50 hover:bg-blue-900/50 transition-colors"
                                                    >
                                                        ⛓️ Verify On-Chain
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <div className="p-4 border-t border-neutral-800/50 text-center bg-black/20">
                        <p className="text-xs font-mono text-neutral-600">{events.length} events tracked</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
