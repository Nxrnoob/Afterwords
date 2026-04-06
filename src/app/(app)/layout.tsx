import { Navigation } from "@/components/Navigation"
import { AppLockWrapper } from "@/components/AppLockWrapper"
import InstallPrompt from "@/components/InstallPrompt"

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppLockWrapper>
            <div className="flex min-h-[100dvh] bg-black text-white">
                <Navigation />
                <main className="flex-1 pb-24 md:pb-0 overflow-x-hidden w-full relative">
                    {children}
                    <InstallPrompt />
                </main>
            </div>
        </AppLockWrapper>
    )
}
