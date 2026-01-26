"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import {
    Car, Fuel, Wallet, MapPin, Plus, Trash2, LogOut, ChevronRight,
    AlertCircle, CheckCircle2, LayoutDashboard, Utensils, History,
    TrendingUp, ArrowRight, Lock, Mail, LogIn, Calendar, TrendingDown, X, Target, Edit2, BarChart3, Download, User as UserIcon
} from 'lucide-react';
import SecurityWrapper from './SecurityWrapper';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    user_id: string;
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

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'glass';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

const Button = ({
    children, onClick, variant = 'primary', className = '', disabled = false, size = 'md', fullWidth = false
}: ButtonProps) => {
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

const Card = ({ children, className = '', title, onClick }: { children: React.ReactNode, className?: string, title?: string, onClick?: () => void }) => (
    <div onClick={onClick} className={`bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}>
        {title && <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{title}</h3>}
        {children}
    </div>
);

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input = ({ label, error, icon, ...props }: CustomInputProps) => (
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

// --- LANDING PAGE ---
const LandingView = ({ onSignup, onLogin }: { onSignup: () => void, onLogin: () => void }) => {
    return (
        <div className="min-h-screen bg-[#0F172A] text-white relative overflow-hidden flex flex-col">
            {/* Background Decor */}
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/40 to-transparent pointer-events-none"></div>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-600/20 rounded-full blur-[100px]"></div>

            <div className="relative z-10 flex-1 flex flex-col items-center px-6 pt-12 pb-6">
                {/* Header / Logo */}
                <div className="flex items-center gap-2 mb-8 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
                    <img src="/logo.png" className="w-8 h-8 rounded-full border border-white/20" alt="Logo" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                    <span className="font-bold text-sm tracking-widest uppercase text-slate-200">Driver Mind</span>
                </div>

                {/* Hero Section */}
                <div className="text-center mb-10 max-w-lg mx-auto">
                    <h1 className="text-5xl font-extrabold tracking-tight mb-4 leading-[1.1]">
                        Pare de pagar <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">para trabalhar.</span>
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        90% dos motoristas não sabem seu lucro real. O <strong>Driver Mind</strong> é a inteligência que coloca dinheiro no seu bolso.
                    </p>
                </div>

                {/* Visual Hook / Cards */}
                <div className="w-full max-w-sm relative mb-12">
                    {/* Floating Card 1 */}
                    <div className="absolute -left-4 top-10 bg-[#1E293B] p-4 rounded-2xl shadow-2xl border border-slate-700/50 transform -rotate-6 animate-in slide-in-from-left duration-700">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-500/20 p-2 rounded-lg text-red-500"><Fuel size={20} /></div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Gasto Real</div>
                                <div className="text-white font-bold">-R$ 850,00</div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Card 2 (Hero) */}
                    <div className="bg-[#1E293B]/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-indigo-500/30 relative z-10 transform translate-y-2">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <div className="text-xs text-slate-400 uppercase font-bold mb-1">Lucro da Semana</div>
                                <div className="text-3xl font-bold text-emerald-400">R$ 1.890,74</div>
                            </div>
                            <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 w-[75%]"></div>
                        </div>
                        <div className="mt-2 text-[10px] text-slate-500 text-right">Meta: 75% atingida</div>
                    </div>

                    {/* Floating Card 3 */}
                    <div className="absolute -right-4 bottom-10 bg-[#1E293B] p-4 rounded-2xl shadow-2xl border border-slate-700/50 transform rotate-6 animate-in slide-in-from-right duration-1000">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-500"><Car size={20} /></div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Custo / KM</div>
                                <div className="text-white font-bold">R$ 0,85</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Proof */}
                <div className="flex items-center gap-2 mb-8 bg-white/5 py-2 px-4 rounded-xl">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`w-6 h-6 rounded-full border-2 border-[#1E293B] bg-slate-400 flex items-center justify-center text-[8px] font-bold text-slate-800`}>U{i}</div>
                        ))}
                    </div>
                    <span className="text-xs text-slate-300">Usado por <strong>+1.200</strong> motoristas</span>
                </div>

                {/* CTA / Actions */}
                <div className="w-full max-w-sm space-y-4">
                    <button
                        onClick={onSignup}
                        className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] transform hover:scale-[1.02] transition-all active:scale-95 relative overflow-hidden group"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            TESTAR GRÁTIS POR 7 DIAS <ChevronRight size={20} />
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </button>

                    <button onClick={onLogin} className="w-full py-3 text-slate-400 font-medium hover:text-white transition-colors">
                        Já tenho uma conta
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 text-center border-t border-white/5 bg-[#0B1120]">
                <p className="text-[10px] text-slate-500">
                    &copy; 2026 Driver Mind. Cancele quando quiser.
                </p>
            </div>
        </div>
    );
};

