import React from 'react';
import { X, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Button } from './Button';

interface AlertModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({
    isOpen,
    title,
    message,
    type = 'info',
    confirmLabel = 'OK',
    cancelLabel = 'Cancelar',
    onConfirm,
    onCancel,
    onClose
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 size={24} className="text-emerald-500" />;
            case 'error': return <AlertCircle size={24} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={24} className="text-amber-500" />;
            case 'confirm': return <AlertTriangle size={24} className="text-indigo-500" />;
            default: return <Info size={24} className="text-indigo-500" />;
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={onClose}>
            <div 
                className="bg-white/90 backdrop-blur-md w-full max-w-sm rounded-[2rem] shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex-shrink-0">
                            {getIcon()}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-8">
                        {type === 'confirm' ? (
                            <>
                                <Button 
                                    variant="ghost" 
                                    onClick={() => { onCancel?.(); onClose(); }}
                                    className="flex-1 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                >
                                    {cancelLabel}
                                </Button>
                                <Button 
                                    className="flex-1"
                                    onClick={() => { onConfirm?.(); onClose(); }}
                                >
                                    {confirmLabel}
                                </Button>
                            </>
                        ) : (
                            <Button 
                                className="w-full"
                                onClick={onClose}
                            >
                                {confirmLabel}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
