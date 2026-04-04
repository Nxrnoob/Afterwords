"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getDecryptedVaultItem } from "@/app/actions/vault"
import { FileText, Key, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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

export default function VaultItemViewer({ items }: { items: any[] }) {
    const [selectedItem, setSelectedItem] = useState<DecryptedItem | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)

    async function handleView(item: any) {
        setLoadingId(item.id)
        try {
            const res = await getDecryptedVaultItem(item.id)
            if (res.success && res.item) {
                let displayItem: any = { ...res.item }

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
                    } catch (decErr) {
                        toast.error("Failed to decrypt locally. Key error.")
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
        } catch (e) {
            toast.error("An unexpected error occurred")
        } finally {
            setLoadingId(null)
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
                                        <p className="text-xs text-neutral-500 truncate max-w-[150px]">To: {item.recipientEmail}</p>
                                        {item.storageProvider === "IPFS" && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-900/30 text-emerald-500 rounded-sm border border-emerald-900/50">
                                                IPFS
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {loadingId === item.id ? (
                                <Loader2 className="w-4 h-4 text-neutral-500 animate-spin" />
                            ) : (
                                <div className="w-2 h-2 rounded-full bg-emerald-500/50 mt-1"></div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="bg-neutral-950 border-neutral-800 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {selectedItem?.itemType === 'credential' ? <Key className="w-5 h-5 text-neutral-400" /> : <FileText className="w-5 h-5 text-neutral-400" />}
                            {selectedItem?.title}
                            {selectedItem?.storageProvider === "IPFS" && (
                                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-900/40 text-emerald-400 rounded-full border border-emerald-900/50 ml-1">
                                    Web3
                                </span>
                            )}
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
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
