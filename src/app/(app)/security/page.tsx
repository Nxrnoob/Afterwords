"use client"

import { useState, useEffect } from "react"
import { Shield, KeyRound, Smartphone, Monitor, Lock, Download, Trash2, Fingerprint } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { ActiveSessions } from "@/components/ActiveSessions"
import { AuditLogList } from "@/components/AuditLogList"

export default function SecurityPage() {
    const [appLockEnabled, setAppLockEnabled] = useState(false)
    const [pinSetupVisible, setPinSetupVisible] = useState(false)
    const [newPin, setNewPin] = useState("")
    const [pinError, setPinError] = useState("")

    useEffect(() => {
        const existingPin = localStorage.getItem("afterword_app_lock_pin")
        if (existingPin) {
            setAppLockEnabled(true)
        }
    }, [])

    const handleToggleLock = (checked: boolean) => {
        if (!checked) {
            localStorage.removeItem("afterword_app_lock_pin")
            setAppLockEnabled(false)
            setPinSetupVisible(false)
            setNewPin("")
        } else {
            setPinSetupVisible(true)
        }
    }

    const handleSavePin = async () => {
        if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
            setPinError("PIN must be exactly 4 digits.")
            return
        }

        const encoder = new TextEncoder()
        const data = encoder.encode(newPin)
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        localStorage.setItem("afterword_app_lock_pin", hashHex)
        setAppLockEnabled(true)
        setPinSetupVisible(false)
        setNewPin("")
        setPinError("")
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-10">
            <header className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg">
                        <Shield className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Security Center</h1>
                </div>
                <p className="text-neutral-400 max-w-2xl">
                    Manage your Secret Key, active devices, and configure local app lock protocols.
                </p>
            </header>

            {/* Secret Key Section */}
            <section>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-neutral-400" /> Cryptographic Identity
                </h2>
                <Card className="bg-neutral-900/40 border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-white">Master Secret Key</CardTitle>
                        <CardDescription className="text-neutral-400">
                            Your vault is encrypted using your Password + Secret Key. We do not store this key anywhere on our servers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-neutral-950/80 border border-neutral-800 rounded-lg py-8 px-4 flex flex-col items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Lock className="w-8 h-8 text-neutral-600 mb-3" />
                            <p className="text-sm font-medium text-neutral-500 mb-4">Key is hidden for security</p>
                            <div className="flex gap-3">
                                <Button variant="outline" className="bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800">
                                    Reveal Key
                                </Button>
                                <Button className="bg-emerald-500 text-black hover:bg-emerald-400 font-semibold">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF Backup
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>



            {/* Active Sessions Section */}
            <section>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-neutral-400" /> Active Sessions
                </h2>
                <ActiveSessions />
            </section>

            {/* Audit Log Section */}
            <section>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-neutral-400" /> Account Activity Log
                </h2>
                <Card className="bg-neutral-900/40 border-neutral-800">
                    <CardContent className="p-4">
                        <AuditLogList />
                    </CardContent>
                </Card>
            </section>
        </div>
    )
}