// --- SALES VIEW (TRIAL EXPIRED) ---
const SalesView = ({ onSubscribe, onLogout }: any) => {
    return (
        <div className="min-h-screen bg-[#0F172A] text-white relative overflow-hidden flex flex-col items-center justify-center p-6 text-center">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-red-900/40 to-transparent pointer-events-none"></div>

            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Lock size={40} className="text-red-500" />
            </div>

            <h1 className="text-3xl font-bold mb-2">Seu teste acabou!</h1>
            <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                Espero que tenha gostado! Para continuar controlando seu <strong className="text-emerald-400">lucro real</strong>, ative sua assinatura.
            </p>

            <div className="bg-[#1E293B] p-6 rounded-3xl border border-indigo-500/30 shadow-2xl w-full max-w-sm relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-500 to-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                    OFERTA ESPECIAL
                </div>
                <div className="text-sm text-slate-400 uppercase font-bold mb-2">Driver Mind Pro</div>
                <div className="flex items-end justify-center gap-1 mb-2">
                    <span className="text-4xl font-bold text-white">12x R$ 5,99</span>
                </div>
                <div className="text-[10px] text-slate-500 mb-6">ou R$ 59,90 à vista</div>

                <ul className="text-left space-y-3 mb-6 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Controle de Ganhos e Gastos</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Relatórios de Lucro Real</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Cálculo de Custo por KM</li>
                </ul>

                <button
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={async () => {
                        try {
                            const res = await fetch('/api/checkout', {
                                method: 'POST',
                                body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID })
                            });
                            const data = await res.json();
                            if (data.url) {
                                window.location.href = data.url;
                            } else {
                                alert('Erro ao iniciar pagamento. Tente novamente.');
                            }
                        } catch (err) {
                            alert('Erro de conexão. Verifique sua intenet.');
                        }
                    }}
                >
                    QUERO CONTINUAR LUCRANDO
                </button>
            </div>

            <button onClick={onLogout} className="text-slate-500 text-sm hover:text-white transition-colors">
                Sair da conta
            </button>
        </div>
    );
};

// --- AUTH (LOGIN/SIGNUP) ---
const AuthView = ({ initialMode, onBack }: { initialMode: 'login' | 'signup', onBack: () => void }) => {
    const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (mode === 'signup') {
                if (!name) throw new Error('Nome é obrigatório.');
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: name } }
                });
                if (error) throw error;
                alert('Cadastro realizado! Verifique seu e-mail para confirmar.');
                setMode('login'); // Switch to login after signup attempt
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center p-6 bg-slate-50">
            <Button variant="ghost" className="absolute top-6 left-4 !w-10 !h-10 !p-0 rounded-full border border-slate-200" onClick={onBack}>
                <ArrowRight className="rotate-180" />
            </Button>

            <div className="mb-8 text-center mt-10">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 overflow-hidden relative">
                    <img src="/logo.png" className="w-full h-full object-cover" alt="Logo" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
                </h1>
                <p className="text-slate-500 text-sm">
                    {mode === 'login' ? 'Entre para gerenciar seus ganhos.' : 'Teste 7 dias grátis.'}
                </p>
            </div>

            <Card className="mb-6">
                <form onSubmit={handleAuth} className="space-y-4">
                    {mode === 'signup' && (
                        <Input label="Nome Completo" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} type="text" icon={<UserIcon size={20} />} required />
                    )}
                    <Input label="E-mail" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} type="email" icon={<Mail size={20} />} required />
                    <Input label="Senha" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} type="password" icon={<Lock size={20} />} required />

                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

                    <Button fullWidth size="lg" disabled={loading}>
                        {loading ? 'Processando...' : (mode === 'login' ? 'Entrar' : 'Cadastrar Grátis')}
                    </Button>
                </form>
            </Card>

            <div className="text-center">
                <button
                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                    className="text-sm text-slate-500 font-medium hover:text-indigo-600 transition-colors"
                >
                    {mode === 'login' ? 'Não tem conta? Teste Grátis' : 'Já tem conta? Fazer Login'}
                </button>
            </div>
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
                        <Input label="Apelido" value={newVehicle.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVehicle({ ...newVehicle, name: e.target.value })} autoFocus placeholder="Ex: Onix Prata" />
                        <Input label="Modelo" value={newVehicle.model} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVehicle({ ...newVehicle, model: e.target.value })} placeholder="Ex: Onix LTZ" />
                        <Input label="Placa" value={newVehicle.plate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVehicle({ ...newVehicle, plate: e.target.value })} placeholder="ABC-1234" />
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

