/**
 * Returns the app's public base URL.
 * Priority: NEXTAUTH_URL > VERCEL_URL (auto-injected by Vercel) > localhost fallback
 */
export function getAppUrl(): string {
    if (process.env.NEXTAUTH_URL) {
        return process.env.NEXTAUTH_URL.replace(/\/$/, "")
    }
    if (process.env.VERCEL_URL) {
        // VERCEL_URL is just the hostname (no protocol)
        return `https://${process.env.VERCEL_URL}`
    }
    return "http://localhost:3000"
}
