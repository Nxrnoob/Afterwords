import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { decryptString } from "@/lib/encryption"
import { Lock, FileText, Key, Calendar } from "lucide-react"
import { RecipientDecrypter } from "@/components/RecipientDecrypter"

export default async function RecipientAccessPage({
    params
}: {
    params: { token: string }
}) {
    // 1. Find the token
    const releaseToken = await prisma.releaseToken.findUnique({
        where: { token: params.token },
        include: {
            vaultItem: {
                include: {
                    user: true
                }
            }
        }
    })

    if (!releaseToken || releaseToken.expiresAt < new Date()) {
        notFound()
    }

    // 2. Mark as accessed if first time
    if (!releaseToken.accessedAt) {
        await prisma.releaseToken.update({
            where: { id: releaseToken.id },
            data: { accessedAt: new Date() }
        })
    }

    // 3. Decrypt payload
    let isClientEncrypted = releaseToken.vaultItem.encryptedContent.startsWith("CLIENT_ENCRYPTED:")
    let decryptedContent = "Error decrypting content."
    let structuredData: any = null

    if (!isClientEncrypted) {
        try {
            decryptedContent = decryptString(releaseToken.vaultItem.encryptedContent)
            if (releaseToken.vaultItem.itemType === "credential" || releaseToken.vaultItem.itemType === "file") {
                structuredData = JSON.parse(decryptedContent)
            }
        } catch (e) {
            console.error("Failed to decrypt recipient payload", e)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-12 relative overflow-hidden flex flex-col items-center justify-center">
            {/* Background Details */}
            <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-blue-900/10 blur-[150px] rounded-full point-events-none" />

            <div className="w-full max-w-2xl relative z-10 space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-3 bg-neutral-900/40 border border-neutral-800 rounded-full mb-4">
                        <Lock className="w-6 h-6 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Secure Message Released</h1>
                    <p className="text-neutral-400">
                        This secure information has been automatically released to you by <span className="text-white font-medium">{releaseToken.vaultItem.user.email}</span>.
                    </p>
                </div>

                <Card className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800">
                    <CardHeader className="border-b border-neutral-800/50 pb-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl flex items-center gap-2">
                                {releaseToken.vaultItem.itemType === "credential" ? <Key className="w-5 h-5 text-neutral-400" /> : <FileText className="w-5 h-5 text-neutral-400" />}
                                {releaseToken.vaultItem.title}
                            </CardTitle>
                            <span className="text-xs font-medium px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                                {isClientEncrypted ? "Zero-Knowledge" : "Verified Intact"}
                            </span>
                        </div>
                        <CardDescription className="text-neutral-500 flex items-center gap-2 mt-2">
                            <Calendar className="w-4 h-4" />
                            Created on {new Date(releaseToken.vaultItem.createdAt).toLocaleDateString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {isClientEncrypted ? (
                            <RecipientDecrypter ciphertext={releaseToken.vaultItem.encryptedContent} itemType={releaseToken.vaultItem.itemType} />
                        ) : releaseToken.vaultItem.itemType === "credential" && structuredData ? (
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
                        ) : releaseToken.vaultItem.itemType === "file" && structuredData ? (
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
                    </CardContent>
                </Card>

                <div className="text-center">
                    <p className="text-xs text-neutral-600">
                        This access token will expire on {new Date(releaseToken.expiresAt).toLocaleDateString()}.
                        <br />
                        Please save this information securely.
                    </p>
                </div>
            </div>
        </div>
    )
}