// --- HISTORY DETAIL MODAL (NEW) ---
const HistoryDetailModal = ({ day, vehicles, onClose }: { day: any, vehicles: Record<string, string>, onClose: () => void }) => {
    if (!day) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-900 p-6 text-white relative shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        <X size={20} />
                    </button>
                    <h3 className="text-lg font-bold">Detalhes do Dia</h3>
                    <p className="text-slate-400 text-sm">
                        {new Date(day.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' })}
                    </p>
                    <div className="mt-4 flex gap-4">
                        <div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Lucro Líquido</div>
                            <div className={`text-2xl font-bold ${day.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatCurrency(day.profit)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto p-6 space-y-6 flex-1">
                    {/* Earnings */}
                    <div>
                        <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-3 text-sm">
                            <TrendingUp size={16} className="text-emerald-500" /> Ganhos
                        </h4>
                        <div className="space-y-2">
                            {day.earnings && day.earnings.length > 0 ? (
                                day.earnings.map((e: any) => (
                                    <div key={e.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="font-medium text-slate-600">{e.platform}</span>
                                        <span className="font-bold text-emerald-600">{formatCurrency(e.amount)}</span>
                                    </div>
                                ))
                            ) : <p className="text-xs text-slate-400 italic">Nenhum ganho registrado.</p>}
                        </div>
                    </div>

                    {/* Expenses */}
                    <div>
                        <h4 className="flex items-center gap-2 font-bold text-slate-700 mb-3 text-sm">
                            <TrendingDown size={16} className="text-red-500" /> Despesas
                        </h4>
                        <div className="space-y-2">
                            {day.expenses && day.expenses.length > 0 ? (
                                day.expenses.map((e: any) => (
                                    <div key={e.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-600 capitalize">{e.category}</span>
                                            {e.note && <span className="text-[10px] text-slate-400">{e.note}</span>}
                                        </div>
                                        <span className="font-bold text-red-500">{formatCurrency(e.amount)}</span>
                                    </div>
                                ))
                            ) : <p className="text-xs text-slate-400 italic">Nenhuma despesa registrada.</p>}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100 shrink-0">
                    <Button fullWidth variant="outline" onClick={onClose}>Fechar</Button>
                </div>
            </div>
        </div>
    );
};

// --- HISTORY VIEW ---
const HistoryView = ({ userId }: { userId: string }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<Record<string, string>>({});
    const [selectedDay, setSelectedDay] = useState<any>(null); // For Detail Modal
    const [loading, setLoading] = useState(true);
    const [showChart, setShowChart] = useState(false);

    const fetchHistory = async () => {
        // Fetch vehicles for mapping
        const { data: vParams } = await supabase.from('vehicles').select('id, name');
        const vMap: Record<string, string> = {};
        vParams?.forEach((v: any) => { vMap[v.id] = v.name });
        setVehicles(vMap);

        const { data: days } = await supabase.from('work_days').select('*').eq('user_id', userId).eq('status', 'closed').order('date', { ascending: false });
        if (!days) { setLoading(false); return; }

        const { data: earns } = await supabase.from('earnings').select('*').in('work_day_id', days.map(d => d.id));
        const { data: exps } = await supabase.from('expenses').select('*').in('work_day_id', days.map(d => d.id));

        const compiled = days.map(d => {
            const dayEarns = earns?.filter(e => e.work_day_id === d.id) || [];
            const dayExps = exps?.filter(e => e.work_day_id === d.id) || [];
            const totalInc = dayEarns.reduce((a, b) => a + b.amount, 0);
            const totalCost = dayExps.reduce((a, b) => a + b.amount, 0);
            return {
                ...d,
                earnings: dayEarns,
                expenses: dayExps,
                income: totalInc,
                expense: totalCost,
                profit: totalInc - totalCost
            };
        });
        setHistory(compiled);
        setLoading(false);
    };

    useEffect(() => { fetchHistory(); }, [userId]);

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Relatório Driver Mind", 14, 20);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

        const tableData = history.map(day => [
            new Date(day.date).toLocaleDateString('pt-BR'),
            vehicles[day.vehicle_id] || '-',
            formatCurrency(day.income),
            formatCurrency(day.expense),
            formatCurrency(day.profit),
            (day.km_end - day.km_start) + ' km'
        ]);

        autoTable(doc, {
            head: [['Data', 'Veículo', 'Receita', 'Despesa', 'Lucro', 'KM']],
            body: tableData,
            startY: 35,
            headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
        });

        doc.save("drivermind_relatorio.pdf");
    };

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
                <div className="flex justify-between items-center mb-1">
                    <h2 className="text-2xl font-bold text-slate-900">Histórico</h2>
                    <div className="flex gap-2">
                        <button onClick={exportPDF} className="p-2 rounded-xl bg-white text-slate-400 border border-slate-200 hover:text-indigo-600 hover:border-indigo-600 transition-colors">
                            <Download size={20} />
                        </button>
                        <button onClick={() => setShowChart(!showChart)} className={`p-2 rounded-xl transition-colors ${showChart ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400 border border-slate-200'}`}>
                            <BarChart3 size={20} />
                        </button>
                    </div>
                </div>
                <p className="text-slate-500 text-sm">Finanças por período</p>
            </div>

            {/* CHART SECTION */}
            {showChart && history.length > 0 && (
                <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 pl-2">Evolução do Lucro (Últimos dias)</h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[...history].reverse().slice(-14)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Lucro']} // Fixed type error
                                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

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
                            <div key={day.id} onClick={() => setSelectedDay(day)} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center relative group cursor-pointer active:scale-[0.98] transition-all">
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
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(day.id); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })}

            {/* Modal */}
            <HistoryDetailModal day={selectedDay} onClose={() => setSelectedDay(null)} vehicles={vehicles} />
        </div>
    );
};

// --- CORE: TODAY BOARD ---
const TodayView = ({ vehicle, userId, onAddEarning, onAddExpense, onFinishDay, user }: { vehicle: Vehicle | null, userId: string, onAddEarning: () => void, onAddExpense: () => void, onFinishDay: () => void, user: User }) => {
    const [session, setSession] = useState<WorkDay | null>(null);
    const [earnings, setEarnings] = useState<Earning[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    const [kmStart, setKmStart] = useState('');
    const [kmEnd, setKmEnd] = useState('');

    // Daily Goal
    const [dailyGoal, setDailyGoal] = useState(300);
    const [isEditingGoal, setIsEditingGoal] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('drivermind_daily_goal');
        if (saved) setDailyGoal(parseFloat(saved));
    }, []);

    const saveGoal = (val: number) => {
        setDailyGoal(val);
        localStorage.setItem('drivermind_daily_goal', val.toString());
        setIsEditingGoal(false);
    };

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

    // handleEndDay moved to FinishDayView


    // Calculate
    const totalEarnings = earnings.reduce((a, b) => a + b.amount, 0);
    const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);
    const profit = totalEarnings - totalExpenses;
    const kmDriven = session?.km_end ? session.km_end - session.km_start : 0;

    const goalProgress = Math.min((Math.max(profit, 0) / dailyGoal) * 100, 100);

    if (!vehicle) return <div className="p-10 text-center text-slate-500">Selecione um veículo na garagem.</div>;
    if (loading) return <div className="p-10 text-center text-slate-400">Carregando dia...</div>;

    if (!session) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 overflow-hidden relative">
                    <img src="/logo.png" className="w-full h-full object-cover" alt="Logo" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Vamos lucrar hoje?</h2>
                    <p className="text-slate-500">Inicie seu dia de trabalho para registrar ganhos.</p>
                </div>

                <Card>
                    <div className="text-left space-y-4">
                        <Input label="KM Inicial" type="number" value={kmStart} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKmStart(e.target.value)} placeholder="00000" />
                        <Button fullWidth onClick={handleStartDay}>Iniciar Dia</Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 pb-32 space-y-6">
            {/* Header / Session Info */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Olá, {user.user_metadata?.full_name?.split(' ')[0] || 'Motorista'}!</h1>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Trabalhando com {vehicle.name}
                    </p>
                </div>
                <button onClick={onFinishDay} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-100">
                    Encerrar Dia
                </button>
            </div>

            {/* GOAL CARD (NEW) */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-5 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg">
                            <Target size={16} className="text-white" />
                        </div>
                        <span className="text-xs font-bold text-indigo-100 uppercase tracking-wide">Meta Diária</span>
                    </div>
                    <button onClick={() => setIsEditingGoal(true)} className="p-1 hover:bg-white/10 rounded transition-colors"><Edit2 size={14} className="text-indigo-200" /></button>
                </div>

                {isEditingGoal ? (
                    <div className="flex gap-2 items-center mt-2 relative z-10">
                        <input
                            type="number"
                            autoFocus
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-bold text-lg focus:outline-none focus:bg-white/20"
                            defaultValue={dailyGoal}
                            onBlur={(e) => saveGoal(parseFloat(e.target.value) || 300)}
                            onKeyDown={(e) => e.key === 'Enter' && saveGoal(parseFloat(e.currentTarget.value) || 300)}
                        />
                    </div>
                ) : (
                    <div className="relative z-10">
                        <div className="flex items-end gap-1 mb-1">
                            <span className="text-3xl font-bold">{formatCurrency(profit)}</span>
                            <span className="text-sm text-indigo-200 mb-1.5">/ {formatCurrency(dailyGoal)}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 transition-all duration-1000 ease-out relative" style={{ width: `${goalProgress}%` }}>
                                {goalProgress >= 100 && <div className="absolute inset-0 bg-white/50 animate-pulse"></div>}
                            </div>
                        </div>
                        <div className="text-[10px] text-indigo-200 mt-1 text-right font-medium">
                            {goalProgress >= 100 ? '🎉 META BATIDA!' : `${Math.round(goalProgress)}% concluído`}
                        </div>
                    </div>
                )}
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
                <button
                    onClick={onFinishDay}
                    className="w-full bg-slate-900 text-white p-5 rounded-3xl flex items-center justify-between shadow-xl mt-6 active:scale-95 transition-transform"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 rounded-xl text-white">
                            <CheckCircle2 size={24} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-lg">Encerrar Dia</div>
                            <div className="text-xs text-slate-400">Finalizar expediente e KM</div>
                        </div>
                    </div>
                    <ChevronRight className="text-slate-500" />
                </button>
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
const AddTransactionView = ({ type, session, onBack }: { type: 'expense' | 'earning', session: WorkDay | null, onBack: () => void }) => {
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
            { name: 'Por fora', label: 'Particular', icon: <Wallet size={20} /> }
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

const FinishDayView = ({ userId, vehicleId, onBack }: { userId: string, vehicleId: string, onBack: () => void }) => {
    const [session, setSession] = useState<WorkDay | null>(null);
    const [kmEnd, setKmEnd] = useState('');
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            if (!vehicleId) return;
            const today = getTodayISODateLocal();
            const { data } = await supabase.from('work_days').select('*').eq('vehicle_id', vehicleId).eq('date', today).eq('status', 'open').maybeSingle();
            setSession(data);
            setInitLoading(false);
        };
        fetchSession();
    }, [vehicleId]);

    const handleConfirm = async () => {
        if (!session || !kmEnd) return;
        setLoading(true);
        const { error } = await supabase.from('work_days').update({ status: 'closed', km_end: parseFloat(kmEnd) }).eq('id', session.id);
        if (error) {
            alert(`Erro ao finalizar: ${error.message}`);
            setLoading(false);
        } else {
            onBack();
        }
    };

    if (initLoading) return <div className="p-10 text-center">Carregando...</div>;
    if (!session) return (
        <div className="p-10 text-center flex flex-col items-center justify-center h-full">
            <AlertCircle size={48} className="text-amber-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Dia Não Iniciado</h3>
            <p className="text-slate-500 mb-8 max-w-[200px]">Você já finalizou o dia ou ele não foi aberto.</p>
            <Button onClick={onBack}>Voltar</Button>
        </div>
    );

    return (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex gap-4 items-center">
                <Button variant="ghost" className="!w-10 !h-10 !p-0 rounded-full border border-slate-200" onClick={onBack}><ArrowRight className="rotate-180" /></Button>
                <h2 className="text-xl font-bold text-slate-900">Encerrar Dia</h2>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100/50 shadow-sm text-center relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-slate-900`}></div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">KM Final</label>
                <div className={`flex justify-center items-center text-5xl font-bold text-slate-800 mt-4`}>
                    <input autoFocus type="number" inputMode="decimal" value={kmEnd} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKmEnd(e.target.value)} className="w-40 bg-transparent outline-none text-center placeholder:text-slate-200" placeholder="00000" />
                </div>
                <p className="text-xs text-slate-400 mt-2">KM Inicial: {session.km_start}</p>
            </div>

            <Button fullWidth size="lg" onClick={handleConfirm} disabled={!kmEnd || loading} className="bg-slate-900 hover:bg-slate-800 text-white">
                {loading ? 'Finalizando...' : 'Confirmar Encerramento'}
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
        const init = async () => {
            if (!user) return;
            // 1. Try local storage
            const saved = localStorage.getItem(`active_vehicle_${user.id}`);
            if (saved) {
                setActiveVehicleId(saved);
            } else {
                // 2. If no saved vehicle, check if user has ANY vehicles
                const { count } = await supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
                if (count && count > 0) {
                    setActiveTab('vehicles'); // Force garage if he has cars but none selected
                }
            }
        };
        init();
    }, [user]);

    useEffect(() => {
        if (user && activeVehicleId) localStorage.setItem(`active_vehicle_${user.id}`, activeVehicleId);
    }, [activeVehicleId, user]);

    // Close menu on tab change
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setIsMenuOpen(false);
    };

    const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing');

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium">Carregando Driver Mind...</div>;

    if (!user) {
        if (authView === 'landing') return <LandingView onSignup={() => setAuthView('signup')} onLogin={() => setAuthView('login')} />;
        return <AuthView initialMode={authView === 'signup' ? 'signup' : 'login'} onBack={() => setAuthView('landing')} />;
    }

    // CHECK TRIAL EXPIRATION
    const TRIAL_DAYS = 7;
    const daysSinceCreation = user.created_at ? Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 3600 * 24)) : 0;

    // Check both app_metadata (secure) and user_metadata (dashboard editable)
    const isPro = user.app_metadata?.subscription_status === 'active' || user.user_metadata?.subscription_status === 'active';
    const isTrialExpired = daysSinceCreation > TRIAL_DAYS && !isPro;

    if (isTrialExpired) {
        return <SalesView onSubscribe={() => alert('Fluxo de pagamento em desenvolvimento...')} onLogout={() => supabase.auth.signOut()} />;
    }

    const renderContent = () => {
        if (activeTab === 'today') return <TodayWrapper userId={user.id} vehicleId={activeVehicleId} onTabChange={setActiveTab} user={user} />;
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
        if (activeTab === 'finish-day') {
            return <FinishDayWrapper userId={user.id} vehicleId={activeVehicleId} onBack={() => setActiveTab('today')} />
        }
        return renderContent();
    };

    const showNav = !['add-expense', 'add-earning', 'finish-day'].includes(activeTab);

    return (
        <SecurityWrapper>
            <div className="bg-slate-50 min-h-screen max-w-md mx-auto shadow-2xl overflow-hidden relative">
                <main className={`pb-24 ${isMenuOpen ? 'blur-sm brightness-50 pointer-events-none' : ''} transition-all duration-300`}>
                    {MainWrapper()}
                </main>

                {/* FAB (Floating Action Button) */}
                {showNav && (
                    <>
                        {isMenuOpen && (
                            <div className="absolute inset-0 z-40" onClick={() => setIsMenuOpen(false)}>
                                <div className="absolute bottom-24 right-6 flex flex-col gap-3 items-end animate-in slide-in-from-bottom-10 fade-in duration-200">
                                    <button onClick={(e) => { e.stopPropagation(); setActiveTab('add-earning'); setIsMenuOpen(false); }} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg font-bold">
                                        <TrendingUp size={18} /> Novo Ganho
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setActiveTab('add-expense'); setIsMenuOpen(false); }} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg font-bold">
                                        <TrendingDown size={18} /> Nova Despesa
                                    </button>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`absolute bottom-24 right-6 w-14 h-14 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center justify-center text-white z-50 transition-all duration-300 ${isMenuOpen ? 'bg-slate-800 rotate-45' : 'bg-gradient-to-tr from-indigo-600 to-purple-600 hover:scale-110 active:scale-95'}`}
                        >
                            <Plus size={28} strokeWidth={2.5} />
                        </button>
                    </>
                )}

                {/* Navigation Bar */}
                {showNav && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-between items-center text-slate-300 z-50 max-w-md mx-auto">
                        <button onClick={() => handleTabChange('today')} className={`flex flex-col items-center gap-1 ${activeTab === 'today' ? 'text-indigo-600' : 'hover:text-slate-500'}`}>
                            <LayoutDashboard size={24} strokeWidth={activeTab === 'today' ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">Hoje</span>
                        </button>

                        <button onClick={() => handleTabChange('history')} className={`flex flex-col items-center gap-1 ${activeTab === 'history' ? 'text-indigo-600' : 'hover:text-slate-500'}`}>
                            <History size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">Histórico</span>
                        </button>

                        <button onClick={() => handleTabChange('vehicles')} className={`flex flex-col items-center gap-1 ${activeTab === 'vehicles' ? 'text-indigo-600' : 'hover:text-slate-500'}`}>
                            <Car size={24} strokeWidth={activeTab === 'vehicles' ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">Garagem</span>
                        </button>

                        {/* Profile/Logout */}
                        <button onClick={() => handleTabChange('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-indigo-600' : 'hover:text-slate-500'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${activeTab === 'profile' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-200 text-slate-500 border-slate-200'}`}>
                                {user.email?.[0].toUpperCase()}
                            </div>
                            <span className="text-[10px] font-bold">Perfil</span>
                        </button>
                    </div>
                )}
            </div>
        </SecurityWrapper>
    );
}

