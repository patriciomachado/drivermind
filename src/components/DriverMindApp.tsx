"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useAuth, useClerk, SignIn, SignUp, UserButton } from "@clerk/nextjs";
import type { UserResource } from "@clerk/types";
import { useSupabase } from "@/lib/useSupabase";

import {
    Car, Fuel, Wallet, MapPin, Plus, Trash2, LogOut, ChevronRight,
    AlertCircle, CheckCircle2, LayoutDashboard, Utensils, History,
    TrendingUp, ArrowRight, Lock, Mail, LogIn, Download, BarChart3,
    User as UserIcon, Share2, RefreshCw, Wrench, Trophy, Target,
    Zap, Bike, X, TrendingDown, Edit2, Settings, MonitorSmartphone, PlusCircle, AlertTriangle, Info
} from 'lucide-react';
import SecurityWrapper from './SecurityWrapper';
import AlertModal from './ui/AlertModal';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

type FixedCost = {
    id: string;
    user_id: string;
    vehicle_id: string;
    type: string;
    cost: number;
    date: string;
    note: string;
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
    <div className="w-full min-w-0">
        {label && <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1 truncate">{label}</label>}
        <div className="relative min-w-0">
            <input
                {...props}
                className={`w-full min-w-0 px-4 py-4 rounded-2xl bg-slate-50 border-2 ${error ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-indigo-500 focus:bg-white'} focus:outline-none transition-all text-lg font-medium text-slate-800 placeholder:text-slate-300 ${icon ? 'pl-11' : ''}`}
            />
            {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
        </div>
        {error && <span className="text-xs text-red-500 mt-2 block ml-1 font-medium truncate">{error}</span>}
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
        <div className="min-h-screen bg-[#0a0a0b] text-white font-sans antialiased overflow-x-hidden flex flex-col">
            {/* Header */}
            <header className="absolute top-0 left-0 w-full z-50 py-6 px-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/logo.png" 
                            className="w-12 h-12 object-contain" 
                            alt="Drivermind Logo" 
                        />
                        <span className="text-2xl font-bold tracking-tight text-white">Drivermind</span>
                    </div>
                    <button 
                        onClick={onLogin}
                        className="hidden sm:inline-block px-5 py-2 border border-[#0df2f2]/50 text-[#0df2f2] text-sm font-bold rounded-lg hover:bg-[#0df2f2] hover:text-[#0a0a0b] transition-all"
                    >
                        Entrar
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-16 px-6 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0df2f2] blur-[120px] rounded-full"></div>
                </div>
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-[#0df2f2]/30 bg-[#0df2f2]/5 text-[#0df2f2] text-sm font-semibold tracking-wide">
                        🚀 EXPERIMENTE 15 DIAS GRÁTIS
                    </div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                        Controle total em <span className="bg-gradient-to-br from-white to-[#0df2f2] bg-clip-text text-transparent">2 minutos.</span><br/>
                        Lucro real no seu bolso.
                    </h1>
                    <p className="text-[#8e8e93] text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                        Transforme sua rotina como motorista. Pare de perder dinheiro com planilhas confusas e tenha a gestão completa do seu negócio na palma da mão.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={onSignup}
                            className="w-full sm:w-auto px-8 py-4 bg-[#0df2f2] text-[#0a0a0b] font-bold rounded-xl text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(13,242,242,0.2)]"
                        >
                            Começar 15 Dias Grátis
                        </button>
                        <p className="text-sm text-[#8e8e93] sm:ml-4">
                            Sem cartão de crédito necessário
                        </p>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-[#121214]/50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Como Funciona?</h2>
                        <p className="text-[#8e8e93]">Gestão profissional em apenas 3 passos simples</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl relative overflow-hidden group">
                            <div className="w-12 h-12 bg-[#0df2f2]/10 rounded-full flex items-center justify-center mb-6 text-[#0df2f2] font-bold text-xl group-hover:bg-[#0df2f2] group-hover:text-[#0a0a0b] transition-colors">1</div>
                            <h3 className="text-xl font-bold mb-3">Inicie seu turno</h3>
                            <p className="text-[#8e8e93] leading-relaxed">Abra o app e registre seu KM inicial. Pronto, você já está pronto para faturar com inteligência.</p>
                        </div>
                        {/* Step 2 */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl relative overflow-hidden group">
                            <div className="w-12 h-12 bg-[#0df2f2]/10 rounded-full flex items-center justify-center mb-6 text-[#0df2f2] font-bold text-xl group-hover:bg-[#0df2f2] group-hover:text-[#0a0a0b] transition-colors">2</div>
                            <h3 className="text-xl font-bold mb-3">Lançamentos em Segundos</h3>
                            <p className="text-[#8e8e93] leading-relaxed">Ao final de cada corrida ou gasto, basta um clique. O cálculo é automático e preciso.</p>
                        </div>
                        {/* Step 3 */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl relative overflow-hidden group">
                            <div className="w-12 h-12 bg-[#0df2f2]/10 rounded-full flex items-center justify-center mb-6 text-[#0df2f2] font-bold text-xl group-hover:bg-[#0df2f2] group-hover:text-[#0a0a0b] transition-colors">3</div>
                            <h3 className="text-xl font-bold mb-3">Lucro no Bolso</h3>
                            <p className="text-[#8e8e93] leading-relaxed">Receba insights valiosos e relatórios que mostram exatamente quanto você está ganhando de verdade.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* App Showcase 1 */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1">
                        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-[#0df2f2]/10 text-[#0df2f2] text-xs font-bold uppercase tracking-wider">
                            Inteligência Financeira
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight">
                            Dashboard Inteligente para <span className="text-[#0df2f2]">Decisões Rápidas.</span>
                        </h2>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-[#0df2f2]/20 flex items-center justify-center text-[#0df2f2]">
                                    <CheckCircle2 size={16} />
                                </div>
                                <p className="text-[#8e8e93] leading-relaxed">Visão clara do seu faturamento bruto vs. lucro líquido em tempo real.</p>
                            </li>
                            <li className="flex gap-4">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-[#0df2f2]/20 flex items-center justify-center text-[#0df2f2]">
                                    <CheckCircle2 size={16} />
                                </div>
                                <p className="text-[#8e8e93] leading-relaxed">Metas de ganho personalizadas para te manter focado no que importa.</p>
                            </li>
                        </ul>
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="relative max-w-[320px] rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden">
                            <img 
                                src="/img/dashboard.png" 
                                className="w-full" 
                                alt="Dashboard Drivermind" 
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* App Showcase 2 */}
            <section className="py-24 px-6 bg-[#121214]/30">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-16">
                    <div className="flex-1">
                        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-[#0df2f2]/10 text-[#0df2f2] text-xs font-bold uppercase tracking-wider">
                            Gestão de Gastos
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight">
                            Onde seu <span className="text-[#0df2f2]">Dinheiro Está Indo?</span>
                        </h2>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-[#0df2f2]/20 flex items-center justify-center text-[#0df2f2]">
                                    <CheckCircle2 size={16} />
                                </div>
                                <p className="text-[#8e8e93] leading-relaxed">Histórico completo de abastecimentos, manutenção e alimentação.</p>
                            </li>
                            <li className="flex gap-4">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-[#0df2f2]/20 flex items-center justify-center text-[#0df2f2]">
                                    <CheckCircle2 size={16} />
                                </div>
                                <p className="text-[#8e8e93] leading-relaxed">Identifique os dias mais lucrativos e as plataformas que rendem mais.</p>
                            </li>
                        </ul>
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="relative max-w-[320px] rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden">
                            <img 
                                src="/img/historico.png" 
                                className="w-full" 
                                alt="Histórico Financeiro Drivermind" 
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* App Showcase 3 */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1">
                        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-[#0df2f2]/10 text-[#0df2f2] text-xs font-bold uppercase tracking-wider">
                            Veículo & Manutenção
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight">
                            Sua <span className="text-[#0df2f2]">Garagem Digital.</span>
                        </h2>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-[#0df2f2]/20 flex items-center justify-center text-[#0df2f2]">
                                    <CheckCircle2 size={16} />
                                </div>
                                <p className="text-[#8e8e93] leading-relaxed">Acompanhe a depreciação real do seu carro e custo por quilômetro.</p>
                            </li>
                            <li className="flex gap-4">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-[#0df2f2]/20 flex items-center justify-center text-[#0df2f2]">
                                    <CheckCircle2 size={16} />
                                </div>
                                <p className="text-[#8e8e93] leading-relaxed">Alertas de revisões preventivas para evitar quebras e gastos surpresa.</p>
                            </li>
                        </ul>
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="relative max-w-[320px] rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden">
                            <img 
                                src="/img/garagem.jpg" 
                                className="w-full" 
                                alt="Gestão de Garagem Drivermind" 
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-24 px-6 bg-gradient-to-b from-[#0a0a0b] to-[#121214]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-12">O único plano que você precisa.</h2>
                    <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-12 rounded-[2.5rem] max-w-md mx-auto overflow-hidden">
                        {/* Glow Effect Behind Card */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0df2f2]/20 blur-[60px] rounded-full"></div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-2">Plano Pro</h3>
                            <div className="flex items-baseline justify-center gap-1 mb-8">
                                <span className="text-[#0df2f2] text-2xl font-bold">R$</span>
                                <span className="text-6xl font-extrabold">8,90</span>
                                <span className="text-[#8e8e93]">/mês</span>
                            </div>
                            <ul className="text-left space-y-5 mb-10">
                                <li className="flex items-center gap-3">
                                    <div className="bg-[#0df2f2]/10 p-1 rounded-full text-[#0df2f2]"><CheckCircle2 size={16} /></div>
                                    <span>Relatórios Financeiros Ilimitados</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="bg-[#0df2f2]/10 p-1 rounded-full text-[#0df2f2]"><CheckCircle2 size={16} /></div>
                                    <span>Cálculo Real de Depreciação</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="bg-[#0df2f2]/10 p-1 rounded-full text-[#0df2f2]"><CheckCircle2 size={16} /></div>
                                    <span>Gestão de Custos de Garagem</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="bg-[#0df2f2]/10 p-1 rounded-full text-[#0df2f2]"><CheckCircle2 size={16} /></div>
                                    <span>Suporte Prioritário via WhatsApp</span>
                                </li>
                            </ul>
                            <button 
                                onClick={onSignup}
                                className="block w-full py-4 bg-[#0df2f2] text-[#0a0a0b] font-bold rounded-xl text-lg hover:bg-white transition-colors"
                            >
                                Começar 15 Dias Grátis
                            </button>
                            <p className="mt-4 text-xs text-[#8e8e93] uppercase tracking-widest font-semibold">Cancele quando quiser</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/logo.png" 
                            className="w-10 h-10 object-contain" 
                            alt="Drivermind Logo" 
                        />
                        <span className="text-xl font-bold tracking-tight">Drivermind</span>
                    </div>
                    <div className="text-[#8e8e93] text-sm">
                        © 2024 Drivermind Brasil. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};

// --- SALES VIEW (TRIAL EXPIRED) ---
const SalesView = ({ userId, onLogout }: { userId: string, onLogout: () => void }) => {
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        setLoading(true);
        // Link da Cakto que o usuário deve configurar
        // Adicionamos o user_id como external_id ou parâmetro de rastreio para o webhook identificar o usuário
        const caktoBaseUrl = 'https://pay.cakto.com.br/bahy67i_804749';
        // Enviamos em múltiplos formatos comuns para garantir que a Cakto capture em algum campo (refId, external_id, etc)
        // Adicionamos também tentativas de parâmetros de redirecionamento (redirect_url, back_url)
        const checkoutUrl = `${caktoBaseUrl}?external_id=${userId}&refId=${userId}&origin=${userId}&src=${userId}&redirect_url=https://drivermind.com.br&back_url=https://drivermind.com.br&return_url=https://drivermind.com.br`;
        
        window.location.href = checkoutUrl;
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white relative overflow-hidden flex flex-col items-center justify-center p-6 text-center font-sans">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#0df2f2]/10 to-transparent pointer-events-none"></div>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0df2f2]/5 rounded-full blur-[100px] animate-pulse"></div>

            <div className="relative z-10 w-full max-w-sm">
                <div className="w-20 h-20 bg-[#0df2f2]/10 rounded-full flex items-center justify-center mb-6 mx-auto animate-bounce shadow-[0_0_30px_rgba(13,242,242,0.2)]">
                    <Lock size={40} className="text-[#0df2f2]" />
                </div>

                <h1 className="text-3xl font-bold mb-2">Seu teste acabou!</h1>
                <p className="text-[#8e8e93] mb-8 max-w-xs mx-auto leading-relaxed">
                    Espero que tenha gostado! Para continuar controlando seu <strong className="text-[#0df2f2]">lucro real</strong>, escolha o plano Pro.
                </p>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden mb-8 group">
                    {/* Glow Effect */}
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#0df2f2]/20 blur-[40px] rounded-full group-hover:bg-[#0df2f2]/30 transition-colors"></div>
                    
                    <div className="relative z-10">
                        <div className="inline-block px-3 py-1 bg-[#0df2f2]/10 border border-[#0df2f2]/20 rounded-lg text-[#0df2f2] text-[10px] font-bold tracking-widest uppercase mb-6">
                            PLANO PRO
                        </div>

                        <div className="flex items-baseline justify-center gap-1 mb-6">
                            <span className="text-[#0df2f2] text-2xl font-bold">R$</span>
                            <span className="text-6xl font-extrabold">8,90</span>
                            <span className="text-[#8e8e93]">/mês</span>
                        </div>
                        
                        <div className="space-y-4 text-left mb-8">
                            <div className="flex items-center gap-3 text-sm text-[#8e8e93]">
                                <div className="bg-[#0df2f2]/10 p-1 rounded-full text-[#0df2f2]"><CheckCircle2 size={14} /></div>
                                <span>Controle ilimitado de ganhos</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-[#8e8e93]">
                                <div className="bg-[#0df2f2]/10 p-1 rounded-full text-[#0df2f2]"><CheckCircle2 size={14} /></div>
                                <span>Relatórios Financeiros em PDF</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-[#8e8e93]">
                                <div className="bg-[#0df2f2]/10 p-1 rounded-full text-[#0df2f2]"><CheckCircle2 size={14} /></div>
                                <span>Gestão Completa de Garagem</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-[#8e8e93]">
                                <div className="bg-[#0df2f2]/10 p-1 rounded-full text-[#0df2f2]"><CheckCircle2 size={14} /></div>
                                <span>Suporte Prioritário VIP</span>
                            </div>
                        </div>

                        <button
                            className="w-full bg-[#0df2f2] text-[#0a0a0b] font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(13,242,242,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                            onClick={handleSubscribe}
                            disabled={loading}
                        >
                            {loading ? 'Redirecionando...' : '✨ ASSINAR AGORA'}
                        </button>
                    </div>
                </div>

                <button 
                    onClick={onLogout} 
                    className="text-[#8e8e93] text-sm hover:text-white transition-colors flex items-center gap-2 mx-auto"
                >
                    <LogOut size={16} /> Sair da conta
                </button>
            </div>
        </div>
    );
};

// --- SETTINGS VIEW ---
const SettingsView = ({ user, onBack, showAlert, showConfirm }: { user: UserResource, onBack: () => void, showAlert: any, showConfirm: any }) => {
    const { signOut } = useClerk();
    const [name, setName] = useState(((user.unsafeMetadata?.full_name as string) as string) || '');
    const [dailyGoal, setDailyGoal] = useState(((user.unsafeMetadata?.daily_goal as number) as number)?.toString() || '300');
    const [monthlyGoal, setMonthlyGoal] = useState(((user.unsafeMetadata?.monthly_goal as number) as number)?.toString() || '');
    const [loading, setLoading] = useState(false);


    

    

    const handleSave = async () => {
        setLoading(true);
        const dGoal = parseFloat(dailyGoal);
        const mGoal = monthlyGoal ? parseFloat(monthlyGoal) : (dGoal * 26);

        try {
            await user?.update({
                unsafeMetadata: {
                    ...user?.unsafeMetadata,
                    full_name: name,
                    daily_goal: dGoal,
                    monthly_goal: mGoal
                }
            });
            setLoading(false);
            onBack();
        } catch (error: any) {
            setLoading(false);
            showAlert('Erro', 'Erro ao salvar: ' + (error.errors?.[0]?.message || error.message), 'error');
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

// AuthView completely replaced by Clerk Components

// --- VEHICLES ---
const VehiclesView = ({ userId, activeVehicleId, setActiveVehicleId, showAlert, showConfirm }: any) => {
    const supabase = useSupabase();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newVehicle, setNewVehicle] = useState<{ name: string, model: string, plate: string, type: 'combustion' | 'electric' | 'motorcycle' }>({ name: '', model: '', plate: '', type: 'combustion' });
    const [loading, setLoading] = useState(true);

    // Notification State
    

    

    

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/data/vehicles');
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setVehicles(data || []);
            
            // Auto-select first vehicle if none active
            if (data?.length > 0 && !activeVehicleId) {
                setActiveVehicleId(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            showAlert('Erro', 'Erro ao carregar veículos.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) fetchVehicles();
    }, [userId]);

    const handleSubmit = async () => {
        if (!newVehicle.name) {
            showAlert('Atenção', 'Por favor, preencha o apelido do veículo.', 'warning');
            return;
        }
        // Supabase direct insert removed to fix JWT issue

        setLoading(true);
        try {
            // Fix type for DB constraint
            const vehicleToSave = {
                ...newVehicle,
                type: (newVehicle.type as string) === 'car' ? 'combustion' : newVehicle.type,
                user_id: userId
            };

            const res = await fetch('/api/data/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vehicleToSave)
            });

            if (!res.ok) throw new Error(await res.text());
            
            setNewVehicle({ name: '', model: '', plate: '', type: 'combustion' });
            setIsAdding(false);
            fetchVehicles();
            showAlert('Sucesso', 'Veículo criado com sucesso!', 'success');
        } catch (error: any) {
            console.error('Error saving vehicle:', error);
            showAlert('Erro', `Erro ao criar veículo: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        showConfirm(
            'Excluir veículo?',
            'Esta ação não pode ser desfeita. Todos os dados associados a este veículo serão perdidos.',
            async () => {
                try {
                    const res = await fetch(`/api/data/vehicles?id=${id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error(await res.text());
                    fetchVehicles();
                    showAlert('Sucesso', 'Veículo excluído com sucesso!', 'success');
                } catch (error: any) {
                    showAlert('Erro', 'Erro ao excluir: ' + error.message, 'error');
                }
            },
            'Excluir'
        );
    };

    // Maintenance Logic
    const [maintenanceVehicle, setMaintenanceVehicle] = useState<Vehicle | null>(null);
    const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
    const [newMaintenance, setNewMaintenance] = useState<{ type: string, cost: string, note: string, km: string, date: string }>({ type: 'manutencao', cost: '', note: '', km: '', date: new Date().toISOString().substring(0, 10) });
    const [isAddingMaint, setIsAddingMaint] = useState(false);
    const [maintLoading, setMaintLoading] = useState(false);

    const openMaintenance = async (v: Vehicle) => {
        setMaintenanceVehicle(v);
        setFixedCostVehicle(null);
        try {
            const res = await fetch(`/api/data/maintenances?vehicle_id=${v.id}`);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setMaintenances(data || []);
        } catch (error) {
            console.error('Error fetching maintenances:', error);
            showAlert('Erro', 'Erro ao carregar manutenções.', 'error');
        } finally {
            setIsAddingMaint(false);
        }
    };

    const saveMaintenance = async () => {
        if (!maintenanceVehicle) return;
        if (!newMaintenance.cost) {
            showAlert('Atenção', 'Por favor, informe o valor da manutenção.', 'warning');
            return;
        }

        setMaintLoading(true);
        try {
            const payload = {
                user_id: userId,
                vehicle_id: maintenanceVehicle.id,
                type: newMaintenance.type,
                cost: parseFloat(newMaintenance.cost),
                note: newMaintenance.note,
                km_at_maintenance: newMaintenance.km ? parseInt(newMaintenance.km) : null,
                date: newMaintenance.date
            };
            const res = await fetch('/api/data/maintenances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(await res.text());
            
            openMaintenance(maintenanceVehicle); // Refresh list
            setNewMaintenance({ type: 'manutencao', cost: '', note: '', km: '', date: new Date().toISOString().substring(0, 10) }); // Reset form
            setIsAddingMaint(false);
            showAlert('Sucesso', 'Manutenção salva com sucesso!', 'success');
        } catch (error: any) {
            console.error('Error saving maintenance:', error);
            showAlert('Erro', 'Não foi possível salvar: ' + error.message, 'error');
        } finally {
            setMaintLoading(false);
        }
    };

    const deleteMaintenance = async (id: string) => {
        if (!maintenanceVehicle) return;
        showConfirm(
            'Excluir manutenção?',
            'Esta ação não pode ser desfeita.',
            async () => {
                try {
                    const res = await fetch(`/api/data/maintenances?id=${id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error(await res.text());
                    openMaintenance(maintenanceVehicle);
                    showAlert('Sucesso', 'Manutenção excluída com sucesso!', 'success');
                } catch (error: any) {
                    showAlert('Erro', 'Não foi possível excluir: ' + error.message, 'error');
                }
            },
            'Excluir'
        );
    };

    // Fixed Costs Logic
    const [fixedCostVehicle, setFixedCostVehicle] = useState<Vehicle | null>(null);
    const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
    const [newFixedCost, setNewFixedCost] = useState<{ type: string, cost: string, note: string, day: string }>({ type: 'aluguel', cost: '', note: '', day: '1' });
    const [isAddingFixedCost, setIsAddingFixedCost] = useState(false);
    const [fixedCostLoading, setFixedCostLoading] = useState(false);

    const openFixedCosts = async (v: Vehicle) => {
        setFixedCostVehicle(v);
        setMaintenanceVehicle(null);
        try {
            const res = await fetch(`/api/data/fixed_costs?vehicle_id=${v.id}`);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setFixedCosts(data || []);
        } catch (error) {
            console.error('Error fetching fixed costs:', error);
            showAlert('Erro', 'Erro ao carregar custos fixos.', 'error');
        } finally {
            setIsAddingFixedCost(false);
        }
    };

    const saveFixedCost = async () => {
        if (!fixedCostVehicle) return;
        if (!newFixedCost.cost) {
            showAlert('Atenção', 'Por favor, informe o valor.', 'warning');
            return;
        }

        const dayNum = parseInt(newFixedCost.day);
        if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
            showAlert('Atenção', 'O dia do vencimento deve ser entre 1 e 31.', 'warning');
            return;
        }

        const now = new Date();
        const dummyDate = new Date(now.getFullYear(), now.getMonth(), dayNum).toISOString().substring(0, 10);

        setFixedCostLoading(true);
        try {
            const payload = {
                user_id: userId,
                vehicle_id: fixedCostVehicle.id,
                type: newFixedCost.type,
                cost: parseFloat(newFixedCost.cost),
                note: newFixedCost.note,
                date: dummyDate
            };
            const res = await fetch('/api/data/fixed_costs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(await res.text());
            
            openFixedCosts(fixedCostVehicle);
            setNewFixedCost({ type: 'aluguel', cost: '', note: '', day: '1' });
            setIsAddingFixedCost(false);
            showAlert('Sucesso', 'Custo fixo salvo com sucesso!', 'success');
        } catch (error: any) {
            console.error('Error saving fixed cost:', error);
            showAlert('Erro', 'Não foi possível salvar: ' + error.message, 'error');
        } finally {
            setFixedCostLoading(false);
        }
    };

    const deleteFixedCost = async (id: string) => {
        if (!fixedCostVehicle) return;
        showConfirm(
            'Excluir custo fixo?',
            'Esta ação não pode ser desfeita.',
            async () => {
                try {
                    const res = await fetch(`/api/data/fixed_costs?id=${id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error(await res.text());
                    openFixedCosts(fixedCostVehicle);
                } catch (error: any) {
                    showAlert('Erro', 'Não foi possível excluir: ' + error.message, 'error');
                }
            },
            'Excluir'
        );
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
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fixedCostVehicle?.id === v.id ? setFixedCostVehicle(null) : openFixedCosts(v);
                                            }}
                                            className={`p-2 rounded-full text-white transition-colors border ${fixedCostVehicle?.id === v.id ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm' : 'bg-indigo-500 hover:bg-indigo-400 border-transparent'}`}
                                        >
                                            <Wallet size={18} />
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
                                            <Input label="Valor R$" type="number" step="any" inputMode="decimal" value={newMaintenance.cost} onChange={(e: any) => setNewMaintenance({ ...newMaintenance, cost: e.target.value.replace(',', '.') })} />
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

                        {/* INLINE FIXED COSTS SECTION */}
                        {fixedCostVehicle?.id === v.id && (
                            <div className="w-full bg-slate-50/80 backdrop-blur-sm rounded-b-3xl -mt-6 pt-10 pb-6 px-4 border-x border-b border-indigo-500/10 shadow-inner mb-4 animate-in slide-in-from-top-4 fade-in duration-300 relative z-0 origin-top">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Wallet size={14} /> Custos Fixos
                                    </h3>
                                    <button onClick={() => setFixedCostVehicle(null)} className="p-1.5 bg-white rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm">
                                        <X size={14} />
                                    </button>
                                </div>

                                {isAddingFixedCost ? (
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                                        <h3 className="font-bold text-indigo-600 mb-3 text-sm">Novo Custo Fixo</h3>
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <button onClick={() => setNewFixedCost({ ...newFixedCost, type: 'aluguel' })} className={`p-2 rounded-xl border font-bold text-xs ${newFixedCost.type === 'aluguel' ? 'bg-indigo-600 text-white' : 'text-slate-500 border-slate-100'}`}>Aluguel</button>
                                            <button onClick={() => setNewFixedCost({ ...newFixedCost, type: 'prestacao' })} className={`p-2 rounded-xl border font-bold text-xs ${newFixedCost.type === 'prestacao' ? 'bg-indigo-600 text-white' : 'text-slate-500 border-slate-100'}`}>Prestação</button>
                                            <button onClick={() => setNewFixedCost({ ...newFixedCost, type: 'seguro' })} className={`p-2 rounded-xl border font-bold text-xs ${newFixedCost.type === 'seguro' ? 'bg-indigo-600 text-white' : 'text-slate-500 border-slate-100'}`}>Seguro</button>
                                            <button onClick={() => setNewFixedCost({ ...newFixedCost, type: 'outros' })} className={`p-2 rounded-xl border font-bold text-xs ${newFixedCost.type === 'outros' ? 'bg-indigo-600 text-white' : 'text-slate-500 border-slate-100'}`}>Outros</button>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input label="Valor R$" type="number" step="any" inputMode="decimal" value={newFixedCost.cost} onChange={(e: any) => setNewFixedCost({ ...newFixedCost, cost: e.target.value.replace(',', '.') })} />
                                                <Input label="Dia Vencimento" type="number" min="1" max="31" value={newFixedCost.day} onChange={(e: any) => setNewFixedCost({ ...newFixedCost, day: e.target.value })} placeholder="Ex: 5" />
                                            </div>
                                            <Input label="Obs (Opcional)" value={newFixedCost.note} onChange={(e: any) => setNewFixedCost({ ...newFixedCost, note: e.target.value })} />
                                        </div>

                                        <div className="flex gap-2 mt-4">
                                            <Button variant="ghost" size="sm" fullWidth onClick={() => setIsAddingFixedCost(false)}>Cancelar</Button>
                                            <Button size="sm" fullWidth onClick={saveFixedCost} disabled={fixedCostLoading}>
                                                {fixedCostLoading ? 'Salvando...' : 'Salvar'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                            {fixedCosts.length === 0 ? (
                                                <div className="text-center py-6 text-slate-400 bg-white rounded-xl border border-slate-100 border-dashed text-sm">
                                                    Nenhum custo fixo registrado.
                                                </div>
                                            ) : (
                                                fixedCosts.map(fc => (
                                                    <div key={fc.id} className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm flex justify-between items-center group">
                                                        <div className="flex gap-3 items-center">
                                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                                <Wallet size={14} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-700 text-sm capitalize">{fc.type}</h4>
                                                                <p className="text-[10px] text-slate-400">Todo dia {new Date(fc.date).getUTCDate()} {fc.note ? `• ${fc.note}` : ''}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex items-center gap-3">
                                                            <div>
                                                                <span className="font-bold text-slate-900 text-sm block">{formatCurrency(fc.cost)}</span>
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); deleteFixedCost(fc.id); }}
                                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <Button variant="outline" size="sm" fullWidth onClick={() => setIsAddingFixedCost(true)} className="bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                            <Plus size={16} className="mr-1" /> Novo Custo Fixo
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
    const supabase = useSupabase();

    // Initialize local state once to prevent flickering while background fetches occur
    const [liveDay, setLiveDay] = useState<any>(day);


    if (!liveDay) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-900 p-6 text-white relative shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        <X size={20} />
                    </button>
                    <h3 className="text-lg font-bold">Detalhes do Dia</h3>
                    <p className="text-slate-400 text-sm">
                        {(() => {
                            try {
                                if (day.date) {
                                    const parts = day.date.split('-');
                                    if (parts.length === 3) {
                                        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
                                        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                                        return `${d.getDate()} de ${months[d.getMonth()]}`;
                                    }
                                }
                            } catch (e) {}
                            return '-- de --';
                        })()}
                    </p>
                    <div className="mt-4 flex gap-6">
                        <div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Lucro Líquido</div>
                            <div className={`text-xl font-bold ${liveDay.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatCurrency(liveDay.profit)}
                            </div>
                        </div>
                        <div className="border-l border-slate-700/50 pl-6 space-y-1">
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Km Rodados</div>
                                <div className="text-sm font-bold text-slate-200">{(liveDay.km_end - liveDay.km_start)} km</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold">Ganhos / Km</div>
                                <div className="text-sm font-bold text-emerald-400">
                                    R$ {liveDay.km_end - liveDay.km_start > 0 ? (liveDay.income / (liveDay.km_end - liveDay.km_start)).toFixed(2) : '0.00'} / km
                                </div>
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
                            {liveDay.earnings && liveDay.earnings.length > 0 ? (
                                liveDay.earnings.map((e: any) => (
                                    <div key={e.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                        <div className="flex-1">
                                            <span className="font-medium text-slate-600">{e.platform}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-emerald-600">{formatCurrency(e.amount)}</span>
                                            <button
                                                onClick={async (ev) => {
                                                    ev.stopPropagation();
                                                    const res = await fetch(`/api/data/earnings?id=${e.id}`, { method: 'DELETE' });
                                                    if (!res.ok) return;

                                                    // Update local state to avoid closing modal
                                                    setLiveDay((prev: any) => ({
                                                        ...prev,
                                                        earnings: prev.earnings.filter((item: any) => item.id !== e.id),
                                                        income: prev.income - e.amount,
                                                        profit: prev.profit - e.amount
                                                    }));

                                                    if (onUpdate) onUpdate();
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
                            {liveDay.expenses && liveDay.expenses.length > 0 ? (
                                liveDay.expenses.map((e: any) => (
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
                                                    const res = await fetch(`/api/data/expenses?id=${e.id}`, { method: 'DELETE' });
                                                    if (!res.ok) return;

                                                    // Update local state to avoid closing modal
                                                    setLiveDay((prev: any) => ({
                                                        ...prev,
                                                        expenses: prev.expenses.filter((item: any) => item.id !== e.id),
                                                        expense: prev.expense - e.amount,
                                                        profit: prev.profit + e.amount
                                                    }));

                                                    if (onUpdate) onUpdate();
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
const HistoryView = ({ userId, user, showAlert, showConfirm }: { userId: string, user: UserResource, showAlert: any, showConfirm: any }) => {
    const supabase = useSupabase();
    const [history, setHistory] = useState<any[]>([]);
    
    // Notification State
    

    

    
    const [vehicles, setVehicles] = useState<Record<string, string>>({});
    const [selectedDay, setSelectedDay] = useState<any>(null); // For Detail Modal
    const [loading, setLoading] = useState(true);
    const [showChart, setShowChart] = useState(false);
    const [allMaintenances, setAllMaintenances] = useState<any[]>([]);
    const [totalFixedCosts, setTotalFixedCosts] = useState(0);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const [vRes, daysRes, earnsRes, expsRes, fcRes, maintRes] = await Promise.all([
                fetch('/api/data/vehicles'),
                fetch('/api/data/work_days'),
                fetch('/api/data/earnings'),
                fetch('/api/data/expenses'),
                fetch('/api/data/fixed_costs'),
                fetch('/api/data/maintenances')
            ]);

            const vParams = await vRes.json();
            const days = await daysRes.json();
            const earns = await earnsRes.json();
            const exps = await expsRes.json();
            const fcData = await fcRes.json();
            const maintData = await maintRes.json();

            const vMap: Record<string, string> = {};
            vParams?.forEach((v: any) => { vMap[v.id] = v.name });
            setVehicles(vMap);

            if (!days) { setLoading(false); return; }

            const compiled = days.filter((d: any) => d.user_id === userId && d.status === 'closed').sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((d: any) => {
                const dayEarns = (earns || []).filter((e: any) => e.work_day_id === d.id);
                const dayExps = (exps || []).filter((e: any) => e.work_day_id === d.id);
                const totalInc = (dayEarns || []).reduce((a: any, b: any) => a + (parseFloat(b.amount) || 0), 0);
                const totalCost = (dayExps || []).reduce((a: any, b: any) => a + (parseFloat(b.amount) || 0), 0);
                const fuelOnly = (dayExps || []).filter((e: any) => e.category === 'abastecimento').reduce((a: any, b: any) => a + (parseFloat(b.amount) || 0), 0);
                return {
                    ...d,
                    earnings: dayEarns || [],
                    expenses: dayExps || [],
                    income: totalInc,
                    expense: totalCost,
                    fuelExpense: fuelOnly,
                    profit: totalInc - totalCost
                };
            });
            setHistory(compiled);

            const fcTotal = (fcData || []).filter((fc: any) => fc.user_id === userId).reduce((acc: any, curr: any) => acc + (parseFloat(curr.cost) || 0), 0);
            setTotalFixedCosts(fcTotal);
            setAllMaintenances((maintData || []).filter((m: any) => m.user_id === userId));
        } catch (error) {
            console.error('Error fetching history:', error);
            alert('Erro ao carregar histórico.');
        } finally {
            setLoading(false);
        }
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
        showConfirm(
            'Excluir dia?', 
            'Isso removerá permanentemente todos os ganhos e despesas deste dia.',
            async () => {
                try {
                    await fetch(`/api/data/earnings?work_day_id=${id}`, { method: 'DELETE' });
                    await fetch(`/api/data/expenses?work_day_id=${id}`, { method: 'DELETE' });
                    const res = await fetch(`/api/data/work_days?id=${id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error(await res.text());
                    fetchHistory();
                } catch (error: any) {
                    showAlert('Erro', 'Não foi possível excluir: ' + error.message, 'error');
                }
            },
            'Excluir'
        );
    };

    if (loading) return <div className="p-6 text-center text-slate-400">Carregando histórico...</div>;

    // Grouping
    const groups: Record<string, any[]> = {};
    history.forEach(day => {
        let monthKey = 'Período Indefinido';
        try {
            if (day.date) {
                const parts = day.date.split('-');
                if (parts.length === 3) {
                    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
                    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                    monthKey = `${months[d.getMonth()]} de ${d.getFullYear()}`;
                }
            }
        } catch (e) {}
        
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
                                <XAxis dataKey="date" tickFormatter={(val) => {
                                    try {
                                        const parts = val.split('-');
                                        if (parts.length === 3) {
                                            return `${parts[2]}/${parts[1]}`;
                                        }
                                    } catch (e) {}
                                    return '--/--';
                                }} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
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
                const mIncome = days.reduce((a, b) => a + (parseFloat(b.income as any) || 0), 0);
                const mVariables = days.reduce((a, b) => a + (parseFloat(b.expense as any) || 0), 0);

                // Filter maintenances for this month
                const monthMaintenances = allMaintenances.filter(m => {
                    return new Date(m.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }) === month;
                });
                const mMaintenancesCost = monthMaintenances.reduce((a, b) => a + (parseFloat(b.cost as any) || 0), 0);

                // Total Cost = Variables (Fuel/Food) + Maintenances + Fixed Costs
                const mCost = mVariables + mMaintenancesCost + totalFixedCosts;
                const mProfit = mIncome - mCost;
                const mKm = days.reduce((a, b) => {
                    const start = parseFloat(b.km_start as any) || 0;
                    const end = parseFloat(b.km_end as any) || 0;
                    return a + (end > start ? end - start : 0);
                }, 0);
                const costPerKm = mKm > 0 ? mCost / mKm : 0;

                const dailyGoal = ((user.unsafeMetadata?.daily_goal as number) as number) || 300;
                // Use stored monthly goal OR calculate default
                const monthlyGoal = ((user.unsafeMetadata?.monthly_goal as number) as number) || (dailyGoal * 26);
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
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-xs text-slate-400 font-bold uppercase">Lucro Líquido</span>
                                    <div className={`text-lg font-bold ${mProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(mProfit)}</div>
                                </div>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-800/50 p-3 rounded-2xl border border-white/5">
                                <div className="text-center">
                                    <span className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">Operacional</span>
                                    <span className="text-xs font-bold text-red-300">-{formatCurrency(mVariables)}</span>
                                </div>
                                <div className="text-center border-x border-slate-700/50">
                                    <span className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">Manutenções</span>
                                    <span className="text-xs font-bold text-amber-300">-{formatCurrency(mMaintenancesCost)}</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">Fixos (Mês)</span>
                                    <span className="text-xs font-bold text-indigo-300">-{formatCurrency(totalFixedCosts)}</span>
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

                        {days.map(day => {
                            const kmDriven = (day.km_end || 0) - (day.km_start || 0);
                            const income = day.income || 0;
                            const fatKm = kmDriven > 0 ? (income / kmDriven).toFixed(2) : '0.00';
                            
                            // Safe Date Prep for Mobile
                            let dayNum = '--';
                            let weekDay = '--';
                            try {
                                if (day.date) {
                                    // Implement "Add to Closed Day" feature in HistoryDetailModal
                                    // Restore values from screenshot
                                    // Add "Add Earning" button and form to HistoryDetailModal
                                    // Add "Add Expense" button and form to HistoryDetailModal
                                    // Verify functionality and refresh logic
                                    // Final verification of all data visibility and functionality
                                    // Split YYYY-MM-DD manually to be 100% safe from browser TZ implementation differences
                                    const parts = day.date.split('-');
                                    if (parts.length === 3) {
                                        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
                                        dayNum = d.getDate().toString().padStart(2, '0');
                                        const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
                                        weekDay = weekDays[d.getDay()];
                                    }
                                }
                            } catch (e) {}

                            return (
                                <div key={day.id} onClick={() => setSelectedDay(day)} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 relative group cursor-pointer active:scale-[0.98] transition-all hover:bg-slate-50/50">
                                    {/* Date Badge */}
                                    <div className="w-12 h-12 bg-slate-50/50 rounded-2xl flex flex-col items-center justify-center border border-slate-100/50 shrink-0">
                                        <span className="text-[10px] font-medium text-slate-400 uppercase leading-none mb-0.5">{weekDay}</span>
                                        <span className="text-lg font-bold text-slate-700 leading-none">{dayNum}</span>
                                    </div>

                                    {/* Info Block */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-1">
                                            {day.vehicle_id && vehicles[day.vehicle_id] && (
                                                <span className="text-[9px] font-bold text-indigo-400 bg-indigo-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-indigo-100/50">
                                                    {vehicles[day.vehicle_id]}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                                            <div className="flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500/50"></div>
                                                <span className="text-[11px] font-medium text-emerald-600">{formatCurrency(day.income || 0)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-red-400/50"></div>
                                                <span className="text-[11px] font-medium text-red-400">{formatCurrency(day.expense || 0)}</span>
                                            </div>
                                            <div className="px-2 py-0.5 bg-slate-50 rounded-md text-[9px] font-bold text-slate-400 border border-slate-100 uppercase tracking-tight">
                                                R$ {fatKm} / km
                                            </div>
                                        </div>
                                    </div>

                                    {/* Profit & Actions */}
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className={`text-base font-bold leading-none ${(day.profit || 0) >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                                            {formatCurrency(day.profit || 0)}
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(day.id); }} 
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors active:scale-90"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}

            {/* Modal */}
            {selectedDay && <HistoryDetailModal day={selectedDay} onClose={() => setSelectedDay(null)} onUpdate={() => fetchHistory()} vehicles={vehicles} />}
            
        </div>
    );
};

// --- CORE: TODAY BOARD ---
const TodayView = ({ vehicle, userId, onAddEarning, onAddExpense, onFinishDay, user }: { vehicle: Vehicle | null, userId: string, onAddEarning: () => void, onAddExpense: () => void, onFinishDay: () => void, user: UserResource }) => {
    const supabase = useSupabase();
    const [session, setSession] = useState<WorkDay | null>(null);
    const [earnings, setEarnings] = useState<Earning[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    const [kmStart, setKmStart] = useState('');
    const [kmEnd, setKmEnd] = useState('');

    // Daily Goal
    // Daily Goal
    const [dailyGoal, setDailyGoal] = useState<number>(((user.unsafeMetadata?.daily_goal as number) as number) || 300);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    useEffect(() => {
        // Priority: Metadata > LocalStorage > Default
        if (((user.unsafeMetadata?.daily_goal as number) as number)) {
            setDailyGoal(user.unsafeMetadata.daily_goal as number);
        } else {
            const saved = localStorage.getItem('drivermind_daily_goal');
            if (saved) setDailyGoal(parseFloat(saved));
        }
    }, [user]);

    const saveGoal = async (val: number) => {
        setDailyGoal(val);
        localStorage.setItem('drivermind_daily_goal', val.toString());
        // Also persist to account
        await user?.update({ unsafeMetadata: { daily_goal: val } });
        setIsEditingGoal(false);
    };

    const fetchData = async () => {
        if (!vehicle) { setLoading(false); return; }
        const today = getTodayISODateLocal();

        try {
            const resDays = await fetch(`/api/data/work_days?vehicle_id=${vehicle.id}`);
            if (!resDays.ok) throw new Error(await resDays.text());
            const days = await resDays.json();
            // Prioritize today's session, otherwise find the latest open session
            const sess = days.find((d: any) => d.date === today) || days.find((d: any) => d.status === 'open');
            setSession(sess || null);

            if (sess) {
                const [resEarns, resExps] = await Promise.all([
                    fetch(`/api/data/earnings?work_day_id=${sess.id}`),
                    fetch(`/api/data/expenses?work_day_id=${sess.id}`)
                ]);
                if (!resEarns.ok) throw new Error(await resEarns.text());
                if (!resExps.ok) throw new Error(await resExps.text());

                const allEarns = await resEarns.json();
                const allExps = await resExps.json();
                setEarnings(allEarns);
                setExpenses(allExps);
            } else {
                setEarnings([]);
                setExpenses([]);
            }
        } catch (error) {
            console.error('Error fetching today data:', error);
            alert('Erro ao carregar dados do dia.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData() }, [vehicle]);

    const handleStartDay = async () => {
        if (!vehicle) { alert('Erro: Nenhum veículo selecionado.'); return; }
        if (!kmStart) { alert('Erro: Informe o KM inicial.'); return; }

        const payload = {
            user_id: userId,
            vehicle_id: vehicle.id,
            date: getTodayISODateLocal(),
            km_start: parseFloat(kmStart),
            status: 'open'
        };

        try {
            const res = await fetch('/api/data/work_days', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errText = await res.text();
                // Check if already exists by checking the error message or common sense
                if (errText.includes('23505') || errText.includes('already exists')) {
                     alert(`Você já abriu o dia! Recarregando...`);
                } else {
                    throw new Error(errText);
                }
            }
            fetchData();
        } catch (error: any) {
            alert(`Erro ao iniciar dia: ${error.message}`);
        }
    };

    // handleEndDay moved to FinishDayView

    const handleReopenDay = async () => {
        if (!session) return;

        try {
            const payload = { status: 'open', km_end: null };
            const res = await fetch(`/api/data/work_days?id=${session.id}`, {
                method: 'PUT', // Assuming PUT for update
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(await res.text());
            fetchData();
        } catch (error: any) {
            alert('Erro ao reabrir dia: ' + error.message);
        }
    };


    // Calculate
    const totalEarnings = (earnings || []).reduce((a, b) => a + (parseFloat(b.amount as any) || 0), 0);
    const totalExpenses = (expenses || []).reduce((a, b) => a + (parseFloat(b.amount as any) || 0), 0);
    const profit = totalEarnings - totalExpenses;
    const kmDriven = session?.km_end ? session.km_end - session.km_start : 0;

    const goalProgress = Math.min((Math.max(profit, 0) / dailyGoal) * 100, 100);

    if (!vehicle) return <div className="p-10 text-center text-slate-500">Selecione um veículo na garagem.</div>;
    if (!supabase) return <div className="p-10 text-center text-slate-400">Carregando dia...</div>;

    if (!session) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 overflow-hidden relative">
                    <img src="/logo.png" className="w-full h-full object-cover" alt="Logo" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Vamos lucrar hoje?</h2>
                    <p className="text-slate-500 mb-2">Inicie seu dia de trabalho para registrar ganhos.</p>
                    <div className="text-[10px] text-slate-300 font-mono">v1.1</div>
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
                    <h1 className="text-2xl font-bold text-slate-900">Olá, {((user.unsafeMetadata?.full_name as string) as string)?.split(' ')[0] || 'Motorista'}!</h1>
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
                                try {
                                    const res = await fetch(`/api/data/work_days?id=${session.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'open', km_end: null })
                                    });
                                    if (!res.ok) throw new Error(await res.text());
                                    fetchData();
                                } catch (error: any) {
                                    alert('Erro ao reabrir: ' + error.message);
                                }
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
                        onUpdate={() => fetchData()}
                    />
                )
            }
        </div >
    );
};

// --- REGISTER MODALS ---
const AddTransactionView = ({ type, session, onBack }: { type: 'expense' | 'earning', session: WorkDay | null, onBack: () => void }) => {
    const supabase = useSupabase();
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
        if (!amount || !session || !supabase) return;
        setLoading(true);
        try {
            const table = isExpense ? 'expenses' : 'earnings';
            const payload = isExpense
                ? { work_day_id: session.id, amount: parseFloat(amount), category: category.name, currency: 'BRL', user_id: session.user_id }
                : { work_day_id: session.id, amount: parseFloat(amount), platform: category.name, currency: 'BRL', user_id: session.user_id };

            const res = await fetch(`/api/data/${table}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(await res.text());
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
                    <input autoFocus type="number" step="any" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} className="w-40 bg-transparent outline-none text-center placeholder:text-slate-200" placeholder="0" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {config.options.map((opt: any) => {
                    const isActive = category.name === opt.name;

                    // Explicit Tailwind class mapping to prevent PurgeCSS removal
                    const activeBorderColor = isExpense ? 'border-red-500' : 'border-emerald-500';
                    const activeBgColor = isExpense ? 'bg-red-500' : 'bg-emerald-500';
                    const iconBgColorActive = isExpense ? 'text-red-500' : 'text-emerald-500';

                    return (
                        <button
                            key={opt.name}
                            onClick={() => setCategory(opt)}
                            className={`p-4 rounded-2xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${isActive
                                ? `${activeBorderColor} ${activeBgColor} text-white shadow-lg transform scale-[1.02]`
                                : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            <div className={`p-2 rounded-full ${isActive ? `bg-white ${iconBgColorActive}` : 'bg-slate-100 text-slate-500'}`}>{opt.icon}</div>
                            <span className="capitalize text-sm">{opt.label}</span>
                        </button>
                    )
                })}
            </div>

            <Button fullWidth size="lg" onClick={handleSubmit} disabled={!amount || loading} className={isExpense ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}>
                {loading ? 'Salvando...' : 'Confirmar'}
            </Button>
        </div>
    );
};

const FinishDayView = ({ userId, vehicleId, onBack }: { userId: string, vehicleId: string, onBack: () => void }) => {
    const supabase = useSupabase();
    const [session, setSession] = useState<WorkDay | null>(null);
    const [kmEnd, setKmEnd] = useState('');
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            if (!vehicleId) return;
            const today = getTodayISODateLocal();
            try {
                const res = await fetch(`/api/data/work_days?vehicle_id=${vehicleId}`);
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();
                
                // Find the open session (prioritizing open regardless of date to handle midnight shifts)
                const openSess = data.find((d: any) => d.status === 'open');
                setSession(openSess || null);
            } catch (error) {
                console.error("Error fetching session:", error);
            } finally {
                setInitLoading(false);
            }
        };
        fetchSession();
    }, [vehicleId]);

    const handleConfirm = async () => {
        if (!session || !kmEnd || !supabase) return;
        setLoading(true);
        const res = await fetch(`/api/data/work_days?id=${session.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'closed', km_end: parseFloat(kmEnd) })
        });
        if (!res.ok) {
            const errText = await res.text();
            alert(`Erro ao finalizar: ${errText}`);
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
            <p className="text-slate-500 mb-4 max-w-[200px]">Você já finalizou o dia ou ele não foi aberto.</p>
            <div className="text-[10px] text-slate-300 mb-8 font-mono bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                Sessão não encontrada no servidor • v1.1
            </div>
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
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const supabase = useSupabase();
    const [activeTab, setActiveTab] = useState('today');
    const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showInstallHelp, setShowInstallHelp] = useState(false);
    const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing');
    const [subscriptionStatus, setSubscriptionStatus] = useState<string>('loading');
    const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);

    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
        onConfirm?: () => void;
        confirmLabel?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const showAlert = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, type });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void, confirmLabel = 'Confirmar') => {
        setAlertConfig({ isOpen: true, title, message, type: 'confirm', onConfirm, confirmLabel });
    };
    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));

        const checkStandalone = () => {
            const mql = window.matchMedia('(display-mode: standalone)');
            setIsStandalone(mql.matches || (window.navigator as any).standalone === true);
        };
        checkStandalone();
        
        // Browser compatibility fix: addListener is for older browsers (pre-iOS 14)
        const mql = window.matchMedia('(display-mode: standalone)');
        if ((mql as any).addEventListener) {
            mql.addEventListener('change', checkStandalone);
        } else if ((mql as any).addListener) {
            (mql as any).addListener(checkStandalone);
        }

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            if ((mql as any).removeEventListener) {
                mql.removeEventListener('change', checkStandalone);
            } else if ((mql as any).removeListener) {
                (mql as any).removeListener(checkStandalone);
            }
        };
    }, []);

    // Check subscription status
    useEffect(() => {
        if (!user) return;
        const checkSub = async () => {
            try {
                const res = await fetch('/api/subscription');
                if (res.ok) {
                    const data = await res.json();
                    setSubscriptionStatus(data.status);
                    setTrialDaysRemaining(data.days_remaining || 0);
                } else {
                    const errorMsg = await res.text();
                    console.error('Subscription API failed:', res.status, errorMsg);
                    setSubscriptionStatus('error');
                }
            } catch (e) {
                console.error('Fetch error for subscription:', e);
                setSubscriptionStatus('error');
            }
        };
        checkSub();
    }, [user]);

    useEffect(() => {
        const init = async () => {
            if (!user) return;
            const saved = localStorage.getItem(`active_vehicle_${user.id}`);
            if (saved) {
                setActiveVehicleId(saved);
            } else {
                fetch('/api/data/vehicles')
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.length > 0) setActiveTab('vehicles');
                    });
            }
        };
        init();
    }, [user]);

    useEffect(() => {
        if (user && activeVehicleId) localStorage.setItem(`active_vehicle_${user.id}`, activeVehicleId);
    }, [activeVehicleId, user]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setIsMenuOpen(false);
    };


    if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium">Carregando Driver Mind...</div>;

    if (!user) {
        if (authView === 'landing') return <LandingView onSignup={() => setAuthView('signup')} onLogin={() => setAuthView('login')} />;
        return authView === 'signup' 
            ? <div className="h-screen flex items-center justify-center bg-slate-50"><SignUp routing="path" path="/" forceRedirectUrl="https://www.drivermind.com.br" /></div> 
            : <div className="h-screen flex items-center justify-center bg-slate-50"><SignIn routing="path" path="/" forceRedirectUrl="https://www.drivermind.com.br" /></div>;
    }

    // SUBSCRIPTION CHECK
    if (subscriptionStatus === 'loading') {
        return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium">Verificando assinatura...</div>;
    }

    if (subscriptionStatus === 'error') {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h1 className="text-xl font-bold text-slate-900 mb-2">Erro de Conexão</h1>
                <p className="text-slate-500 max-w-sm mb-6">
                    Não foi possível verificar sua assinatura. Verifique se todas as variáveis de ambiente (Stripe e Supabase) estão configuradas corretamente na Vercel.
                </p>
                <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-medium">
                    Tentar Novamente
                </button>
                <button onClick={() => signOut()} className="mt-4 text-slate-400 text-sm underline">
                    Sair da conta
                </button>
            </div>
        );
    }

    if (subscriptionStatus === 'expired' || subscriptionStatus === 'canceled') {
        return <SalesView userId={user.id} onLogout={() => signOut()} />;
    }

    const renderContent = () => {
        if (activeTab === 'today') return <TodayWrapper userId={user.id} vehicleId={activeVehicleId} onTabChange={setActiveTab} user={user} />;
        if (activeTab === 'history') return <HistoryView userId={user.id} user={user} showAlert={showAlert} showConfirm={showConfirm} />;
        if (activeTab === 'vehicles') return <VehiclesView userId={user.id} activeVehicleId={activeVehicleId} setActiveVehicleId={setActiveVehicleId} showAlert={showAlert} showConfirm={showConfirm} />;
        if (activeTab === 'profile') return (
            <div className="p-6 pb-24 animate-in slide-in-from-right-10 duration-500">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Meu Perfil</h2>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center mb-6">
                    <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-xl shadow-indigo-200 relative">
                        {user.hasImage ? (
                            <img src={user.imageUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            user.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() || '?'
                        )}
                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{user.primaryEmailAddress?.emailAddress?.split('@')[0] || user.firstName || 'Motorista'}</h3>
                    <p className="text-slate-400 text-sm mb-4">{user.primaryEmailAddress?.emailAddress || 'Sem e-mail'}</p>

                    {subscriptionStatus === 'trialing' && (
                        <div className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-xs font-bold mb-3 border border-amber-200">
                            ⏳ {trialDaysRemaining} dias grátis restantes
                        </div>
                    )}
                    {subscriptionStatus === 'active' && (
                        <div className="flex flex-col items-center gap-2 mb-3">
                            <div className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Assinante
                            </div>
                            <p className="text-xs font-bold text-slate-500">
                                ⏳ Faltam {trialDaysRemaining} dias para o fim da assinatura
                            </p>
                        </div>
                    )}

                    <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-500">
                        Membro desde {new Date(user.createdAt || Date.now()).getFullYear()}
                    </div>
                </div>

                <div className="space-y-3">

                    <button onClick={() => setActiveTab('settings')} className="w-full bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-slate-700 font-bold hover:bg-slate-50 transition-colors active:scale-95">
                        <div className="flex items-center gap-3"><Settings size={20} className="text-indigo-500" /> Configurações</div>
                        <ChevronRight size={16} className="text-slate-300" />
                    </button>
                    <button onClick={() => {
                        if (navigator.share) {
                            navigator.share({ title: 'Driver Mind', text: 'Controle seus ganhos com inteligência!', url: window.location.href });
                        } else {
                            navigator.clipboard.writeText(window.location.href);
                            showAlert('Pronto!', 'Link copiado para a área de transferência!', 'success');
                        }
                    }} className="w-full bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-slate-700 font-bold hover:bg-slate-50 transition-colors active:scale-95">
                        <div className="flex items-center gap-3"><Share2 size={20} className="text-indigo-500" /> Compartilhar App</div>
                        <ChevronRight size={16} className="text-slate-300" />
                    </button>
                    <button onClick={() => setShowInstallHelp(true)} className="w-full bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between text-indigo-700 font-bold hover:bg-indigo-100 transition-colors active:scale-95">
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                            Adicionar à Tela Inicial
                        </div>
                        <ChevronRight size={16} className="text-indigo-300" />
                    </button>
                </div>

                <div className="mt-8">
                    <Button variant="danger" onClick={() => signOut()} fullWidth className="shadow-lg shadow-red-100">
                        <LogOut size={18} className="mr-2" /> Sair da Conta
                    </Button>
                </div>

                <p className="text-center text-xs text-slate-300 mt-8">DriverMind v0.1.3 • De um motorista, para outros motoristas.</p>
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
            return <SettingsView user={user} onBack={() => setActiveTab('profile')} showAlert={showAlert} showConfirm={showConfirm} />
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

                <AlertModal
                    {...alertConfig}
                    onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                />

                {/* FAB Removed */}

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
                                {user.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span className="text-[10px] font-bold">Perfil</span>
                        </button>
                    </div>
                )}

                {/* Install Instructions Modal */}
                {showInstallHelp && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-[50%] sm:slide-in-from-bottom-[10%] relative overflow-hidden">

                            <button onClick={() => setShowInstallHelp(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2 transition-colors">
                                <X size={20} />
                            </button>

                            <div className="w-full flex justify-center mb-4">
                                <img src="/assets/pwa-guide.png" alt="Guia de Instalação" className="h-32 object-contain rounded-xl" />
                            </div>

                            <h3 className="text-xl font-bold text-center text-slate-800 mb-2">Instale o DriverMind</h3>
                            <p className="text-center text-slate-500 text-sm mb-6">Tenha o aplicativo na sua tela de início para acesso rápido e experiência de app nativo.</p>

                            <div className="space-y-6">
                                {/* Android Instructions */}
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-3 text-emerald-600 font-bold">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M17.523 15.3414C17.523 15.3414 16.222 15.8454 15.111 15.8454C13.999 15.8454 12.698 15.3414 12.698 15.3414V11.3934H17.523V15.3414ZM6.47705 15.3414C6.47705 15.3414 7.77805 15.8454 8.88905 15.8454C100 15.8454 11.302 15.3414 11.302 15.3414V11.3934H6.47705V15.3414ZM12 2.6582L10.741 0.479199C10.669 0.354199 10.511 0.312199 10.386 0.384199C10.261 0.457199 10.22 0.614199 10.292 0.739199L11.583 2.9762C10.281 3.5672 9.17105 4.5402 8.41105 5.7672h7.178C14.829 4.5402 13.719 3.5672 12 2.6582Z" /><path d="M4.14893 23h15.7021v-6.289h-15.702v6.289z" /><path d="M4.14893 9.771v5.62h15.7021v-5.62H4.14893z" /></svg>
                                        No Android (Chrome)
                                    </div>
                                    <ol className="text-sm text-slate-600 space-y-2 pl-5 list-decimal font-medium">
                                        <li>Toque nos <strong className="text-slate-800">três pontinhos</strong> (⋮) no menu do navegador</li>
                                        <li>Escolha <strong className="text-slate-800">Adicionar à Tela Inicial</strong></li>
                                        <li>Confirme em <strong className="text-slate-800">Adicionar</strong></li>
                                    </ol>
                                    {deferredPrompt && (
                                        <Button onClick={() => deferredPrompt.prompt()} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md border-0">
                                            Instalar Automaticamente
                                        </Button>
                                    )}
                                </div>

                                {/* iOS Instructions */}
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-3 text-slate-800 font-bold">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" /></svg>
                                        No iPhone (Safari)
                                    </div>
                                    <ol className="text-sm text-slate-600 space-y-2 pl-5 list-decimal font-medium">
                                        <li>Toque no botão <strong className="text-slate-800">Compartilhar</strong> (quadrado com seta pra cima, na barra inferior)</li>
                                        <li>Role para baixo e toque em <strong className="text-slate-800">Adicionar à Tela de Início</strong></li>
                                        <li>Confirme em <strong className="text-slate-800">Adicionar</strong> no canto direito superior</li>
                                    </ol>
                                </div>
                            </div>

                            <button onClick={() => setShowInstallHelp(false)} className="w-full mt-6 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                                Agora não
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </SecurityWrapper>
    );
}

// --- Wrappers for data fetching ---

const TodayWrapper = ({ userId, vehicleId, onTabChange, user }: { userId: string, vehicleId: string | null, onTabChange: (tab: string) => void, user: UserResource }) => {
    const supabase = useSupabase();
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    useEffect(() => {
        if (vehicleId) {
            fetch(`/api/data/vehicles`)
                .then(res => res.json())
                .then(data => {
                    const v = data.find((veh: any) => veh.id === vehicleId);
                    if (v) setVehicle(v);
                });
        }
    }, [vehicleId]);
    return <TodayView userId={userId} vehicle={vehicle} onAddEarning={() => onTabChange('add-earning')} onAddExpense={() => onTabChange('add-expense')} onFinishDay={() => onTabChange('finish-day')} user={user} />;
}

const FinishDayWrapper = ({ userId, vehicleId, onBack }: any) => {
    return <FinishDayView userId={userId} vehicleId={vehicleId} onBack={onBack} />;
}

const TransactionWrapper = ({ userId, vehicleId, type, onBack }: { userId: string, vehicleId: string | null, type: 'expense' | 'earning', onBack: () => void }) => {
    const supabase = useSupabase();
    const [session, setSession] = useState<WorkDay | null>(null);
    useEffect(() => {
        const fetchSess = async () => {
            if (!vehicleId) return;
            const today = getTodayISODateLocal();
            const res = await fetch(`/api/data/work_days?vehicle_id=${vehicleId}`);
            if (res.ok) {
                const days = await res.json();
                // Prioritize today, fallback to any open session
                const activeSess = days.find((d: any) => d.date === today) || days.find((d: any) => d.status === 'open');
                setSession(activeSess || null);
            }
        };
        fetchSess();
    }, [userId]);
    return <AddTransactionView type={type} session={session} onBack={onBack} />
}

const NavIcon = ({ icon, label, active, onClick }: { icon: React.ReactElement, label: string, active: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
        {React.cloneElement(icon as any, { size: 24, strokeWidth: active ? 2.5 : 2 })}
        <span className="text-[10px] font-bold">{label}</span>
    </button>
)
