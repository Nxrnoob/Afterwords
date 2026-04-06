import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { auth } from "@/auth"

/**
 * POST /api/test-email
 * 
 * Sends a test email to confirm your email configuration works.
 * Body: { "to": "your@email.com" }
 * 
 * Or use GET for browser testing:
 *   http://localhost:3000/api/test-email?to=your@email.com
 */
export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let to: string
    try {
        const body = await req.json()
        to = body.to
    } catch {
        return NextResponse.json({ error: "Send JSON body with { to: 'email@example.com' }" }, { status: 400 })
    }

    if (!to) {
        return NextResponse.json({ error: "Missing 'to' field" }, { status: 400 })
    }

    try {
        const result = await sendEmail({
            to,
            subject: "✅ Afterword Test Email — It Works!",
            html: `
                <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
                    <h2 style="color: #10b981;">Email Configuration is Working 🎉</h2>
                    <p>This is a test email from your Afterword vault.</p>
                    <p>If you're seeing this, your email setup is correctly configured.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                    <p style="color: #999; font-size: 12px;">Sent at ${new Date().toISOString()}</p>
                </div>
            `
        })

        return NextResponse.json({
            success: true,
            message: `Email sent to ${to}`,
            result,
            config: {
                provider: process.env.RESEND_API_KEY ? "Resend" : process.env.SMTP_HOST ? "SMTP" : "Console (simulated)",
            }
        })
    } catch (err) {
        return NextResponse.json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        }, { status: 500 })
    }
}

export async function GET(req: Request) {
    const url = new URL(req.url)
    const to = url.searchParams.get("to")

    if (!to) {
        return NextResponse.json({
            usage: "GET /api/test-email?to=your@email.com",
            currentConfig: {
                resend: !!process.env.RESEND_API_KEY,
                smtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
                willSimulate: !process.env.RESEND_API_KEY && !(process.env.SMTP_HOST && process.env.SMTP_USER),
            }
        })
    }

    // Reuse POST handler
    const fakeReq = new Request(req.url, {
        method: "POST",
        body: JSON.stringify({ to }),
        headers: { "Content-Type": "application/json" },
    })
    return POST(fakeReq)
}
