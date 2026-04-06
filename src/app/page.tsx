"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">

      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full point-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full point-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-900/10 blur-[100px] rounded-full point-events-none" />


      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl space-y-8 relative z-10"
      >
        <div className="flex justify-center mb-6">
          <Image
            src="/icon-512x512.png"
            alt="Afterword Logo"
            width={72}
            height={72}
            className="rounded-2xl shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]"
            priority
          />
        </div>

        <div className="inline-flex items-center rounded-full border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm px-3 py-1 text-sm text-neutral-300 font-medium mb-4">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
          Afterword Phase 1 is Live
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-br from-white via-neutral-200 to-neutral-600 text-transparent bg-clip-text leading-tight pb-2">
          A private time capsule <br className="hidden md:block" />
          with a dead man&apos;s switch.
        </h1>

        <p className="text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Your files and messages stay completely locked. They reach the right person only if you&apos;re truly gone — automatically, securely, and completely private.
        </p>

        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" asChild className="h-14 px-8 text-base font-semibold bg-white text-black hover:bg-neutral-200 transition-colors rounded-full shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
            <Link href="/register">Create Your Vault</Link>
          </Button>
          <Button size="lg" variant="ghost" asChild className="h-14 px-8 text-base font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-full transition-colors border border-neutral-800">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>

        <div className="pt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-4xl mx-auto border-t border-neutral-800/50 mt-12">
          <div className="space-y-4">
            <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
            <h3 className="font-semibold text-lg text-neutral-200">Zero-Trust Security</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">Everything is encrypted before it leaves your device. We can never see your private files.</p>
          </div>
          <div className="space-y-4">
            <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <h3 className="font-semibold text-lg text-neutral-200">Automated Release</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">Set your check-in interval. If you miss it and the grace period expires, your trusted contacts are notified.</p>
          </div>
          <div className="space-y-4">
            <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
            </div>
            <h3 className="font-semibold text-lg text-neutral-200">Self-Sovereign</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">Fully open-source. Export your entire vault anytime, or self-host your own instance in minutes.</p>
          </div>
        </div>

      </motion.div>
    </div>
  )
}
