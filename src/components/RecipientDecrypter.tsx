"use client"

import { useState, useEffect } from "react"
import { decryptData, importKey } from "@/lib/client-encryption"
import { FileText, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RecipientDecrypter({ ciphertext, itemType }: { ciphertext: string, itemType: string }) {
    const [decryptedContent, setDecryptedContent] = useState<string | null>(null)
    const [structuredData, setStructuredData] = useState<Record<string, string> | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [manualKey, setManualKey] = useState("")

    useEffect(() => {
        attemptDecryption()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function attemptDecryption(overrideKey?: string) {
        setLoading(true)
        setError(null)
        try {
            // 1. Get Key from Hash or parameter
            let b64Key = overrideKey || ""
            if (!b64Key && typeof window !== 'undefined') {
                b64Key = window.location.hash.replace("#", "")
            }

            if (!b64Key) {
                setLoading(false)
                return // Prompt UI to enter key manually
            }

            const key = await importKey(b64Key)
            const dec = await decryptData(ciphertext, key)

            if (itemType === "credential" || itemType === "file") {
                setStructuredData(JSON.parse(dec))
            } else {
                setDecryptedContent(dec)
            }
        } catch (e) {
            console.error(e)
            setError("Decryption failed. The key provided is invalid or missing.")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-neutral-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Decrypting securely in your browser...</p>
            </div>
        )
    }

    if (!decryptedContent && !structuredData) {
        return (
            <div className="p-6 bg-neutral-900/80 border border-neutral-800 rounded-lg space-y-4">
                <div className="flex items-center gap-3 text-red-400 mb-2">
                    <Lock className="w-5 h-5" />
                    <h3 className="font-semibold">Decryption Key Required</h3>
                </div>
                <p className="text-sm text-neutral-400">
                    This item is secured with Zero-Knowledge encryption. The server does not have the key.
                    If the key was not included in your link, please enter it below.
                </p>
                {error && <p className="text-xs text-red-500 font-medium bg-red-950/30 p-2 rounded">{error}</p>}
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={manualKey} 
                        onChange={(e) => setManualKey(e.target.value)}
                        placeholder="Paste decryption key..."
                        className="flex-1 h-10 rounded-md bg-black border border-neutral-800 px-3 text-sm text-white focus:ring-1 focus:ring-neutral-600 outline-none"
                    />
                    <Button onClick={() => attemptDecryption(manualKey)} className="bg-white text-black hover:bg-neutral-200">
                        Decrypt
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="mt-6">
            {itemType === "credential" && structuredData ? (
                <div className="space-y-4">
                    <div className="p-4 bg-neutral-950/50 border border-neutral-800 rounded-lg space-y-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Username / Email</p>
                            <p className="font-mono text-neutral-200 break-all">{structuredData.username}</p>
                        </div>
                        <div className="h-px bg-neutral-800" />
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Password</p>
                            <p className="font-mono text-neutral-200">{structuredData.password}</p>
                        </div>
                        {structuredData.url && (
                            <>
                                <div className="h-px bg-neutral-800" />
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">URL</p>
                                    <a href={structuredData.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors break-all">
                                        {structuredData.url}
                                    </a>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : itemType === "file" && structuredData ? (
                <div className="p-6 bg-neutral-950/80 border border-neutral-800 rounded-lg flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="p-4 bg-neutral-900 rounded-full">
                        <FileText className="w-8 h-8 text-neutral-400" />
                    </div>
                    <div>
                        <p className="font-medium text-white">{structuredData.filename || "Secure File"}</p>
                        <p className="text-xs text-neutral-500 mt-1">{structuredData.mimeType || "Unknown type"}</p>
                    </div>
                    <a
                        className="mt-4 px-6 py-2 bg-white text-black font-medium rounded-md hover:bg-neutral-200 transition-colors inline-block"
                        href={`data:${structuredData.mimeType};base64,${structuredData.data}`}
                        download={structuredData.filename || "decrypted_file"}
                    >
                        Download File
                    </a>
                </div>
            ) : (
                <div className="p-6 bg-neutral-950/80 border border-neutral-800 rounded-lg">
                    <p className="whitespace-pre-wrap text-neutral-200 leading-relaxed font-mono text-sm break-words">
                        {decryptedContent}
                    </p>
                </div>
            )}
        </div>
    )
}
