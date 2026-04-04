"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { register } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldAlert, Download, ArrowRight, ShieldCheck } from "lucide-react"

export default function RegisterPage() {
    const router = useRouter()
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [secretKey, setSecretKey] = useState<string | null>(null)

    function generateSecretKey() {
        const array = new Uint8Array(16)
        window.crypto.getRandomValues(array)
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').match(/.{1,4}/g)?.join('-').toUpperCase() || ""
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError("")
        const res = await register(formData)
        if (res?.error) {
            setError(res.error)
            setLoading(false)
        } else {
            const newKey = generateSecretKey()
            setSecretKey(newKey)
            setLoading(false)
        }
    }

    function handleFinish() {
        if (secretKey) {
            localStorage.setItem("afterword_secret_key", secretKey)
        }
        router.push("/login?registered=true")
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-black relative overflow-hidden">
            <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-blue-900/20 blur-[100px] rounded-full point-events-none" />

            <AnimatePresence mode="wait">
                {!secretKey ? (
                    <motion.div
                        key="register-form"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                        transition={{ duration: 0.4 }}
                        className="w-full max-w-sm z-10"
                    >
                        <Card className="border-neutral-800 bg-neutral-900/60 backdrop-blur-xl shadow-2xl">
                            <CardHeader className="space-y-1 pb-6">
                                <CardTitle className="text-2xl font-bold tracking-tight text-white text-center flex items-center justify-center gap-2">
                                    Create your vault
                                </CardTitle>
                                <CardDescription className="text-center text-neutral-400">
                                    Enter an email and password to secure your digital items.
                                </CardDescription>
                            </CardHeader>
                            <form action={handleSubmit}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-neutral-300">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="m@example.com"
                                            className="bg-neutral-950/50 border-neutral-800 focus-visible:ring-neutral-700 text-white placeholder:text-neutral-600 transition-colors"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-neutral-300">Password</Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            className="bg-neutral-950/50 border-neutral-800 focus-visible:ring-neutral-700 text-white transition-colors"
                                            required
                                        />
                                    </div>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-sm text-red-400 font-medium bg-red-950/30 border border-red-900/50 rounded-md p-2 text-center"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                    <Button type="submit" className="w-full bg-white text-black hover:bg-neutral-200 transition-all font-semibold mt-2" disabled={loading}>
                                        {loading ? "Initializing Vault..." : "Create Vault"}
                                    </Button>
                                </CardContent>
                            </form>
                            <CardFooter className="flex flex-col border-t border-neutral-800/50 pt-6 mt-2">
                                <div className="text-center text-sm text-neutral-400 w-full">
                                    Already have an account?{" "}
                                    <Link href="/login" className="text-white hover:underline transition-colors font-medium">
                                        Sign in
                                    </Link>
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="secret-key"
                        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="w-full max-w-lg z-10"
                    >
                        <Card className="border-emerald-900/50 bg-neutral-900/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                            <CardHeader className="space-y-3 pb-6 text-center pt-8">
                                <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2 border border-emerald-500/20">
                                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                </div>
                                <CardTitle className="text-3xl font-bold tracking-tight text-white">
                                    Your Secret Key
                                </CardTitle>
                                <CardDescription className="text-neutral-400 text-base max-w-sm mx-auto">
                                    This key is mathematically required to decrypt your vault. <strong className="text-white">We do not store it.</strong> If you lose it, your data is gone forever.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-6 bg-black/60 border border-neutral-800 rounded-xl text-center shadow-inner">
                                    <p className="font-mono text-xl sm:text-2xl text-emerald-400 tracking-wider break-all font-medium selection:bg-emerald-500/30">
                                        {secretKey}
                                    </p>
                                </div>
                                
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 flex items-start gap-3">
                                    <ShieldAlert className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-orange-200 leading-relaxed">
                                        <strong>CRITICAL:</strong> Write this down and store it in a safe place (like a password manager or physical safe). You will need this key when logging into new devices.
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-4 print:hidden">
                                    <Button 
                                        variant="outline" 
                                        className="w-full bg-neutral-950/50 border-neutral-800 text-white hover:bg-neutral-800 h-12"
                                        onClick={() => {
                                            window.print()
                                        }}
                                        type="button"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Save as PDF
                                    </Button>
                                    <Button 
                                        className="w-full bg-emerald-500 text-black hover:bg-emerald-400 h-12 font-semibold"
                                        onClick={handleFinish}
                                        type="button"
                                    >
                                        I saved it <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Print-only Emergency Kit */}
                        <div className="hidden print:block fixed inset-0 bg-white text-black p-12 z-50">
                            <h1 className="text-4xl font-bold mb-4">Afterword Emergency Kit</h1>
                            <p className="text-xl mb-8 border-b pb-4">Keep this document in a secure, physical location.</p>
                            
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold mb-2 text-gray-600">Your Master Secret Key</h2>
                                <p className="font-mono text-3xl font-bold p-6 bg-gray-100 border border-gray-300 rounded block">
                                    {secretKey}
                                </p>
                            </div>
                            
                            <div className="space-y-4 text-lg">
                                <p><strong>What is this?</strong></p>
                                <p>This Secret Key is mathematically required to decrypt your Afterword vault. Your vault is encrypted using a combination of your Password AND this Secret Key.</p>
                                
                                <p><strong>When do I need it?</strong></p>
                                <p>You will need this key whenever you log into Afterword on a new device or browser.</p>
                                
                                <p className="text-red-600 font-bold mt-8">WARNING: If you lose this key, your data cannot be recovered by anyone, including the Afterword team.</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