// --- Wrappers for data fetching ---

const TodayWrapper = ({ userId, vehicleId, onTabChange, user }: { userId: string, vehicleId: string | null, onTabChange: (tab: string) => void, user: User }) => {
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    useEffect(() => {
        if (vehicleId) supabase.from('vehicles').select('*').eq('id', vehicleId).single().then(({ data }) => setVehicle(data));
    }, [vehicleId]);
    return <TodayView userId={userId} vehicle={vehicle} onAddEarning={() => onTabChange('add-earning')} onAddExpense={() => onTabChange('add-expense')} onFinishDay={() => onTabChange('finish-day')} user={user} />;
}

const FinishDayWrapper = ({ userId, vehicleId, onBack }: any) => {
    return <FinishDayView userId={userId} vehicleId={vehicleId} onBack={onBack} />;
}

const TransactionWrapper = ({ userId, vehicleId, type, onBack }: { userId: string, vehicleId: string | null, type: 'expense' | 'earning', onBack: () => void }) => {
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

const NavIcon = ({ icon, label, active, onClick }: { icon: React.ReactElement, label: string, active: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
        {React.cloneElement(icon as any, { size: 24, strokeWidth: active ? 2.5 : 2 })}
        <span className="text-[10px] font-bold">{label}</span>
    </button>
)
