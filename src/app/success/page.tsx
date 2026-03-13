"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, PartyPopper } from 'lucide-react';

export default function SuccessPage() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push('/');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>

            <div className="relative z-10 w-full max-w-md text-center">
                {/* Success Icon */}
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 mx-auto shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-bounce">
                    <CheckCircle2 size={48} className="text-emerald-400" />
                </div>

                <div className="space-y-4 mb-12">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold tracking-widest uppercase text-sm">
                         <PartyPopper size={16} /> Parabéns!
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Pagamento Confirmado</h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Sua assinatura **DriverMind Pro** foi ativada com sucesso. Prepare-se para decolar seus lucros!
                    </p>
                </div>

                {/* Glassmorphism Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl mb-8">
                    <p className="text-slate-300 mb-6 font-medium">
                        Você será redirecionado para o painel em <span className="text-emerald-400 font-bold text-xl">{countdown}</span> segundos...
                    </p>
                    
                    <button 
                        onClick={() => router.push('/')}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 group active:scale-95"
                    >
                        Ir para o Painel Agora
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <p className="text-slate-500 text-xs uppercase tracking-widest">
                    DriverMind • Sua gestão profissional
                </p>
            </div>
        </div>
    );
}
