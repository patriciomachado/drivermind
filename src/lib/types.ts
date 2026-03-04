export type Currency = 'BRL' | 'USD';
export type WorkDayStatus = 'open' | 'closed';
export type Platform = 'Uber' | '99' | 'InDrive' | 'Por fora';
export type ExpenseCategory = 'alimentacao' | 'abastecimento' | 'manutencao' | 'outros';

export interface WorkDay {
    id: string;
    user_id: string;
    date: string;
    started_at: string;
    ended_at: string | null;
    status: WorkDayStatus;
    km_total: number;
    created_at: string;
}

export interface Earning {
    id: string;
    work_day_id: string;
    platform: Platform;
    amount: number;
    currency: Currency;
    created_at: string;
}

export interface Expense {
    id: string;
    work_day_id: string;
    category: ExpenseCategory;
    amount: number;
    currency: Currency;
    note: string | null;
    created_at: string;
}

export interface DashboardStats {
    totalEarningsBrl: number;
    totalEarningsUsd: number;
    totalExpensesBrl: number;
    totalExpensesUsd: number;
    profitBrl: number;
    profitUsd: number;
    perKmBrl: number;
    perKmUsd: number;
}
