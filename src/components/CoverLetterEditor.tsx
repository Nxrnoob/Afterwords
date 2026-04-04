"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { saveCoverLetter } from "@/app/actions/contacts"
import { useToast } from "@/hooks/use-toast"
import { encryptData, decryptData, deriveKey } from "@/lib/client-encryption"

export function CoverLetterEditor({ initialEncryptedContent = "" }: { initialEncryptedContent?: string }) {
    const [content, setContent] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()

    const vibrate = (ms: number | number[] = 30) => {
        if (typeof window !== "undefined" && navigator.vibrate) {
            navigator.vibrate(ms)
        }
    }

    // Decrypt on mount
    useEffect(() => {
        async function loadContent() {
            if (!initialEncryptedContent) {
                setContent("If you are reading this, the Afterword dead man's switch has triggered. This means I am no longer able to access my accounts. I have securely left items for you in this vault.")
                setIsLoading(false)
                return
            }

            try {
                const password = sessionStorage.getItem("afterword_password")
                const secretKeyBase64 = localStorage.getItem("afterword_secret_key")

                if (!password || !secretKeyBase64) {
                    throw new Error("Missing keys")
                }

                const dKey = await deriveKey(password, secretKeyBase64)
                const decryptedStr = await decryptData(initialEncryptedContent, dKey)
                setContent(decryptedStr)
            } catch (err) {
                console.error("Failed to decrypt cover letter", err)
                setContent("Error: Failed to decrypt cover letter. Your encryption keys may be missing.")
            } finally {
                setIsLoading(false)
            }
        }

        loadContent()
    }, [initialEncryptedContent])

    const handleSave = async () => {
        setIsSaving(true)
        vibrate(30)
        
        try {
            const password = sessionStorage.getItem("afterword_password")
            const secretKeyBase64 = localStorage.getItem("afterword_secret_key")

            if (!password || !secretKeyBase64) {
                throw new Error("Missing encryption keys")
            }

            const dKey = await deriveKey(password, secretKeyBase64)
            const encryptedStr = await encryptData(content, dKey)

            await saveCoverLetter(encryptedStr)
            
            vibrate([30, 50, 30])
            toast({
                title: "Cover Letter Saved",
                description: "Your global message has been encrypted and secured.",
            })
        } catch (error) {
            console.error(error)
            vibrate([50, 100, 50])
            toast({
                title: "Error",
                description: "Failed to encrypt and save cover letter.",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="pt-6">
            <Textarea 
                placeholder="Write your cover letter here..." 
                className="min-h-[150px] bg-neutral-950/50 border-neutral-800 focus-visible:ring-emerald-500 text-white resize-none text-base"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isLoading || isSaving}
            />
            <div className="flex justify-end mt-4">
                <Button 
                    onClick={handleSave} 
                    disabled={isLoading || isSaving || !content}
                    className="bg-emerald-500 text-black hover:bg-emerald-400 font-bold rounded-xl px-8 h-12 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                    {isSaving ? "Encrypting..." : "Save Cover Letter"}
                </Button>
            </div>
        </div>
    )
}
