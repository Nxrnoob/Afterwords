"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import JSZip from "jszip"
import { decryptData, importKey } from "@/lib/client-encryption"
import { toast } from "sonner"

export function ExportVaultButton() {
    const [exporting, setExporting] = useState(false)

    async function handleExport() {
        setExporting(true)
        try {
            const res = await fetch("/api/vault/export/raw")
            if (!res.ok) throw new Error("Failed to fetch vault items")
            
            const rawItems = await res.json()
            if (!rawItems || rawItems.length === 0) {
                toast.error("Your vault is empty.")
                setExporting(false)
                return
            }

            const b64Key = sessionStorage.getItem("afterword_vault_key")
            let clientKey: CryptoKey | null = null
            if (b64Key) {
                clientKey = await importKey(b64Key)
            }

            const zip = new JSZip()
            const notesFolder = zip.folder("Notes")
            const credsFolder = zip.folder("Credentials")
            const filesFolder = zip.folder("Files")

            for (let i = 0; i < rawItems.length; i++) {
                const item = rawItems[i]
                const cleanTitle = item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
                const filename = `${cleanTitle}_${i}.txt`
                
                let decryptedContent = item.decryptedContent
                
                if (item.clientEncrypted && clientKey) {
                    try {
                        decryptedContent = await decryptData(item.rawCiphertext, clientKey)
                    } catch (e) {
                        zip.file(`ERROR_${item.id}.txt`, "Failed to locally decrypt Phase 2 item. Key may be incorrect.")
                        continue
                    }
                } else if (item.clientEncrypted && !clientKey) {
                    zip.file(`ERROR_${item.id}.txt`, "Client key missing in session. Could not decrypt Phase 2 item. Please log out and log back in.")
                    continue
                }

                if (!decryptedContent) {
                    zip.file(`ERROR_${item.id}.txt`, "Failed to decrypt this item. The server encryption key may have changed.")
                    continue
                }

                if (item.itemType === "credential") {
                    try {
                        const credObj = JSON.parse(decryptedContent)
                        const content = `Username: ${credObj.username}\nPassword: ${credObj.password}\nURL: ${credObj.url}\n\nRecipient: ${item.recipientEmail}`
                        credsFolder?.file(filename, content)
                    } catch(e) {
                         zip.file(`ERROR_${item.id}.txt`, "Failed to parse credential.")
                    }
                } else if (item.itemType === "file") {
                    try {
                        const fileObj = JSON.parse(decryptedContent)
                        const originalName = fileObj.filename || `${cleanTitle}.bin`
                        // Decode base64 
                        const binaryString = window.atob(fileObj.data)
                        const bytes = new Uint8Array(binaryString.length)
                        for (let j = 0; j < binaryString.length; j++) {
                            bytes[j] = binaryString.charCodeAt(j)
                        }
                        filesFolder?.file(originalName, bytes)
                    } catch (e) {
                        zip.file(`ERROR_${item.id}.txt`, "Failed to parse file.")
                    }
                } else {
                    const content = `${decryptedContent}\n\nRecipient: ${item.recipientEmail}`
                    notesFolder?.file(filename, content)
                }
            }

            const blob = await zip.generateAsync({ type: "blob" })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "afterword_vault_export.zip"
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            
            toast.success("Vault exported successfully!")
        } catch (e) {
            console.error(e)
            toast.error("An error occurred during export.")
        } finally {
            setExporting(false)
        }
    }

    return (
        <Button onClick={handleExport} disabled={exporting} className="w-full justify-start h-12 bg-neutral-950/50 border border-neutral-800 hover:bg-neutral-800/80 transition-all font-medium text-neutral-300 hover:text-white" variant="outline">
            {exporting ? <Loader2 className="w-4 h-4 mr-3 text-blue-400 animate-spin" /> : <FileText className="w-4 h-4 mr-3 text-neutral-400" />}
            {exporting ? "Exporting Vault..." : "Export Vault (ZIP)"}
        </Button>
    )
}
