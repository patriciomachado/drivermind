"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Expense } from "@/lib/types"

export function ExpensesPieChart({ expenses, currency }: { expenses: Expense[], currency: 'BRL' | 'USD' }) {
    const data = expenses
        .filter(e => e.currency === currency)
        .reduce((acc, curr) => {
            const existing = acc.find(item => item.name === curr.category)
            if (existing) {
                existing.value += curr.amount
            } else {
                acc.push({ name: curr.category, value: curr.amount })
            }
            return acc
        }, [] as { name: string, value: number }[])

    if (data.length === 0) return null

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="text-base">Custos por Categoria ({currency})</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            itemStyle={{ color: '#f8fafc' }}
                            formatter={(value: number | undefined) => [`${currency} ${(value || 0).toFixed(2)}`, 'Valor']}
                        />
                        <Bar dataKey="value" fill="#e11d48" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
