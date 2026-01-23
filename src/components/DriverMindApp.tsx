"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import {
    Car, Fuel, Wallet, MapPin, Plus, Trash2, LogOut, ChevronRight,
    AlertCircle, CheckCircle2, LayoutDashboard, Utensils, History,
    TrendingUp, ArrowRight, Lock, Mail, LogIn, Calendar, TrendingDown
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

/**
 * ============================================================================
 * TYPES & HELPERS
 * ============================================================================
 */

type Vehicle = {
    id: string;
    name: string;
    model: string;
    plate?: string;
    active: boolean;
};

type WorkDay = {
    id: string;
    vehicle_id: string;
    date: string;
    km_start: number;
    km_end: number | null;
    status: 'open' | 'closed';
    created_at: string;
};

type ExpenseCategory = 'combustível' | 'alimentação' | 'manutencao' | 'outros';

type Expense = {
    id: string;
    work_day_id: string;
    amount: number;
    category: ExpenseCategory;
    note?: string;
    created_at: string;
};

type Earning = {
    id: string;
    work_day_id: string;
    amount: number;
    platform: string;
    created_at: string;
};

const supabase = createClient();

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

const getTodayISODateLocal = () => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().split('T')[0];
};

/**
 * ============================================================================
 * UI COMPONENTS
 * ============================================================================
 */

const Button = ({
    children, onClick, variant = 'primary', className = '', disabled = false, size = 'md', fullWidth = false
}: any) => {
    const baseStyle = "font-medium rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed";
    const variants: any = {
        primary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40",
        secondary: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40",
        danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
        outline: "border-2 border-slate-200 text-slate-700 bg-transparent hover:bg-slate-50",
        ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
        glass: "bg-white/80 backdrop-blur-md border border-white/50 text-slate-800 shadow-sm"
    };
    const sizes: any = { sm: "px-3 py-2 text-xs", md: "px-5 py-3.5 text-sm", lg: "px-6 py-4 text-base" };

    return (
        <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}>
            {children}
        </button>
    );
};

