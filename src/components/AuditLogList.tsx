"use client"

import { useEffect, useState } from "react"
import { getAuditLogs } from "@/app/actions/audit"
import { Loader2 } from "lucide-react"

export function AuditLogList() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getAuditLogs()
            .then(data => setLogs(data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-emerald-500" /></div>
    
    if (logs.length === 0) return <p className="text-sm text-neutral-400 py-4">No activity recorded yet.</p>

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(dateString))
    }

    return (
        <div className="space-y-3 mt-4">
            {logs.map(log => (
                <div key={log.id} className="flex flex-col gap-1 p-3 bg-neutral-900 border border-neutral-800 rounded-md">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{log.action}</span>
                        <span className="text-xs text-neutral-500">{formatDate(log.createdAt)}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-neutral-400 mt-1">
                        {log.entityType && <span>Target: {log.entityType}</span>}
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                        {log.userAgent && <span className="truncate max-w-[200px]" title={log.userAgent}>Device: {log.userAgent}</span>}
                    </div>
                </div>
            ))}
        </div>
    )
}
