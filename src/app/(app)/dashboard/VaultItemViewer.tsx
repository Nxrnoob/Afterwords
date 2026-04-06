"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getDecryptedVaultItem, deleteVaultItem } from "@/app/actions/vault"
import { updateItemSchedule } from "@/app/actions/item-schedule"
import { forceReleaseItem } from "@/app/actions/release"
import { FileText, Key, Loader2, Eye, EyeOff, Settings2, CalendarClock, CheckCircle2, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { decryptData, importKey } from "@/lib/client-encryption"

type DecryptedItem = {
    id: string
    title: string
    itemType: string
    recipientEmail: string
    storageProvider?: string
    clientEncrypted?: boolean
    rawCiphertext?: string
    decryptedContent?: string | null
    credentials?: {
        username?: string,
        password?: string,
        url?: string,
        filename?: string,
        mimeType?: string,
        data?: string
    } | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function VaultItemViewer({ items }: { items: any[] }) {
    const [selectedItem, setSelectedItem] = useState<DecryptedItem | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)

    // Per-item schedule config
    const [scheduleOpen, setScheduleOpen] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [scheduleItem, setScheduleItem] = useState<any>(null)
    const [scheduleDate, setScheduleDate] = useState("")
    const [isPending, startTransition] = useTransition()
    const [isDeleting, setIsDeleting] = useState(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function handleView(item: any) {
        setLoadingId(item.id)
        try {
            const res = await getDecryptedVaultItem(item.id)
            if (res.success && res.item) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const displayItem = { ...res.item } as any

                if (displayItem.clientEncrypted && displayItem.rawCiphertext) {
                    const b64Key = sessionStorage.getItem("afterword_vault_key")
                    if (!b64Key) {
                        toast.error("Local encryption key missing. Please log out and back in.")
                        setLoadingId(null)
                        return
                    }
                    try {
                        const key = await importKey(b64Key)
                        const dec = await decryptData(displayItem.rawCiphertext, key)
                        
                        if (displayItem.itemType === 'credential' || displayItem.itemType === 'file') {
                            displayItem.credentials = JSON.parse(dec)
                        } else {
                            displayItem.decryptedContent = dec
                        }
                    } catch (decErr: unknown) {
                        const errMsg = decErr instanceof Error ? decErr.message : "Unknown error"
                        console.error("Local Decryption Error:", decErr)
                        toast.error(`Local Decryption Error: ${errMsg}`)
                        setLoadingId(null)
                        return
                    }
                }

                setSelectedItem(displayItem)
                setShowPassword(false)
                setIsOpen(true)
            } else {
                toast.error(res.error || "Failed to retrieve item")
            }
        } catch {
            toast.error("An unexpected error occurred")
        } finally {
            setLoadingId(null)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function openScheduleConfig(e: React.MouseEvent, item: any) {
        e.stopPropagation() // Don't trigger card click (view)
        setScheduleItem(item)
        setScheduleDate(item.scheduledReleaseDate ? new Date(item.scheduledReleaseDate).toISOString().slice(0, 16) : "")
        setScheduleOpen(true)
    }

    function handleScheduleSave() {
        if (!scheduleItem) return
        startTransition(async () => {
            try {
                await updateItemSchedule(scheduleItem.id, scheduleDate || null)
                toast.success(scheduleDate ? `Release scheduled for ${scheduleDate}` : "Per-item schedule removed")
                setScheduleOpen(false)
            } catch {
                toast.error("Failed to update schedule")
            }
        })
    }

    function handleScheduleClear() {
        if (!scheduleItem) return
        startTransition(async () => {
            try {
                await updateItemSchedule(scheduleItem.id, null)
                toast.success("Per-item schedule cleared")
                setScheduleOpen(false)
            } catch {
                toast.error("Failed to clear schedule")
            }
        })
    }

    function handleForceRelease() {
        if (!selectedItem) return
        if (!confirm("Are you sure you want to release this immediately? This is irreversible.")) return
        
        startTransition(async () => {
            try {
                const res = await forceReleaseItem(selectedItem.id)
                if (res?.success) {
                    toast.success(`Released! Sent ${res.emailsSent} notification email(s).`)
                    setIsOpen(false)
                }
            } catch {
                toast.error("Failed to force release this item.")
            }
        })
    }

    async function handleDelete(e: React.MouseEvent) {
        e.stopPropagation()
        if (!selectedItem) return
        if (!confirm("Are you sure you want to permanently delete this secure item? This action cannot be undone.")) return
        
        setIsDeleting(true)
        try {
            const res = await deleteVaultItem(selectedItem.id)
            if (res.success) {
                toast.success("Item permanently deleted")
                setIsOpen(false)
            } else {
                toast.error("Failed to delete item")
            }
        } catch {
            toast.error("An unexpected error occurred while deleting")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <>
            <div className="grid sm:grid-cols-2 gap-4">
                {items.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => handleView(item)}
                        className="group p-5 bg-neutral-900/40 border border-neutral-800/80 rounded-xl hover:bg-neutral-800/80 hover:border-neutral-700 transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-950 rounded-md border border-neutral-800 group-hover:border-neutral-700 transition-colors">
                                    {item.itemType === 'credential' ? (
                                        <Key className="w-4 h-4 text-neutral-400" />
                                    ) : (
                                        <FileText className="w-4 h-4 text-neutral-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-medium text-neutral-200 group-hover:text-white transition-colors">{item.title}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xs text-neutral-500 truncate max-w-[120px]">To: {item.recipientEmail}</p>
                                        {item.storageProvider === "IPFS" && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-900/30 text-emerald-500 rounded-sm border border-emerald-900/50">
                                                IPFS
                                            </span>
                                        )}
                                        {item.scheduledReleaseDate && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-900/30 text-purple-400 rounded-sm border border-purple-900/50 flex items-center gap-0.5">
                                                <CalendarClock className="w-2.5 h-2.5" />
                                                {new Date(item.scheduledReleaseDate).toLocaleString(undefined, {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        )}
                                        {item.blockchainTxHash && (
                                            <a 
                                                href={`https://amoy.polygonscan.com/tx/${item.blockchainTxHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded-sm border border-blue-900/50 flex items-center gap-0.5 hover:bg-blue-900/50 transition-colors"
                                                title="View on-chain proof"
                                            >
                                                ⛓️ On-Chain
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={(e) => openScheduleConfig(e, item)}
                                    className="p-1.5 rounded-md text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Configure release schedule"
                                >
                                    <Settings2 className="w-3.5 h-3.5" />
                                </button>
                                {loadingId === item.id ? (
                                    <Loader2 className="w-4 h-4 text-neutral-500 animate-spin" />
                                ) : (
                                    <div className="w-2 h-2 rounded-full bg-emerald-500/50 mt-1"></div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Item View Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="bg-neutral-950 border-neutral-800 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl justify-between">
                            <div className="flex items-center gap-2">
                                {selectedItem?.itemType === 'credential' ? <Key className="w-5 h-5 text-neutral-400" /> : <FileText className="w-5 h-5 text-neutral-400" />}
                                {selectedItem?.title}
                                {selectedItem?.storageProvider === "IPFS" && (
                                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-900/40 text-emerald-400 rounded-full border border-emerald-900/50 ml-1">
                                        Web3
                                    </span>
                                )}
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting} className="text-red-400 hover:text-red-300 hover:bg-red-950/30">
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                        </DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Addressed to: {selectedItem?.recipientEmail}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4">
                        {selectedItem?.itemType === "credential" && selectedItem.credentials ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg space-y-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Username / Email</p>
                                        <p className="font-mono text-neutral-200 bg-black/50 p-2 rounded border border-neutral-800/50 break-all">{selectedItem.credentials.username}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Password</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-mono text-neutral-200 bg-black/50 p-2 rounded border border-neutral-800/50 flex-1 overflow-x-auto whitespace-nowrap">
                                                {showPassword ? selectedItem.credentials.password : '••••••••••••••••'}
                                            </p>
                                            <Button variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="flex-shrink-0 text-neutral-400 hover:text-white">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    {selectedItem.credentials.url && (
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">URL</p>
                                            <a href={selectedItem.credentials.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors break-all text-sm block bg-black/50 p-2 rounded border border-neutral-800/50">
                                                {selectedItem.credentials.url}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : selectedItem?.itemType === "file" && selectedItem.credentials ? (
                            <div className="p-6 bg-black/40 border border-neutral-800 rounded-lg flex flex-col items-center justify-center space-y-4 text-center">
                                <div className="p-4 bg-neutral-900 rounded-full">
                                    <FileText className="w-8 h-8 text-neutral-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">{selectedItem.credentials.filename || "Secure File"}</p>
                                    <p className="text-xs text-neutral-500 mt-1">{selectedItem.credentials.mimeType || "Unknown type"}</p>
                                </div>
                                <Button asChild className="mt-4 bg-white text-black hover:bg-neutral-200">
                                    <a
                                        href={`data:${selectedItem.credentials.mimeType};base64,${selectedItem.credentials.data}`}
                                        download={selectedItem.credentials.filename || "decrypted_file"}
                                    >
                                        Download File
                                    </a>
                                </Button>
                            </div>
                        ) : (
                            <div className="p-4 bg-black/40 border border-neutral-800 rounded-lg max-h-[60vh] overflow-y-auto">
                                <p className="whitespace-pre-wrap text-neutral-200 leading-relaxed font-mono text-sm break-words">
                                    {selectedItem?.decryptedContent || "No content available."}
                                </p>
                            </div>
                        )}
                        <div className="pt-4 border-t border-neutral-800/60 mt-6 flex justify-end">
                            <Button 
                                variant="outline" 
                                disabled={isPending}
                                onClick={handleForceRelease}
                                className="text-red-400 border-red-900/30 bg-red-950/10 hover:bg-red-950/30 hover:text-red-300 transition-colors"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                {isPending ? "Releasing..." : "Force Release Now"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Per-Item Schedule Config Dialog */}
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                <DialogContent className="bg-neutral-950 border-neutral-800 text-white sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <CalendarClock className="w-5 h-5 text-purple-400" />
                            Release Schedule
                        </DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Set a dedicated release date for &quot;{scheduleItem?.title}&quot;. This overrides the global dead man&apos;s switch for this specific item.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Release Date</Label>
                            <Input
                                type="datetime-local"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                className="h-11 bg-neutral-950/50 border-neutral-800 focus-visible:ring-neutral-600 text-white [color-scheme:dark]"
                            />
                            <p className="text-xs text-neutral-500">
                                This item will be automatically released on this date, regardless of check-in status.
                            </p>
                        </div>

                        {scheduleItem?.scheduledReleaseDate && (
                            <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-950/20 border border-purple-900/30 px-3 py-2 rounded-lg">
                                <CalendarClock className="w-3.5 h-3.5" />
                                Currently set to: {new Date(scheduleItem.scheduledReleaseDate).toLocaleString(undefined, {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            {scheduleItem?.scheduledReleaseDate && (
                                <Button
                                    variant="ghost"
                                    onClick={handleScheduleClear}
                                    disabled={isPending}
                                    className="text-neutral-400 hover:text-red-400"
                                >
                                    Remove
                                </Button>
                            )}
                            <Button
                                onClick={handleScheduleSave}
                                disabled={isPending || !scheduleDate}
                                className="flex-1 h-11 bg-white text-black hover:bg-neutral-200 font-semibold rounded-full"
                            >
                                {isPending ? "Saving..." : (
                                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Save Schedule</>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