const Card = ({ children, className = '', title, onClick }: any) => (
    <div onClick={onClick} className={`bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}>
        {title && <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{title}</h3>}
        {children}
    </div>
);

const Input = ({ label, error, icon, ...props }: any) => (
    <div className="w-full">
        {label && <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{label}</label>}
        <div className="relative">
            <input
                {...props}
                className={`w-full px-4 py-4 rounded-2xl bg-slate-50 border-2 ${error ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-indigo-500 focus:bg-white'} focus:outline-none transition-all text-lg font-medium text-slate-800 placeholder:text-slate-300 ${icon ? 'pl-11' : ''}`}
            />
            {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
        </div>
        {error && <span className="text-xs text-red-500 mt-2 block ml-1 font-medium">{error}</span>}
    </div>
);

/**
 * ============================================================================
 * VIEWS
 * ============================================================================
 */

// --- LOGIN ---
const LoginView = ({ onSuccess }: { onSuccess: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        else onSuccess();

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col justify-center p-6 bg-slate-50">
            <div className="mb-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-200">
                    <Car className="text-white w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">DriverFlow</h1>
                <p className="text-slate-500">Gestão Profissional</p>
            </div>
            <Card className="mb-6">
                <form onSubmit={handleLogin} className="space-y-4">
                    <Input label="E-mail" value={email} onChange={(e: any) => setEmail(e.target.value)} type="email" icon={<Mail size={20} />} required />
                    <Input label="Senha" value={password} onChange={(e: any) => setPassword(e.target.value)} type="password" icon={<Lock size={20} />} required />

                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

                    <Button fullWidth size="lg" disabled={loading}>{loading ? 'Entrando...' : 'Acessar Conta'}</Button>
                </form>
            </Card>
        </div>
    );
};

// --- VEHICLES ---
const VehiclesView = ({ userId, activeVehicleId, setActiveVehicleId }: any) => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newVehicle, setNewVehicle] = useState({ name: '', model: '', plate: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVehicles = async () => {
            const { data } = await supabase.from('vehicles').select('*');
            if (data) setVehicles(data);
            setLoading(false);
        };
        fetchVehicles();
    }, []);

    const handleSubmit = async () => {
        if (!newVehicle.name) return;
        const { data, error } = await supabase.from('vehicles').insert({ ...newVehicle, user_id: userId }).select().single();

        if (error) {
            alert(`Erro ao criar veículo: ${error.message}`);
            return;
        }

        if (data) {
            setVehicles([...vehicles, data]);
            setIsAdding(false);
            setNewVehicle({ name: '', model: '', plate: '' });
            if (!activeVehicleId) setActiveVehicleId(data.id);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remover veículo?')) return;
        const { error } = await supabase.from('vehicles').delete().eq('id', id);
        if (error) {
            alert(`Erro ao remover: ${error.message}`);
        } else {
            setVehicles(vehicles.filter(v => v.id !== id));
            if (activeVehicleId === id) setActiveVehicleId(null);
        }
    }

    return (
        <div className="p-6 space-y-6 pb-32">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Garagem</h2>
                <Button size="sm" variant="ghost" onClick={() => setIsAdding(!isAdding)}>{isAdding ? 'Cancelar' : <Plus />}</Button>
            </div>

            {isAdding && (
                <Card>
                    <div className="space-y-4">
                        <Input label="Apelido" value={newVehicle.name} onChange={(e: any) => setNewVehicle({ ...newVehicle, name: e.target.value })} autoFocus placeholder="Ex: Onix Prata" />
                        <Input label="Modelo" value={newVehicle.model} onChange={(e: any) => setNewVehicle({ ...newVehicle, model: e.target.value })} placeholder="Ex: Onix LTZ" />
                        <Input label="Placa" value={newVehicle.plate} onChange={(e: any) => setNewVehicle({ ...newVehicle, plate: e.target.value })} placeholder="ABC-1234" />
                        <Button fullWidth onClick={handleSubmit}>Salvar</Button>
                    </div>
                </Card>
            )}

            <div className="space-y-4">
                {vehicles.map(v => (
                    <div key={v.id} onClick={() => setActiveVehicleId(v.id)} className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${activeVehicleId === v.id ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100'}`}>
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <h3 className="font-bold text-lg">{v.name}</h3>
                                <p className={`text-sm ${activeVehicleId === v.id ? 'text-indigo-200' : 'text-slate-400'}`}>{v.model || 'Sem modelo'} • {v.plate}</p>
                            </div>
                            {activeVehicleId === v.id ? <CheckCircle2 className="text-white" /> : <Trash2 className="text-slate-300 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(v.id) }} />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- HISTORY VIEW ---
const HistoryView = ({ userId }: { userId: string }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        // Fetch vehicles for mapping
        const { data: vParams } = await supabase.from('vehicles').select('id, name');
        const vMap: Record<string, string> = {};
        vParams?.forEach((v: any) => { vMap[v.id] = v.name });
        setVehicles(vMap);

        const { data: days } = await supabase.from('work_days').select('*').eq('status', 'closed').order('date', { ascending: false });
        if (!days) { setLoading(false); return; }

        const { data: earns } = await supabase.from('earnings').select('*');
        const { data: exps } = await supabase.from('expenses').select('*');

        const compiled = days.map(d => {
            const dayEarns = earns?.filter(e => e.work_day_id === d.id) || [];
            const dayExps = exps?.filter(e => e.work_day_id === d.id) || [];
            const totalInc = dayEarns.reduce((a, b) => a + b.amount, 0);
            const totalCost = dayExps.reduce((a, b) => a + b.amount, 0);
            return {
                ...d,
                income: totalInc,
                expense: totalCost,
                profit: totalInc - totalCost
            };
        });
        setHistory(compiled);
        setLoading(false);
    };

    useEffect(() => { fetchHistory(); }, [userId]);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza? Isso apagará todos os ganhos e despesas deste dia.')) return;
        // Cascade delete should handle children if DB configured, mostly we need to manually delete if no cascade.
        // Assuming Supabase RLS allows.
        await supabase.from('earnings').delete().eq('work_day_id', id);
        await supabase.from('expenses').delete().eq('work_day_id', id);
        const { error } = await supabase.from('work_days').delete().eq('id', id);
        if (error) alert('Erro ao excluir: ' + error.message);
        else fetchHistory();
    };

    if (loading) return <div className="p-6 text-center text-slate-400">Carregando histórico...</div>;

    // Grouping
    const groups: Record<string, any[]> = {};
    history.forEach(day => {
        const monthKey = new Date(day.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
        if (!groups[monthKey]) groups[monthKey] = [];
        groups[monthKey].push(day);
    });

    const monthKeys = Object.keys(groups);

    return (
        <div className="p-6 pb-32 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Histórico</h2>
                <p className="text-slate-500 text-sm">Finanças por período</p>
            </div>

            {monthKeys.length === 0 && <p className="text-center text-slate-400 py-10">Nenhum registro encontrado.</p>}

            {monthKeys.map(month => {
                const days = groups[month];
                const mProfit = days.reduce((a, b) => a + b.profit, 0);
                const mKm = days.reduce((a, b) => a + (b.km_end - b.km_start), 0);
                const mCost = days.reduce((a, b) => a + b.expense, 0);
                const costPerKm = mKm > 0 ? mCost / mKm : 0;

                return (
                    <div key={month} className="space-y-3">
                        <div className="flex items-end justify-between px-2">
                            <h3 className="font-bold text-slate-700 capitalize">{month}</h3>
                            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">R$ {costPerKm.toFixed(2)} / km</span>
                        </div>

                        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg flex justify-between items-center">
                            <div>
                                <span className="text-xs text-slate-400 font-bold uppercase">Lucro do Mês</span>
                                <div className="text-xl font-bold text-emerald-400">{formatCurrency(mProfit)}</div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-400 font-bold uppercase">Rodagem</span>
                                <div className="text-lg font-bold">{mKm} km</div>
                            </div>
                        </div>

                        {days.map(day => (
                            <div key={day.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center relative group">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800">{new Date(day.date).toLocaleDateString('pt-BR', { day: 'numeric', timeZone: 'UTC' })} <span className="text-xs font-normal text-slate-400 uppercase">({new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' })})</span></span>
                                        {vehicles[day.vehicle_id] && <span className="text-[10px] text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded uppercase">{vehicles[day.vehicle_id]}</span>}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1 flex gap-2">
                                        <span className="text-emerald-600 font-medium">+{formatCurrency(day.income)}</span>
                                        <span className="text-red-500 font-medium">-{formatCurrency(day.expense)}</span>
                                        <span className="text-slate-300">|</span>
                                        <span>{(day.km_end - day.km_start)} km</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`font-bold text-lg ${day.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {formatCurrency(day.profit)}
                                    </span>
                                    <button onClick={() => handleDelete(day.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

// --- CORE: TODAY BOARD ---
const TodayView = ({ vehicle, userId, onAddEarning, onAddExpense }: { vehicle: Vehicle | null, userId: string, onAddEarning: () => void, onAddExpense: () => void }) => {
    const [session, setSession] = useState<WorkDay | null>(null);
    const [earnings, setEarnings] = useState<Earning[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    const [kmStart, setKmStart] = useState('');
    const [kmEnd, setKmEnd] = useState('');

    const fetchData = async () => {
        if (!vehicle) { setLoading(false); return; }
        const today = getTodayISODateLocal();

        // 1. Session
        const { data: sess } = await supabase.from('work_days').select('*').eq('vehicle_id', vehicle.id).eq('date', today).maybeSingle();
        setSession(sess);

        if (sess) {
            const { data: earns } = await supabase.from('earnings').select('*').eq('work_day_id', sess.id);
            setEarnings(earns || []);
            const { data: exps } = await supabase.from('expenses').select('*').eq('work_day_id', sess.id);
            setExpenses(exps || []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData() }, [vehicle]);

    const handleStartDay = async () => {
        if (!vehicle) { alert('Erro: Nenhum veículo selecionado.'); return; }
        if (!kmStart) { alert('Erro: Informe o KM inicial.'); return; }

        // Upsert approach or Try/Catch unique constraint
        const payload = {
            user_id: userId,
            vehicle_id: vehicle.id,
            date: getTodayISODateLocal(),
            km_start: parseFloat(kmStart),
            status: 'open'
        };

        const { error } = await supabase.from('work_days').insert(payload);

        if (error) {
            // Se já existe (Unique Violation)
            if (error.code === '23505') {
                const today = getTodayISODateLocal();
                // Buscar quem está bloqueando
                const { data: conflict } = await supabase.from('work_days').select('*').eq('user_id', userId).eq('date', today).maybeSingle();

                if (conflict) {
                    if (!conflict.vehicle_id) {
                        // "Adotar" sessão sem veículo
                        await supabase.from('work_days').update({ vehicle_id: vehicle.id, km_start: parseFloat(kmStart), status: 'open' }).eq('id', conflict.id);
                        fetchData();
                    } else if (conflict.vehicle_id !== vehicle.id) {
                        alert(`Você já abriu o dia com outro veículo! Mude para o veículo correto ou exclua o dia no banco de dados.`);
                    } else {
                        // É o mesmo veículo, só recarregar
                        fetchData();
                    }
                }
            } else {
                console.error(error);
                alert(`Erro ao iniciar dia: ${error.message}`);
            }
        } else {
            fetchData();
        }
    };

    const handleEndDay = async () => {
        if (!session || !kmEnd) return;
        const { error } = await supabase.from('work_days').update({ status: 'closed', km_end: parseFloat(kmEnd) }).eq('id', session.id);

        if (error) {
            alert(`Erro ao finalizar dia: ${error.message}`);
        } else {
            fetchData();
        }
    };

    // Calculate
    const totalEarnings = earnings.reduce((a, b) => a + b.amount, 0);
    const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);
    const profit = totalEarnings - totalExpenses;
    const kmDriven = session?.km_end ? session.km_end - session.km_start : 0;

    if (!vehicle) return <div className="p-10 text-center text-slate-500">Selecione um veículo na garagem.</div>;
    if (loading) return <div className="p-10 text-center text-slate-400">Carregando dia...</div>;

    if (!session) {
        return (
            <div className="p-6 pb-32 flex flex-col items-center justify-center h-full">
                <div className="bg-indigo-50 p-4 rounded-full text-indigo-600 mb-6"><Plus size={32} /></div>
                <h2 className="text-2xl font-bold mb-2">Iniciar Dia</h2>
                <p className="text-slate-500 mb-8">{vehicle.name}</p>
                <Card className="w-full max-w-sm">
                    <Input label="KM Inicial" type="number" value={kmStart} onChange={(e: any) => setKmStart(e.target.value)} icon={<span className="text-xs font-bold text-slate-400">KM</span>} />
                    <Button className="mt-4" fullWidth onClick={handleStartDay} disabled={!kmStart}>Abrir Sessão</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 pb-32 space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Hoje</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1 font-medium"><Car size={16} /> {vehicle.name}</p>
                </div>
                <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase border ${session.status === 'open' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                    {session.status === 'open' ? 'Em andamento' : 'Fechado'}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
                    <span className="text-indigo-100 text-xs font-bold uppercase">Lucro Líquido</span>
                    <div className="text-4xl font-bold mt-1">{formatCurrency(profit)}</div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-transform hover:bg-emerald-50" onClick={onAddEarning}>
                    <div className="flex items-center gap-2 mb-2"><TrendingUp size={14} className="text-emerald-500" /> <span className="text-xs font-bold text-slate-400 uppercase">Ganhos</span></div>
                    <span className="text-xl font-bold text-emerald-600">{formatCurrency(totalEarnings)}</span>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-transform hover:bg-red-50" onClick={onAddExpense}>
                    <div className="flex items-center gap-2 mb-2"><TrendingDown size={14} className="text-red-500" /> <span className="text-xs font-bold text-slate-400 uppercase">Despesas</span></div>
                    <span className="text-xl font-bold text-red-500">{formatCurrency(totalExpenses)}</span>
                </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl">
                <div className="flex justify-between border-b border-slate-700 pb-4 mb-4">
                    <div><span className="text-xs text-slate-400 font-bold uppercase">Km Inicial</span><div className="text-lg font-mono">{session.km_start}</div></div>
                    <div className="text-right">
                        <span className="text-xs text-slate-400 font-bold uppercase">Km Final</span>
                        {session.km_end ? <div className="text-lg font-mono">{session.km_end}</div> : <div className="text-sm text-indigo-400 animate-pulse">Em aberto</div>}
                    </div>
                </div>
                <div className="text-center"><span className="text-xs text-slate-400 font-bold uppercase">Rodagem</span><div className="text-2xl font-bold">{kmDriven > 0 ? kmDriven : (session.status === 'closed' ? 0 : '--')} km</div></div>
            </div>

            {session.status === 'open' ? (
                <Card title="Finalizar Dia">
                    <div className="flex gap-2">
                        <Input placeholder="Km Final" type="number" value={kmEnd} onChange={(e: any) => setKmEnd(e.target.value)} />
                        <Button onClick={handleEndDay} disabled={!kmEnd} className="w-14 items-center !px-0"><CheckCircle2 /></Button>
                    </div>
                </Card>
            ) : (
                <Card>
                    <div className="flex flex-col gap-2">
                        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-center font-bold flex items-center justify-center gap-2">
                            <CheckCircle2 size={18} /> Dia Finalizado
                        </div>
                        <Button variant="outline" onClick={async () => {
                            if (!confirm('Deseja reabrir este dia?')) return;
                            await supabase.from('work_days').update({ status: 'open', km_end: null }).eq('id', session.id);
                            fetchData();
                        }}>Reabrir Dia</Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

// --- REGISTER MODALS ---
const AddTransactionView = ({ type, session, onBack }: any) => {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState({ name: 'abastecimento', label: 'Combustível', type: 'expense' }); // default
    const [loading, setLoading] = useState(false);

    // Configurações
    const isExpense = type === 'expense';
    const config = isExpense ? {
        title: 'Nova Despesa',
        color: 'red',
        options: [
            { name: 'abastecimento', label: 'Combustível', icon: <Fuel size={20} /> },
            { name: 'alimentacao', label: 'Alimentação', icon: <Utensils size={20} /> },
            { name: 'manutencao', label: 'Manutenção', icon: <Car size={20} /> },
            { name: 'outros', label: 'Outros', icon: <Wallet size={20} /> }
        ]
    } : {
        title: 'Novo Ganho',
        color: 'emerald',
        options: [
            { name: 'Uber', label: 'Uber', icon: <MapPin size={20} /> },
            { name: '99', label: '99', icon: <MapPin size={20} /> },
            { name: 'InDrive', label: 'InDrive', icon: <MapPin size={20} /> },
            { name: 'Particular', label: 'Particular', icon: <Wallet size={20} /> }
        ]
    };

    // Set initial category based on type
    useEffect(() => {
        setCategory(config.options[0] as any);
    }, [isExpense]);

    const handleSubmit = async () => {
        if (!amount || !session) return;
        setLoading(true);
        try {
            const table = isExpense ? 'expenses' : 'earnings';
            const payload = isExpense
                ? { work_day_id: session.id, amount: parseFloat(amount), category: category.name, currency: 'BRL', user_id: session.user_id }
                : { work_day_id: session.id, amount: parseFloat(amount), platform: category.name, currency: 'BRL', user_id: session.user_id };

            const { error } = await supabase.from(table).insert(payload);
            if (error) throw error;
            onBack();
        } catch (error: any) {
            alert(`Erro ao salvar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!session) return (
        <div className="p-10 text-center flex flex-col items-center justify-center h-full">
            <AlertCircle size={48} className="text-amber-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Dia Não Iniciado</h3>
            <p className="text-slate-500 mb-8 max-w-[200px]">Você precisa iniciar o dia na tela "Hoje" antes de lançar registros.</p>
            <Button onClick={onBack}>Voltar</Button>
        </div>
    );

    return (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex gap-4 items-center">
                <Button variant="ghost" className="!w-10 !h-10 !p-0 rounded-full border border-slate-200" onClick={onBack}><ArrowRight className="rotate-180" /></Button>
                <h2 className="text-xl font-bold text-slate-900">{config.title}</h2>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100/50 shadow-sm text-center relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-${config.color}-500`}></div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Valor</label>
                <div className={`flex justify-center items-center text-5xl font-bold text-slate-800 mt-4`}>
                    <span className="text-3xl text-slate-300 mr-2 -mt-2">R$</span>
                    <input autoFocus type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-40 bg-transparent outline-none text-center placeholder:text-slate-200" placeholder="0" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {config.options.map((opt: any) => (
                    <button
                        key={opt.name}
                        onClick={() => setCategory(opt)}
                        className={`p-4 rounded-2xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${category.name === opt.name
                            ? `border-${config.color}-500 bg-${config.color}-50 text-${config.color}-700 shadow-sm transform scale-[1.02]`
                            : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        <div className={`p-2 rounded-full ${category.name === opt.name ? 'bg-white' : 'bg-slate-100'}`}>{opt.icon}</div>
                        <span className="capitalize text-sm">{opt.label}</span>
                    </button>
                ))}
            </div>

            <Button fullWidth size="lg" onClick={handleSubmit} disabled={!amount || loading} className={isExpense ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}>
                {loading ? 'Salvando...' : 'Confirmar'}
            </Button>
        </div>
    );
};

/**
 * ============================================================================
 * MAIN COMPONENT
 * ============================================================================
 */
export default function DriverMindApp() {
    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState('today');
    const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Dynamic FAB State

    // Initial Auth Check
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Load/Save active vehicle preference
    useEffect(() => {
        if (user) { const saved = localStorage.getItem(`active_vehicle_${user.id}`); if (saved) setActiveVehicleId(saved); }
    }, [user]);
    useEffect(() => {
        if (user && activeVehicleId) localStorage.setItem(`active_vehicle_${user.id}`, activeVehicleId);
    }, [activeVehicleId, user]);

    // Close menu on tab change
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setIsMenuOpen(false);
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium">Carregando DriverFlow...</div>;
    if (!user) return <LoginView onSuccess={() => { }} />;

    const renderContent = () => {
        if (activeTab === 'today') return <TodayWrapper userId={user.id} vehicleId={activeVehicleId} onTabChange={handleTabChange} />;
        if (activeTab === 'history') return <HistoryView userId={user.id} />;
        if (activeTab === 'vehicles') return <VehiclesView userId={user.id} activeVehicleId={activeVehicleId} setActiveVehicleId={setActiveVehicleId} />;
        if (activeTab === 'profile') return (
            <div className="p-6 h-[70vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-2xl shadow-indigo-200">{user.email?.[0].toUpperCase()}</div>
                <h2 className="text-slate-900 font-bold text-lg mb-1">Conta Conectada</h2>
                <p className="mb-8 font-mono bg-slate-100 px-4 py-2 rounded-xl text-slate-500 text-sm">{user.email}</p>
                <Button variant="danger" onClick={() => supabase.auth.signOut()} className="w-full max-w-xs"><LogOut size={18} /> Sair da Conta</Button>
            </div>
        );
        return null; // Fallback
    };

    const MainWrapper = () => {
        if (activeTab === 'add-expense' || activeTab === 'add-earning') {
            return <TransactionWrapper userId={user.id} vehicleId={activeVehicleId} type={activeTab === 'add-expense' ? 'expense' : 'earning'} onBack={() => setActiveTab('today')} />
        }
        return renderContent();
    };

    const showNav = !['add-expense', 'add-earning'].includes(activeTab);

    return (
        <div className="bg-slate-50 min-h-screen max-w-md mx-auto shadow-2xl overflow-hidden relative">
            <main className="h-full overflow-y-auto scrollbar-hide pb-24">
                <MainWrapper />
            </main>

            {/* Backdrop for Menu */}
            {isMenuOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in duration-200" onClick={() => setIsMenuOpen(false)}></div>
            )}

            {showNav && (
                <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <NavIcon icon={<LayoutDashboard />} label="Hoje" active={activeTab === 'today'} onClick={() => handleTabChange('today')} />
                    <NavIcon icon={<History />} label="Histórico" active={activeTab === 'history'} onClick={() => handleTabChange('history')} />

                    <div className="-mt-12 relative z-50">
                        {/* Dynamic Menu Items */}
                        <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col gap-3 transition-all duration-300 ${isMenuOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90 pointer-events-none'}`}>
                            <button onClick={() => handleTabChange('add-expense')} className="flex items-center gap-3 bg-red-500 text-white px-5 py-3.5 rounded-2xl shadow-xl hover:bg-red-600 transition-colors whitespace-nowrap font-bold">
                                <Fuel size={20} className="fill-white/20" /> Nova Despesa
                            </button>
                            <button onClick={() => handleTabChange('add-earning')} className="flex items-center gap-3 bg-emerald-500 text-white px-5 py-3.5 rounded-2xl shadow-xl hover:bg-emerald-600 transition-colors whitespace-nowrap font-bold">
                                <Wallet size={20} className="fill-white/20" /> Novo Ganho
                            </button>
                        </div>

                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-2xl transition-all duration-300 ${isMenuOpen ? 'bg-slate-800 rotate-45 scale-90' : 'bg-gradient-to-tr from-indigo-600 to-blue-600 hover:scale-105'}`}
                        >
                            <Plus size={32} className="text-white" />
                        </button>
                    </div>

                    <NavIcon icon={<Car />} label="Garagem" active={activeTab === 'vehicles'} onClick={() => handleTabChange('vehicles')} />
                    <NavIcon icon={<LogOut />} label="Perfil" active={activeTab === 'profile'} onClick={() => handleTabChange('profile')} />
                </div>
            )}
        </div>
    );
}

// --- Wrappers for data fetching ---

const TodayWrapper = ({ userId, vehicleId, onTabChange }: { userId: string, vehicleId: string | null, onTabChange: (tab: string) => void }) => {
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    useEffect(() => {
        if (vehicleId) supabase.from('vehicles').select('*').eq('id', vehicleId).single().then(({ data }) => setVehicle(data));
    }, [vehicleId]);
    return <TodayView userId={userId} vehicle={vehicle} onAddEarning={() => onTabChange('add-earning')} onAddExpense={() => onTabChange('add-expense')} />;
}

const TransactionWrapper = ({ userId, vehicleId, type, onBack }: any) => {
    const [session, setSession] = useState<WorkDay | null>(null);
    useEffect(() => {
        const fetchSess = async () => {
            const today = getTodayISODateLocal();
            // Fetch ANY open session for today, regardless of vehicleId
            const { data } = await supabase.from('work_days').select('*').eq('user_id', userId).eq('date', today).eq('status', 'open').maybeSingle();
            setSession(data);
        };
        fetchSess();
    }, [userId]); // Removed vehicleId dependency to be more robust
    return <AddTransactionView type={type} session={session} onBack={onBack} />
}

const NavIcon = ({ icon, label, active, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
        {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}
        <span className="text-[10px] font-bold">{label}</span>
    </button>
)
