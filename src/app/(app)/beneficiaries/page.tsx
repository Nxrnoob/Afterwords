import { Users, Mail, Phone, Trash2, FileText, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { AddContactSheet } from "@/components/AddContactSheet"
import { CoverLetterEditor } from "@/components/CoverLetterEditor"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { deleteContact } from "@/app/actions/contacts"

export default async function BeneficiariesPage() {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const contacts = await prisma.contact.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" }
    })

    const coverLetter = await prisma.coverLetter.findUnique({
        where: { userId: session.user.id }
    })

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-12 mb-20 md:mb-0">
            <header className="space-y-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Beneficiaries Hub</h1>
                    </div>
                    <p className="text-neutral-400 max-w-2xl">
                        Manage the trusted people who will receive your vault contents if you stop checking in.
                    </p>
                </div>
                <AddContactSheet />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contacts.map(contact => (
                    <Card key={contact.id} className="bg-neutral-900/40 border-neutral-800 flex flex-col hover:bg-neutral-900/60 transition-colors">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 font-bold uppercase">
                                    {contact.name.substring(0, 2)}
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                    contact.isTrusted 
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                        : "bg-neutral-800 text-neutral-400 border-neutral-700"
                                }`}>
                                    {contact.isTrusted ? "Trusted" : "Added"}
                                </span>
                            </div>
                            <CardTitle className="text-white">{contact.name}</CardTitle>
                            <CardDescription className="text-neutral-400 flex flex-col gap-1 mt-2">
                                <span className="flex items-center gap-2"><Mail className="w-3 h-3" /> {contact.email}</span>
                                {contact.phone && <span className="flex items-center gap-2"><Phone className="w-3 h-3" /> {contact.phone}</span>}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="bg-neutral-950/50 rounded-lg p-3 border border-neutral-800/50 text-sm">
                                <span className="text-white font-medium">0</span> items addressed.
                            </div>
                        </CardContent>
                        <CardFooter className="pt-2">
                            <form action={async () => {
                                "use server"
                                await deleteContact(contact.id)
                            }} className="w-full">
                                <Button variant="outline" type="submit" className="w-full border-red-900/50 text-red-400 bg-transparent hover:bg-red-950/30 hover:text-red-300">
                                    <Trash2 className="w-4 h-4 mr-2" /> Remove
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>
                ))}

                {contacts.length === 0 && (
                    <div className="border border-neutral-800 border-dashed rounded-2xl flex flex-col items-center justify-center text-center bg-neutral-900/20 py-12 px-6 col-span-full">
                        <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
                            <UserPlus className="w-8 h-8 text-neutral-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">No Beneficiaries Yet</h3>
                        <p className="text-neutral-400 max-w-sm">
                            Add trusted contacts to ensure your legacy is successfully recovered when the time comes.
                        </p>
                    </div>
                )}
            </div>

            <section className="pt-8 border-t border-neutral-800/50">
                <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg shrink-0 mt-1">
                        <FileText className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Global Cover Letter</h2>
                        <p className="text-sm text-neutral-400 mt-1">
                            This message will be decrypted and shown to ALL beneficiaries before they view their specific items. Use this to provide context or final wishes.
                        </p>
                    </div>
                </div>
                
                <Card className="bg-neutral-900/40 border-neutral-800">
                    <CardContent className="p-6">
                        <CoverLetterEditor initialEncryptedContent={coverLetter?.encryptedContent} />
                    </CardContent>
                </Card>
            </section>
        </div>
    )
}
