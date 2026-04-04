"use client"

import { useState } from "react"
import { addVaultItem } from "@/app/actions/vault"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { encryptData, importKey } from "@/lib/client-encryption"
import { useEffect } from "react"
import { getContacts } from "@/app/actions/contacts"

export default function AddItemClientWrapper() {
    const [itemType, setItemType] = useState<"note" | "credential" | "file">("note")
    const [storageProvider, setStorageProvider] = useState<"DATABASE" | "IPFS">("DATABASE")
    const [loading, setLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [contacts, setContacts] = useState<any[]>([])

    useEffect(() => {
        getContacts().then(data => setContacts(data)).catch(console.error)
    }, [])

    async function handleSubmit(formData: FormData) {
        setLoading(true)

        let serializedPayload = ""

        try {
            if (itemType === "credential") {
                serializedPayload = JSON.stringify({
                    username: formData.get("username") as string,
                    password: formData.get("password") as string,
                    url: formData.get("url") as string || ""
                })
            } else if (itemType === "file" && selectedFile) {
                const arrayBuffer = await selectedFile.arrayBuffer()
                const bytes = new Uint8Array(arrayBuffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64Data = window.btoa(binary);

                serializedPayload = JSON.stringify({
                    filename: selectedFile.name,
                    mimeType: selectedFile.type,
                    data: base64Data
                })
            } else {
                serializedPayload = formData.get("content") as string
            }

            const b64Key = sessionStorage.getItem("afterword_vault_key")
            if (b64Key) {
                const key = await importKey(b64Key)
                const encryptedPayload = await encryptData(serializedPayload, key)
                formData.set("encryptedContent", encryptedPayload)

                // Remove clear text from the form data so it's not sent over the wire
                formData.delete("username")
                formData.delete("password")
                formData.delete("url")
                formData.delete("content")
                formData.delete("file")
            } else {
                // If the user lost their memory key, we fallback to server-side encryption for backwards compatibility
                if (itemType === "file" && selectedFile) {
                    formData.set("file", selectedFile)
                }
            }

            await addVaultItem(formData)
            toast.success(b64Key ? `Item encrypted locally and saved to ${storageProvider === 'IPFS' ? 'Web3 IPFS' : 'Database'}!` : "Item saved securely.")
            setItemType("note")
            setStorageProvider("DATABASE")
            setSelectedFile(null)
            const formObj = document.getElementById("addItemForm") as HTMLFormElement
            if (formObj) formObj.reset()
        } catch (e) {
            console.error(e)
            toast.error("Failed to encrypt and save item.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form id="addItemForm" action={handleSubmit}>
            <CardContent className="space-y-5">
                <div className="flex bg-neutral-950/50 p-1 rounded-lg border border-neutral-800">
                    <button
                        type="button"
                        onClick={() => setItemType("note")}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${itemType === "note" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"}`}
                    >
                        Secure Note
                    </button>
                    <button
                        type="button"
                        onClick={() => setItemType("credential")}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${itemType === "credential" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"}`}
                    >
                        Credential
                    </button>
                    <button
                        type="button"
                        onClick={() => setItemType("file")}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${itemType === "file" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"}`}
                    >
                        File
                    </button>
                </div>

                <input type="hidden" name="itemType" value={itemType} />

                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Storage Medium</label>
                    <div className="flex bg-neutral-950/50 p-1 rounded-lg border border-neutral-800">
                        <label className={`flex-1 flex cursor-pointer select-none items-center justify-center py-2 text-sm font-medium rounded-md transition-colors ${storageProvider === "DATABASE" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"}`}>
                            <input type="radio" value="DATABASE" name="storageProvider" checked={storageProvider === "DATABASE"} onChange={() => setStorageProvider("DATABASE")} className="hidden" />
                            Database (Platform)
                        </label>
                        <label className={`flex-1 flex cursor-pointer select-none items-center justify-center py-2 text-sm font-medium rounded-md transition-colors ${storageProvider === "IPFS" ? "bg-emerald-900/40 text-emerald-400 shadow-sm border border-emerald-900/50" : "text-neutral-400 hover:text-neutral-200"}`}>
                            <input type="radio" value="IPFS" name="storageProvider" checked={storageProvider === "IPFS"} onChange={() => setStorageProvider("IPFS")} className="hidden" />
                            Web3 (IPFS)
                        </label>
                    </div>
                    {storageProvider === "IPFS" && (
                        <p className="text-xs text-yellow-500/80 pt-1 font-medium">
                            Warning: IPFS data is globally distributed. Only destroying your decryption key guarantees data deletion.
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Title</label>
                    <input id="title" name="title" required className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-600 text-white transition-colors" placeholder={itemType === "note" ? "e.g. Bank Account Details" : itemType === "file" ? "e.g. Will and Testament PDF" : "e.g. AWS Production Details"} />
                </div>

                <div className="space-y-2">
                    <label htmlFor="recipientEmail" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Beneficiary</label>
                    <select id="recipientEmail" name="recipientEmail" required className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-600 text-white transition-colors appearance-none">
                        <option value="" disabled selected>Select a contact...</option>
                        {contacts.map(contact => (
                            <option key={contact.id} value={contact.email}>{contact.name} ({contact.email})</option>
                        ))}
                    </select>
                </div>

                <AnimatePresence mode="popLayout">
                    {itemType === "note" && (
                        <motion.div
                            key="note-fields"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-2"
                        >
                            <label htmlFor="content" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Secret Message</label>
                            <textarea id="content" name="content" required={itemType === "note"} className="flex min-h-[120px] w-full rounded-md border border-neutral-800 bg-neutral-950/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-600 text-white transition-colors resize-none" placeholder="Enter sensitive information here..." />
                        </motion.div>
                    )}

                    {itemType === "credential" && (
                        <motion.div
                            key="cred-fields"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Username / Email</label>
                                <input id="username" name="username" required={itemType === "credential"} className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-600 text-white transition-colors" placeholder="admin@domain.com" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Password</label>
                                <input id="password" name="password" type="password" required={itemType === "credential"} className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-600 text-white transition-colors" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="url" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Login URL (Optional)</label>
                                <input id="url" name="url" type="url" className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-600 text-white transition-colors" placeholder="https://..." />
                            </div>
                        </motion.div>
                    )}

                    {itemType === "file" && (
                        <motion.div
                            key="file-fields"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-2"
                        >
                            <label htmlFor="file" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Select File (~4MB Max)</label>
                            <input
                                id="file"
                                type="file"
                                required={itemType === "file"}
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                className="flex w-full rounded-md border border-neutral-800 bg-neutral-950/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-600 text-neutral-400 transition-colors file:mr-4 file:rounded-md file:border-0 file:bg-neutral-800 file:px-4 file:py-1 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-700 cursor-pointer"
                            />
                            {selectedFile && <p className="text-xs text-emerald-500 font-medium pt-1">File ready. It will be encrypted locally before storage.</p>}
                        </motion.div>
                    )}
                </AnimatePresence>

            </CardContent>
            <div className="p-6 pt-0 mt-2">
                <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-neutral-200 transition-colors font-semibold">
                    {loading ? "Encrypting & Saving..." : "Encrypt & Add Item"}
                </Button>
            </div>
        </form>
    )
}
