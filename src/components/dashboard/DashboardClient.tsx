"use client"

import { useState, useMemo, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Chip } from "@/components/ui/Chip"
import { formatCurrency } from "@/lib/utils"
import { WorkDay, Earning, Expense, Platform, ExpenseCategory, Currency } from "@/lib/types"
import { Plus, Minus, Power, Save, ArrowLeft, TrendingUp, TrendingDown, DollarSign, Gauge } from "lucide-react"
import { ExpensesPieChart } from "./Charts"

type View = "dashboard" | "add-earning" | "add-expense" | "close-day"

export default function DashboardClient({
    user,
    initialWorkDay,
    initialEarnings,
    initialExpenses,
}: {
    user: any
    initialWorkDay: WorkDay | null
    initialEarnings: Earning[]
    initialExpenses: Expense[]
}) {
    const [view, setView] = useState<View>("dashboard")
    const [workDay, setWorkDay] = useState<WorkDay | null>(initialWorkDay)
    const [earnings, setEarnings] = useState<Earning[]>(initialEarnings)
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
    const [loading, setLoading] = useState(false)

    const supabase = createClient()

    // KPIs
    const kpis = useMemo(() => {
        const earningsBrl = earnings.filter(e => e.currency === 'BRL').reduce((acc, curr) => acc + curr.amount, 0)
        const earningsUsd = earnings.filter(e => e.currency === 'USD').reduce((acc, curr) => acc + curr.amount, 0)
        const expensesBrl = expenses.filter(e => e.currency === 'BRL').reduce((acc, curr) => acc + curr.amount, 0)
        const expensesUsd = expenses.filter(e => e.currency === 'USD').reduce((acc, curr) => acc + curr.amount, 0)

        return {
            earningsBrl,
            earningsUsd,
            expensesBrl,
            expensesUsd,
            profitBrl: earningsBrl - expensesBrl,
            profitUsd: earningsUsd - expensesUsd,
            perKmBrl: workDay?.km_total ? (earningsBrl - expensesBrl) / workDay.km_total : 0,
            perKmUsd: workDay?.km_total ? (earningsUsd - expensesUsd) / workDay.km_total : 0,
        }
    }, [earnings, expenses, workDay?.km_total])

    // Actions
    const handleStartDay = async () => {
        setLoading(true)
        try {
            const today = new Date().toISOString().split('T')[0]
            const { data, error } = await supabase
                .from('work_days')
                .insert({
                    user_id: user.id,
                    date: today,
                    status: 'open',
                    km_total: 0
                })
                .select()
                .single()

            if (error) throw error
            setWorkDay(data)
        } catch (e) {
            alert("Erro ao iniciar dia. Verifique se já não existe um dia aberto.")
        } finally {
            setLoading(false)
        }
    }

    const handleEndDay = async () => {
        setLoading(true)
        try {
            if (!workDay) return
            const { error } = await supabase
                .from('work_days')
                .update({ status: 'closed', ended_at: new Date().toISOString() })
                .eq('id', workDay.id)

            if (error) throw error
            setWorkDay(null)
            setEarnings([])
            setExpenses([])
            setView('dashboard')
        } catch (e) {
            alert("Erro ao finalizar dia")
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateKm = async (km: number) => {
        if (!workDay) return
        const { error } = await supabase
            .from('work_days')
            .update({ km_total: km })
            .eq('id', workDay.id)

        if (!error) {
            setWorkDay({ ...workDay, km_total: km })
        }
    }

    // Sub-components for views
    if (view === "add-earning") {
        return (
            <AddTransaction
                type="earning"
                onBack={() => setView('dashboard')}
                onSave={(t) => {
                    setEarnings([...earnings, t as Earning])
                    setView('dashboard')
                }}
                workDayId={workDay?.id!}
                userId={user.id}
            />
        )
    }

    if (view === "add-expense") {
        return (
            <AddTransaction
                type="expense"
                onBack={() => setView('dashboard')}
                onSave={(t) => {
                    setExpenses([...expenses, t as Expense])
                    setView('dashboard')
                }}
                workDayId={workDay?.id!}
                userId={user.id}
            />
        )
    }

    // Main Dashboard View
    if (!workDay) {
        return (
            <div className="flex flex-col items-center justify-center p-6 h-[80vh] space-y-6">
                <h1 className="text-3xl font-bold text-center text-slate-800">Bom dia, Parceiro!</h1>
                <p className="text-slate-500 text-center">Nenhum dia de trabalho aberto hoje.</p>
                <Button size="lg" className="w-full max-w-xs text-xl h-16" onClick={handleStartDay} disabled={loading}>
                    <Power className="mr-2 h-6 w-6" /> Iniciar Dia
                </Button>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-4 pb-20">
            {/* Header / Status */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-700">Resumo do Dia</h1>
                    <p className="text-xs text-slate-500">{new Date(workDay.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Input
                        type="number"
                        className="w-24 h-10 text-right"
                        placeholder="KM"
                        value={workDay.km_total || ''}
                        onChange={(e) => handleUpdateKm(Number(e.target.value))}
                    />
                    <span className="text-sm font-bold text-slate-500">KM</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Lucro (R$)" value={kpis.profitBrl} type="profit" />
                <MetricCard label="Lucro (US$)" value={kpis.profitUsd} type="profit" />
                <MetricCard label="Ganhos (R$)" value={kpis.earningsBrl} type="neutral" />
                <MetricCard label="Ganhos (US$)" value={kpis.earningsUsd} type="neutral" />
                <MetricCard label="R$/KM" value={kpis.perKmBrl} type="info" />
                <MetricCard label="US$/KM" value={kpis.perKmUsd} type="info" />
            </div>

            {/* Action Buttons - Fixed Bottom or Inline? User said "Botões: Adicionar ganho..." on Dashboard */}
            {/* For Mobile ease, big buttons in the flow are good */}
            <div className="grid grid-cols-2 gap-4 pt-2">
                <Button size="lg" className="h-20 text-lg flex flex-col bg-emerald-600 hover:bg-emerald-700" onClick={() => setView('add-earning')}>
                    <Plus className="h-6 w-6 mb-1" />
                    Ganho
                </Button>
                <Button size="lg" className="h-20 text-lg flex flex-col bg-rose-600 hover:bg-rose-700" onClick={() => setView('add-expense')}>
                    <Minus className="h-6 w-6 mb-1" />
                    Custo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <ExpensesPieChart expenses={expenses} currency="BRL" />
                <ExpensesPieChart expenses={expenses} currency="USD" />
            </div>

            <Button variant="outline" className="w-full mt-6 border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700" onClick={handleEndDay}>
                Finalizar Dia
            </Button>
        </div>
    )
}

// Helper Components (can be moved later)
function MetricCard({ label, value, type }: { label: string, value: number, type: 'profit' | 'neutral' | 'info' }) {
    const color = type === 'profit' ? (value >= 0 ? 'text-emerald-600' : 'text-rose-600')
        : type === 'info' ? 'text-blue-600'
            : 'text-slate-700'

    return (
        <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col items-center justify-center">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{label}</span>
                <span className={`text-xl font-mono font-bold ${color}`}>
                    {type === 'profit' || type === 'neutral'
                        ? (label.includes('US$') ? formatCurrency(value, 'USD') : formatCurrency(value, 'BRL'))
                        : value.toFixed(2)
                    }
                </span>
            </CardContent>
        </Card>
    )
}

function AddTransaction({ type, onBack, onSave, workDayId, userId }: {
    type: 'earning' | 'expense',
    onBack: () => void,
    onSave: (t: Earning | Expense) => void,
    workDayId: string,
    userId: string
}) {
    const supabase = createClient()
    const [amount, setAmount] = useState("")
    const [currency, setCurrency] = useState<Currency>("BRL")
    // Chips
    const platforms: Platform[] = ['Uber', '99', 'InDrive', 'Por fora']
    const categories: ExpenseCategory[] = ['alimentacao', 'abastecimento', 'manutencao', 'outros']

    const [selectedChip, setSelectedChip] = useState<string>("")
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        if (!amount || !selectedChip) return
        setLoading(true)
        try {
            const table = type === 'earning' ? 'earnings' : 'expenses'
            const payload: any = {
                user_id: userId,
                work_day_id: workDayId,
                amount: parseFloat(amount),
                currency,
            }

            if (type === 'earning') {
                payload.platform = selectedChip
            } else {
                payload.category = selectedChip
            }

            const { data, error } = await supabase.from(table).insert(payload).select().single()
            if (error) throw error
            onSave(data)
        } catch (e) {
            console.error(e)
            alert("Erro ao salvar")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-4 space-y-6 min-h-screen flex flex-col">
            <div className="flex items-center space-x-4 mb-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-600 hover:bg-slate-100">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h2 className="text-xl font-bold text-slate-800">
                    {type === 'earning' ? 'Adicionar Ganho' : 'Adicionar Custo'}
                </h2>
            </div>

            {/* Amount */}
            <div className="space-y-2">
                <label className="text-sm text-slate-500 font-medium">Valor</label>
                <div className="flex space-x-2">
                    <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                        <button
                            className={`px-3 rounded-lg text-sm font-bold transition-all ${currency === 'BRL' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            onClick={() => setCurrency('BRL')}
                        >
                            R$
                        </button>
                        <button
                            className={`px-3 rounded-lg text-sm font-bold transition-all ${currency === 'USD' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            onClick={() => setCurrency('USD')}
                        >
                            U$
                        </button>
                    </div>
                    <Input
                        type="number"
                        inputMode="decimal"
                        className="text-2xl font-mono h-14"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* Chips */}
            <div className="space-y-3">
                <label className="text-sm text-slate-500 font-medium">
                    {type === 'earning' ? 'Plataforma' : 'Categoria'}
                </label>
                <div className="flex flex-wrap gap-3">
                    {type === 'earning'
                        ? platforms.map(p => (
                            <Chip
                                key={p}
                                label={p}
                                selected={selectedChip === p}
                                onClick={() => setSelectedChip(p)}
                            />
                        ))
                        : categories.map(c => (
                            <Chip
                                key={c}
                                label={c}
                                selected={selectedChip === c}
                                onClick={() => setSelectedChip(c)}
                            />
                        ))
                    }
                </div>
            </div>

            <div className="flex-1"></div>

            <Button size="lg" className="w-full h-14 text-lg" onClick={handleSave} disabled={loading || !amount || !selectedChip}>
                {loading ? 'Salvando...' : 'Salvar'}
            </Button>
        </div>
    )
}
