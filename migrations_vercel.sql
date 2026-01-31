-- MASTER MIGRATION FOR VERCEL DEPLOYMENT
-- Execute this script in the Supabase SQL Editor to ensure all tables exist.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS public.vehicles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    name text NOT NULL,
    model text,
    plate text,
    active boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Ensure 'type' column exists (Maintenance Feature)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='type') THEN
        ALTER TABLE public.vehicles ADD COLUMN type text NOT NULL DEFAULT 'combustion' CHECK (type IN ('combustion', 'electric', 'motorcycle'));
    END IF;
END $$;

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Vehicles Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'Users can view their own vehicles') THEN
        CREATE POLICY "Users can view their own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'Users can insert their own vehicles') THEN
        CREATE POLICY "Users can insert their own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'Users can update their own vehicles') THEN
        CREATE POLICY "Users can update their own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vehicles' AND policyname = 'Users can delete their own vehicles') THEN
        CREATE POLICY "Users can delete their own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;


-- 3. WORK_DAYS TABLE
CREATE TABLE IF NOT EXISTS public.work_days (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    date date NOT NULL,
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    status text NOT NULL CHECK (status IN ('open', 'closed')) DEFAULT 'open',
    km_total numeric DEFAULT 0,
    currency_base text DEFAULT 'BRL',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Ensure columns from updates exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_days' AND column_name='vehicle_id') THEN
        ALTER TABLE public.work_days ADD COLUMN vehicle_id uuid REFERENCES public.vehicles(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_days' AND column_name='km_start') THEN
        ALTER TABLE public.work_days ADD COLUMN km_start numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_days' AND column_name='km_end') THEN
        ALTER TABLE public.work_days ADD COLUMN km_end numeric;
    END IF;
END $$;

ALTER TABLE public.work_days ENABLE ROW LEVEL SECURITY;

-- Work Days Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_days' AND policyname = 'Users can view their own work days') THEN
        CREATE POLICY "Users can view their own work days" ON public.work_days FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_days' AND policyname = 'Users can insert their own work days') THEN
        CREATE POLICY "Users can insert their own work days" ON public.work_days FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_days' AND policyname = 'Users can update their own work days') THEN
        CREATE POLICY "Users can update their own work days" ON public.work_days FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'work_days' AND policyname = 'Users can delete their own work days') THEN
        CREATE POLICY "Users can delete their own work days" ON public.work_days FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;


-- 4. EARNINGS TABLE
CREATE TABLE IF NOT EXISTS public.earnings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    work_day_id uuid REFERENCES public.work_days(id) ON DELETE CASCADE NOT NULL,
    platform text NOT NULL CHECK (platform IN ('Uber', '99', 'InDrive', 'Por fora')),
    amount numeric NOT NULL,
    currency text NOT NULL CHECK (currency IN ('BRL', 'USD')),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;

-- Earnings Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'earnings' AND policyname = 'Users can view their own earnings') THEN
        CREATE POLICY "Users can view their own earnings" ON public.earnings FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'earnings' AND policyname = 'Users can insert their own earnings') THEN
        CREATE POLICY "Users can insert their own earnings" ON public.earnings FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'earnings' AND policyname = 'Users can update their own earnings') THEN
        CREATE POLICY "Users can update their own earnings" ON public.earnings FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'earnings' AND policyname = 'Users can delete their own earnings') THEN
        CREATE POLICY "Users can delete their own earnings" ON public.earnings FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;


-- 5. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    work_day_id uuid REFERENCES public.work_days(id) ON DELETE CASCADE NOT NULL,
    category text NOT NULL CHECK (category IN ('alimentacao', 'abastecimento', 'manutencao', 'outros')),
    amount numeric NOT NULL,
    currency text NOT NULL CHECK (currency IN ('BRL', 'USD')),
    note text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Expenses Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can view their own expenses') THEN
        CREATE POLICY "Users can view their own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can insert their own expenses') THEN
        CREATE POLICY "Users can insert their own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can update their own expenses') THEN
        CREATE POLICY "Users can update their own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can delete their own expenses') THEN
        CREATE POLICY "Users can delete their own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;


-- 6. MAINTENANCES TABLE
CREATE TABLE IF NOT EXISTS public.maintenances (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    km_at_maintenance numeric,
    cost numeric NOT NULL DEFAULT 0,
    note text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY;

-- Maintenances Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'maintenances' AND policyname = 'Users can view their own maintenances') THEN
        CREATE POLICY "Users can view their own maintenances" ON public.maintenances FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'maintenances' AND policyname = 'Users can insert their own maintenances') THEN
        CREATE POLICY "Users can insert their own maintenances" ON public.maintenances FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'maintenances' AND policyname = 'Users can update their own maintenances') THEN
        CREATE POLICY "Users can update their own maintenances" ON public.maintenances FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'maintenances' AND policyname = 'Users can delete their own maintenances') THEN
        CREATE POLICY "Users can delete their own maintenances" ON public.maintenances FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 7. INDEXES
CREATE INDEX IF NOT EXISTS idx_work_days_user_date ON public.work_days(user_id, date);
CREATE INDEX IF NOT EXISTS idx_earnings_work_day_id ON public.earnings(work_day_id);
CREATE INDEX IF NOT EXISTS idx_expenses_work_day_id ON public.expenses(work_day_id);
CREATE INDEX IF NOT EXISTS idx_work_days_status ON public.work_days(user_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenances_vehicle_id ON public.maintenances(vehicle_id);

-- 8. TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_work_days_updated_at') THEN
        CREATE TRIGGER update_work_days_updated_at
        BEFORE UPDATE ON public.work_days
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;
