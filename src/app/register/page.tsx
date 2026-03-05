"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { register } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { motion } from "framer-motion"

export default function RegisterPage() {
    const router = useRouter()
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError("")
        const res = await register(formData)
        if (res?.error) {
            setError(res.error)
            setLoading(false)
        } else {
            router.push("/login?registered=true")
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-black relative overflow-hidden">
            <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-blue-900/20 blur-[100px] rounded-full point-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm z-10"
            >
                <Card className="border-neutral-800 bg-neutral-900/60 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-2xl font-bold tracking-tight text-white text-center">
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
        </div>
    )
}
