"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<"login" | "signup">("login")
    const [message, setMessage] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            if (mode === "signup") {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                setMessage("Cadastro realizado! Verifique seu email ou faça login.")
                setMode("login")
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                router.push("/")
                router.refresh()
            }
        } catch (error: any) {
            setMessage(error.message || "Ocorreu um erro.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
            <Card className="w-full max-w-md border-slate-200 bg-white shadow-xl">
                <CardHeader>
                    <CardTitle className="text-center text-3xl font-bold text-primary-600">
                        Drivermind
                    </CardTitle>
                    <p className="text-center text-slate-500">
                        {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-primary-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-primary-500"
                            />
                        </div>
                        {message && (
                            <p className="text-center text-sm text-amber-600 bg-amber-50 p-2 rounded">{message}</p>
                        )}
                        <Button
                            type="submit"
                            className="w-full text-lg font-semibold bg-primary-600 hover:bg-primary-700 text-white"
                            disabled={loading}
                            size="lg"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : mode === "login" ? (
                                "Entrar"
                            ) : (
                                "Cadastrar"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <button
                        onClick={() => {
                            setMode(mode === "login" ? "signup" : "login")
                            setMessage(null)
                        }}
                        className="text-sm text-slate-500 hover:text-primary-600 hover:underline transition-colors"
                    >
                        {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entre"}
                    </button>
                </CardFooter>
            </Card>
        </div>
    )
}
