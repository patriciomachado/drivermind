"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import {
    Car, Fuel, Wallet, MapPin, Plus, Trash2, LogOut, ChevronRight,
    AlertCircle, CheckCircle2, LayoutDashboard, Utensils, History,
    TrendingUp, ArrowRight, Lock, Mail, LogIn, Download, BarChart3,
    User as UserIcon, Share2, RefreshCw, Wrench, Trophy, Target,
    Zap, Bike, X, TrendingDown, Edit2, Settings
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
    type: 'combustion' | 'electric' | 'motorcycle';
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

type Maintenance = {
    id: string;
    vehicle_id: string;
    type: 'oleo' | 'revisao' | 'pneu' | 'outros';
    cost: number;
    date: string;
    km_at_maintenance?: number;
    note?: string;
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


        </div>
    );
};

// --- SALES VIEW (TRIAL EXPIRED) ---
const SalesView = ({ onSubscribe, onLogout }: any) => {
    const handleWhatsApp = () => {
        const message = encodeURIComponent("Olá! Meu período de teste no DriverMind acabou e gostaria de assinar uma licença. Como procedo?");
        window.open(`https://wa.me/5548992253003?text=${message}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-white relative overflow-hidden flex flex-col items-center justify-center p-6 text-center">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-red-900/40 to-transparent pointer-events-none"></div>

            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Lock size={40} className="text-red-500" />
            </div>

            <h1 className="text-3xl font-bold mb-2">Seu teste acabou!</h1>
            <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                Espero que tenha gostado! Para continuar controlando seu <strong className="text-emerald-400">lucro real</strong>, escolha seu plano.
            </p>

            <div className="bg-[#1E293B] p-6 rounded-3xl border border-indigo-500/30 shadow-2xl w-full max-w-sm relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-500 to-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                    OFERTA ESPECIAL
                </div>

                <div className="space-y-4 mb-6">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">Semestral (6 meses)</div>
                        <div className="text-2xl font-bold text-white">R$ 16,90 <span className="text-xs font-normal text-slate-400">/total</span></div>
                        <div className="text-[10px] text-emerald-400">Sai R$ 2,81 por mês!</div>
                    </div>

                    <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-4 rounded-xl border border-indigo-500/50 relative">
                        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">MELHOR VALOR</div>
                        <div className="text-xs text-indigo-200 uppercase font-bold mb-1">Anual (12 meses)</div>
                        <div className="text-3xl font-bold text-white">R$ 21,90 <span className="text-xs font-normal text-slate-400">/ano</span></div>
                        <div className="text-[10px] text-emerald-400 font-bold">Sai R$ 1,82 por mês! 🔥</div>
                    </div>
                </div>

                <p className="text-xs text-slate-400 mb-4 px-4">
                    A liberação é feita manualmente. Clique abaixo para chamar no WhatsApp e ativar sua conta.
                </p>

                <button
                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    onClick={handleWhatsApp}
                >
                    <Share2 size={20} /> FALAR NO WHATSAPP
                </button>
            </div>

            <button onClick={onLogout} className="text-slate-500 text-sm hover:text-white transition-colors">
                Sair da conta
            </button>
        </div>
    );
};

// --- SETTINGS VIEW ---
const SettingsView = ({ user, onBack }: { user: User, onBack: () => void }) => {
    const [name, setName] = useState(user.user_metadata?.full_name || '');
    const [dailyGoal, setDailyGoal] = useState(user.user_metadata?.daily_goal?.toString() || '300');
    const [monthlyGoal, setMonthlyGoal] = useState(user.user_metadata?.monthly_goal?.toString() || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        const dGoal = parseFloat(dailyGoal);
        const mGoal = monthlyGoal ? parseFloat(monthlyGoal) : (dGoal * 26);

        const { error } = await supabase.auth.updateUser({
            data: {
                full_name: name,
                daily_goal: dGoal,
                monthly_goal: mGoal
            }
        });
        setLoading(false);
        if (error) {
            alert('Erro ao salvar: ' + error.message);
        } else {
            alert('Configurações salvas!');
            onBack();
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" className="!w-10 !h-10 !p-0 rounded-full border border-slate-200" onClick={onBack}>
                    <ArrowRight className="rotate-180" />
                </Button>
                <h2 className="text-2xl font-bold text-slate-900">Configurações</h2>
            </div>

            <div className="space-y-6">
                <Card title="Perfil">
                    <Input
                        label="Nome de Exibição"
                        value={name}
                        onChange={(e: any) => setName(e.target.value)}
                        icon={<UserIcon size={20} />}
                    />
                </Card>

                <Card title="Preferências">
                    <Input
                        label="Meta Diária (R$)"
                        type="number"
                        value={dailyGoal}
                        onChange={(e: any) => setDailyGoal(e.target.value)}
                        icon={<Target size={20} />}
                        placeholder="300"
                    />
                    <div className="h-4"></div>
                    <Input
                        label="Meta Mensal (R$)"
                        type="number"
                        value={monthlyGoal}
                        onChange={(e: any) => setMonthlyGoal(e.target.value)}
                        icon={<Trophy size={20} />}
                        placeholder={(parseFloat(dailyGoal || '0') * 26).toString()}
                    />
                    <p className="text-xs text-slate-400 mt-2 px-1">
                        Se deixar vazio, calcularemos automaticamente (Meta Diária x 26).
                    </p>
                </Card>

                <div className="pt-4">
                    <Button fullWidth size="lg" onClick={handleSave} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>
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
                alert('Cadastrado com sucesso!!');
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
    const [newVehicle, setNewVehicle] = useState<{ name: string, model: string, plate: string, type: 'combustion' | 'electric' | 'motorcycle' }>({ name: '', model: '', plate: '', type: 'combustion' });
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
            setNewVehicle({ name: '', model: '', plate: '', type: 'combustion' });
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

    // Maintenance Logic
    const [maintenanceVehicle, setMaintenanceVehicle] = useState<Vehicle | null>(null);
    const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
    const [newMaintenance, setNewMaintenance] = useState<{ type: string, cost: string, note: string, km: string, date: string }>({ type: 'manutencao', cost: '', note: '', km: '', date: new Date().toISOString().substring(0, 10) });
    const [isAddingMaint, setIsAddingMaint] = useState(false);
    const [maintLoading, setMaintLoading] = useState(false);

    const openMaintenance = async (v: Vehicle) => {
        setMaintenanceVehicle(v);
        const { data } = await supabase.from('maintenances').select('*').eq('vehicle_id', v.id).order('date', { ascending: false });
        setMaintenances(data || []);
        setIsAddingMaint(false);
    };

    const saveMaintenance = async () => {
        if (!maintenanceVehicle) return;
        if (!newMaintenance.cost) {
            alert('Por favor, informe o valor da manutenção.');
            return;
        }

        setMaintLoading(true);
        // Save to Supabase
        const { error } = await supabase.from('maintenances').insert({
            user_id: userId, // Added user_id back
            vehicle_id: maintenanceVehicle.id,
            type: newMaintenance.type,
            cost: parseFloat(newMaintenance.cost),
            note: newMaintenance.note,
            km_at_maintenance: newMaintenance.km ? parseInt(newMaintenance.km) : null,
            date: newMaintenance.date
        });

        if (error) {
            alert('Erro ao salvar: ' + error.message);
        } else {
            // Refresh list
            openMaintenance(maintenanceVehicle);
            // Reset form
            setNewMaintenance({ type: 'manutencao', cost: '', note: '', km: '', date: new Date().toISOString().substring(0, 10) });
            setIsAddingMaint(false);
        }
        setMaintLoading(false);
    };

    const deleteMaintenance = async (id: string) => {
        // if (!confirm('Excluir esta manutenção?')) return; // Immediate delete
        const { error } = await supabase.from('maintenances').delete().eq('id', id);
        if (error) {
            alert('Erro ao excluir: ' + error.message);
        } else {
            if (maintenanceVehicle) openMaintenance(maintenanceVehicle);
        }
    };

    return (
        <div className="p-6 space-y-6 pb-32">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Garagem</h2>
                <Button size="sm" variant="ghost" onClick={() => setIsAdding(!isAdding)}>{isAdding ? 'Cancelar' : <Plus />}</Button>
            </div>

            {isAdding && (
                <Card>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            <button onClick={() => setNewVehicle({ ...newVehicle, type: 'combustion' })} className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-bold ${newVehicle.type === 'combustion' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-100 text-slate-400'}`}>
                                <Fuel size={16} /> Combustão
                            </button>
                            <button onClick={() => setNewVehicle({ ...newVehicle, type: 'electric' })} className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-bold ${newVehicle.type === 'electric' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-100 text-slate-400'}`}>
                                <Zap size={16} /> Elétrico
                            </button>
                            <button onClick={() => setNewVehicle({ ...newVehicle, type: 'motorcycle' })} className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-bold ${newVehicle.type === 'motorcycle' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'border-slate-100 text-slate-400'}`}>
                                <Bike size={16} /> Moto
                            </button>
                        </div>

                        <Input label="Apelido" value={newVehicle.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVehicle({ ...newVehicle, name: e.target.value })} autoFocus placeholder="Ex: Onix Prata" />
                        <Input label="Modelo" value={newVehicle.model} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVehicle({ ...newVehicle, model: e.target.value })} placeholder="Ex: Onix LTZ" />
                        <Input label="Placa" value={newVehicle.plate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVehicle({ ...newVehicle, plate: e.target.value })} placeholder="ABC-1234" />
                        <Button fullWidth onClick={handleSubmit}>Salvar</Button>
                    </div>
                </Card>
            )}

            <div className="space-y-4">
                {vehicles.map(v => (
                    <div key={v.id} className="relative">
                        {/* Vehicle Card */}
                        <div
                            onClick={() => setActiveVehicleId(v.id)}
                            className={`p-5 rounded-3xl border transition-all cursor-pointer relative z-10 overflow-hidden ${activeVehicleId === v.id ? 'bg-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-100 hover:scale-[1.01]'}`}
                        >
                            <div className="flex justify-between items-center relative z-10">
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        {v.type === 'electric' && <Zap size={16} className="text-emerald-500" />}
                                        {v.type === 'motorcycle' && <Bike size={16} className="text-amber-500" />}
                                        {(!v.type || v.type === 'combustion') && <Fuel size={16} className="text-slate-400" />}
                                        {v.name}
                                    </h3>
                                    <p className={`text-sm ${activeVehicleId === v.id ? 'text-indigo-200' : 'text-slate-400'}`}>{v.model || 'Sem modelo'} • {v.plate}</p>
                                </div>
                                {activeVehicleId === v.id ?
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                maintenanceVehicle?.id === v.id ? setMaintenanceVehicle(null) : openMaintenance(v);
                                            }}
                                            className={`p-2 rounded-full text-white transition-colors border ${maintenanceVehicle?.id === v.id ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm' : 'bg-indigo-500 hover:bg-indigo-400 border-transparent'}`}
                                        >
                                            <Wrench size={18} />
                                        </button>
                                        <div className="p-2 bg-indigo-500 rounded-full text-white"><CheckCircle2 size={18} /></div>
                                    </div>
                                    : <Trash2 className="text-slate-300 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(v.id) }} />
                                }
                            </div>
                        </div>

                        {/* INLINE MAINTENANCE SECTION */}
                        {maintenanceVehicle?.id === v.id && (
                            <div className="w-full bg-slate-50/80 backdrop-blur-sm rounded-b-3xl -mt-6 pt-10 pb-6 px-4 border-x border-b border-indigo-500/10 shadow-inner mb-4 animate-in slide-in-from-top-4 fade-in duration-300 relative z-0 origin-top">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Wrench size={14} /> Manutenções
                                    </h3>
                                    <button onClick={() => setMaintenanceVehicle(null)} className="p-1.5 bg-white rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm">
                                        <X size={14} />
                                    </button>
                                </div>

                                {isAddingMaint ? (
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                                        <h3 className="font-bold text-indigo-600 mb-3 text-sm">Nova Manutenção</h3>
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <button onClick={() => setNewMaintenance({ ...newMaintenance, type: 'oleo' })} className={`p-2 rounded-xl border font-bold text-xs ${newMaintenance.type === 'oleo' ? 'bg-indigo-600 text-white' : 'text-slate-500 border-slate-100'}`}>Troca de Óleo</button>
                                            <button onClick={() => setNewMaintenance({ ...newMaintenance, type: 'revisao' })} className={`p-2 rounded-xl border font-bold text-xs ${newMaintenance.type === 'revisao' ? 'bg-indigo-600 text-white' : 'text-slate-500 border-slate-100'}`}>Revisão</button>
                                            <button onClick={() => setNewMaintenance({ ...newMaintenance, type: 'pneu' })} className={`p-2 rounded-xl border font-bold text-xs ${newMaintenance.type === 'pneu' ? 'bg-indigo-600 text-white' : 'text-slate-500 border-slate-100'}`}>Pneus</button>
                                            <button onClick={() => setNewMaintenance({ ...newMaintenance, type: 'outros' })} className={`p-2 rounded-xl border font-bold text-xs ${newMaintenance.type === 'outros' ? 'bg-indigo-600 text-white' : 'text-slate-500 border-slate-100'}`}>Outros</button>
                                        </div>
                                        <div className="space-y-3">
                                            <Input label="Valor R$" type="number" value={newMaintenance.cost} onChange={(e: any) => setNewMaintenance({ ...newMaintenance, cost: e.target.value })} />
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input label="KM" type="number" value={newMaintenance.km} onChange={(e: any) => setNewMaintenance({ ...newMaintenance, km: e.target.value })} />
                                                <Input label="Data" type="date" value={newMaintenance.date} onChange={(e: any) => setNewMaintenance({ ...newMaintenance, date: e.target.value })} />
                                            </div>
                                            <Input label="Obs" value={newMaintenance.note} onChange={(e: any) => setNewMaintenance({ ...newMaintenance, note: e.target.value })} />
                                        </div>

                                        <div className="flex gap-2 mt-4">
                                            <Button variant="ghost" size="sm" fullWidth onClick={() => setIsAddingMaint(false)}>Cancelar</Button>
                                            <Button size="sm" fullWidth onClick={saveMaintenance} disabled={maintLoading}>
                                                {maintLoading ? 'Salvando...' : 'Salvar'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                            {maintenances.length === 0 ? (
                                                <div className="text-center py-6 text-slate-400 bg-white rounded-xl border border-slate-100 border-dashed text-sm">
                                                    Nenhuma manutenção registrada.
                                                </div>
                                            ) : (
                                                maintenances.map(m => (
                                                    <div key={m.id} className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm flex justify-between items-center group">
                                                        <div className="flex gap-3 items-center">
                                                            <div className={`p-2 rounded-lg ${m.type === 'oleo' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                                <Wrench size={14} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-700 text-sm capitalize">{m.type === 'oleo' ? 'Troca de Óleo' : m.type}</h4>
                                                                <p className="text-[10px] text-slate-400">{new Date(m.date).toLocaleDateString('pt-BR')} {m.km_at_maintenance ? `• ${m.km_at_maintenance} km` : ''}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex items-center gap-3">
                                                            <div>
                                                                <span className="font-bold text-slate-900 text-sm block">{formatCurrency(m.cost)}</span>
                                                                <span className="text-[10px] text-slate-400">{m.note || '-'}</span>
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); deleteMaintenance(m.id); }}
                                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <Button variant="outline" size="sm" fullWidth onClick={() => setIsAddingMaint(true)} className="bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                            <Plus size={16} className="mr-1" /> Nova Manutenção
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- HISTORY DETAIL MODAL (NEW) ---
const HistoryDetailModal = ({ day, vehicles, onClose, onUpdate }: { day: any, vehicles: Record<string, string>, onClose: () => void, onUpdate?: () => void }) => {
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
                                    <div key={e.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                        <div className="flex-1">
                                            <span className="font-medium text-slate-600">{e.platform}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-emerald-600">{formatCurrency(e.amount)}</span>
                                            <button
                                                onClick={async (ev) => {
                                                    ev.stopPropagation();
                                                    // if (!confirm('Excluir este ganho?')) return; // Removed request
                                                    await supabase.from('earnings').delete().eq('id', e.id);
                                                    if (onUpdate) onUpdate();
                                                    else onClose();
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
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
                                    <div key={e.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                        <div className="flex flex-col flex-1">
                                            <span className="font-medium text-slate-600 capitalize">{e.category}</span>
                                            {e.note && <span className="text-[10px] text-slate-400">{e.note}</span>}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-red-500">{formatCurrency(e.amount)}</span>
                                            <button
                                                onClick={async (ev) => {
                                                    ev.stopPropagation();
                                                    // if (!confirm('Excluir esta despesa?')) return; // Removed request
                                                    await supabase.from('expenses').delete().eq('id', e.id);
                                                    if (onUpdate) onUpdate();
                                                    else onClose();
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
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
const HistoryView = ({ userId, user }: { userId: string, user: User }) => {
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
                const mIncome = days.reduce((a, b) => a + b.income, 0);
                const costPerKm = mKm > 0 ? mCost / mKm : 0;

                const dailyGoal = user.user_metadata?.daily_goal || 300;
                // Use stored monthly goal OR calculate default
                const monthlyGoal = user.user_metadata?.monthly_goal || (dailyGoal * 26);
                const progress = Math.min((mIncome / monthlyGoal) * 100, 100);

                const getMotivation = (p: number) => {
                    if (p >= 100) return "🚀 MÊS ESPETACULAR! Meta batida!";
                    if (p >= 90) return "🔥 Falta muito pouco! Acelera!";
                    if (p >= 75) return "💪 Excelente ritmo! Continue assim.";
                    if (p >= 50) return "👍 Metade já foi! Mantenha o foco.";
                    if (p >= 25) return "🙂 Bom começo. Vamos buscar mais!";
                    return "🌱 Todo começo é importante. Persista!";
                };

                return (
                    <div key={month} className="space-y-3">
                        <div className="flex items-end justify-between px-2">
                            <h3 className="font-bold text-slate-700 capitalize">{month}</h3>
                            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">R$ {costPerKm.toFixed(2)} / km</span>
                        </div>

                        <div className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-lg relative overflow-hidden">
                            {/* Progress Background */}
                            <div className="absolute bottom-0 left-0 h-1.5 bg-slate-800 w-full">
                                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                            </div>

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Faturamento (Bruto)</span>
                                    <div className="text-3xl font-bold text-white mt-1">{formatCurrency(mIncome)}</div>
                                    <div className="text-[10px] text-slate-400 mt-1">Meta: {formatCurrency(monthlyGoal)} ({Math.round(progress)}%)</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-400 font-bold uppercase">Lucro Líquido</span>
                                    <div className={`text-lg font-bold ${mProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(mProfit)}</div>
                                </div>
                            </div>

                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/5 flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-full text-emerald-400">
                                    {progress >= 100 ? <Trophy size={16} /> : <Target size={16} />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">{getMotivation(progress)}</p>
                                </div>
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
    // Daily Goal
    const [dailyGoal, setDailyGoal] = useState<number>(user.user_metadata?.daily_goal || 300);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    useEffect(() => {
        // Priority: Metadata > LocalStorage > Default
        if (user.user_metadata?.daily_goal) {
            setDailyGoal(user.user_metadata.daily_goal);
        } else {
            const saved = localStorage.getItem('drivermind_daily_goal');
            if (saved) setDailyGoal(parseFloat(saved));
        }
    }, [user]);

    const saveGoal = async (val: number) => {
        setDailyGoal(val);
        localStorage.setItem('drivermind_daily_goal', val.toString());
        // Also persist to account
        await supabase.auth.updateUser({ data: { daily_goal: val } });
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

    const handleReopenDay = async () => {
        if (!session) return;

        const { error } = await supabase
            .from('work_days')
            .update({ status: 'open', km_end: null })
            .eq('id', session.id);

        if (error) {
            alert('Erro ao reabrir dia: ' + error.message);
        } else {
            fetchData();
        }
    };


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
                {session.status === 'closed' ? (
                    <button onClick={handleReopenDay} className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors border border-emerald-100">
                        Reabrir Dia
                    </button>
                ) : (
                    <button onClick={onFinishDay} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-100">
                        Encerrar Dia
                    </button>
                )}
            </div>

            {/* GOAL CARD (NEW) */}


            <div onClick={() => setShowReportModal(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-5 text-white shadow-xl shadow-indigo-200 relative overflow-hidden cursor-pointer active:scale-95 transition-transform">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg">
                            <Target size={16} className="text-white" />
                        </div>
                        <span className="text-xs font-bold text-indigo-100 uppercase tracking-wide">Meta Diária</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setIsEditingGoal(true); }} className="p-1 hover:bg-white/10 rounded transition-colors"><Edit2 size={14} className="text-indigo-200" /></button>
                </div>

                {isEditingGoal ? (
                    <div className="flex gap-2 items-center mt-2 relative z-10" onClick={e => e.stopPropagation()}>
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
                            {/* Showing Gross Profit (Total Earnings) as requested */}
                            <span className="text-3xl font-bold">{formatCurrency(totalEarnings)}</span>
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
                        <p className="text-[10px] text-indigo-300 mt-2 text-center opacity-70">Toque para ver detalhes</p>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-2 gap-4">
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

            {
                session.status === 'open' ? (
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
                )
            }
            {
                showReportModal && (
                    <HistoryDetailModal
                        day={{
                            date: session.date,
                            profit: profit,
                            income: totalEarnings,
                            expense: totalExpenses,
                            earnings: earnings,
                            expenses: expenses,
                            km_start: session.km_start,
                            km_end: session.km_end ?? 0,
                            vehicle_id: vehicle.id
                        }}
                        vehicles={{ [vehicle.id]: vehicle.name }}
                        onClose={() => setShowReportModal(false)}
                        onUpdate={() => { setShowReportModal(false); fetchData(); }}
                    />
                )
            }
        </div >
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
                            ? `border-${config.color}-500 bg-${config.color}-500 text-white shadow-lg transform scale-[1.02]`
                            : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        <div className={`p-2 rounded-full ${category.name === opt.name ? `bg-white text-${config.color}-500` : 'bg-slate-100 text-slate-500'}`}>{opt.icon}</div>
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
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null); // PWA Install Prompt
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showInstallHelp, setShowInstallHelp] = useState(false);

    // Handle PWA Event & Platform Detection
    useEffect(() => {
        // Check for iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Check for Standalone (Installed) Mode
        const checkStandalone = () => {
            const isStand = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
            setIsStandalone(isStand);
        };
        checkStandalone();
        window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStandalone);
        };
    }, []);

    const installApp = async () => {
        // If we have the native prompt, use it
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
            return;
        }
        // Fallback: Show instructions (iOS or Android without prompt)
        setShowInstallHelp(true);
    };

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
        if (activeTab === 'history') return <HistoryView userId={user.id} user={user} />;
        if (activeTab === 'vehicles') return <VehiclesView userId={user.id} activeVehicleId={activeVehicleId} setActiveVehicleId={setActiveVehicleId} />;
        if (activeTab === 'profile') return (
            <div className="p-6 pb-24 animate-in slide-in-from-right-10 duration-500">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Meu Perfil</h2>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center mb-6">
                    <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-xl shadow-indigo-200 relative">
                        {user.email?.[0].toUpperCase()}
                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{user.email?.split('@')[0]}</h3>
                    <p className="text-slate-400 text-sm mb-2">{user.email}</p>
                    <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-500">
                        Membro desde {new Date(user.created_at || Date.now()).getFullYear()}
                    </div>
                </div>

                <div className="space-y-3">
                    {!isStandalone && (
                        <button onClick={installApp} className="w-full bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-slate-200 active:scale-95 transition-transform mb-4 animate-in slide-in-from-top-4 fade-in duration-300">
                            <Download size={20} /> Instalar Aplicativo
                        </button>
                    )}

                    {showInstallHelp && (
                        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowInstallHelp(false)}>
                            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-slate-900">{isIOS ? 'Instalar no iPhone' : 'Instalar Aplicativo'}</h3>
                                    <button onClick={() => setShowInstallHelp(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20} /></button>
                                </div>
                                <ol className="space-y-4 text-slate-600 text-sm mb-6">
                                    <li className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">1</span>
                                        <span>Toque no botão <strong>{isIOS ? 'Compartilhar' : 'Menu'}</strong> <Share size={14} className="inline mx-1" /> no seu navegador.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">2</span>
                                        <span>Selecione a opção <strong>Adicionar à Tela de Início</strong> (ou Instalar Aplicativo).</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">3</span>
                                        <span>Confirme clicando em <strong>Adicionar</strong>.</span>
                                    </li>
                                </ol>
                                <Button fullWidth onClick={() => setShowInstallHelp(false)}>Entendi</Button>
                            </div>
                        </div>
                    )}

                    <button onClick={() => setActiveTab('settings')} className="w-full bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-slate-700 font-bold hover:bg-slate-50 transition-colors active:scale-95">
                        <div className="flex items-center gap-3"><Settings size={20} className="text-indigo-500" /> Configurações</div>
                        <ChevronRight size={16} className="text-slate-300" />
                    </button>
                    <button onClick={() => {
                        if (navigator.share) {
                            navigator.share({ title: 'Driver Mind', text: 'Controle seus ganhos com inteligência!', url: window.location.href });
                        } else {
                            alert('Link copiado!');
                            navigator.clipboard.writeText(window.location.href);
                        }
                    }} className="w-full bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-slate-700 font-bold hover:bg-slate-50 transition-colors active:scale-95">
                        <div className="flex items-center gap-3"><Share2 size={20} className="text-indigo-500" /> Compartilhar App</div>
                        <ChevronRight size={16} className="text-slate-300" />
                    </button>
                    <button onClick={() => window.open('mailto:suporte@drivermind.com')} className="w-full bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-slate-700 font-bold hover:bg-slate-50 transition-colors active:scale-95">
                        <div className="flex items-center gap-3"><AlertCircle size={20} className="text-indigo-500" /> Suporte (Email)</div>
                        <ChevronRight size={16} className="text-slate-300" />
                    </button>
                    <button onClick={() => window.open('https://wa.me/5548992253003?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20DriverMind', '_blank')} className="w-full bg-[#25D366] p-4 rounded-2xl border border-green-500 flex items-center justify-between text-white font-bold hover:bg-[#20bd5a] transition-colors active:scale-95 shadow-lg shadow-green-100">
                        <div className="flex items-center gap-3"><Share2 size={20} className="text-white" /> Falar no WhatsApp</div>
                        <ChevronRight size={16} className="text-green-100" />
                    </button>
                </div>

                <div className="mt-8">
                    <Button variant="danger" onClick={() => supabase.auth.signOut()} fullWidth className="shadow-lg shadow-red-100">
                        <LogOut size={18} className="mr-2" /> Sair da Conta
                    </Button>
                </div>

                <p className="text-center text-xs text-slate-300 mt-8">DriverMind v0.1.2 • De um motorista, para outros motoristas.</p>
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
        if (activeTab === 'settings') {
            return <SettingsView user={user} onBack={() => setActiveTab('profile')} />
        }
        return renderContent();
    };

    const showNav = !['add-expense', 'add-earning', 'finish-day', 'settings'].includes(activeTab);

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
