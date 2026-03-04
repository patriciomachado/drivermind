import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { ArrowLeft } from "lucide-react"

export default async function ReportsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center space-x-4">
                <Link href="/">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-xl font-bold">Relatórios</h1>
            </div>

            <div className="text-center text-slate-400 py-10">
                <p>Em breve: Histórico completo de ganhos e custos.</p>
            </div>
        </div>
    )
}
