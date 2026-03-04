-- Migration for Maintenance Feature
-- Ensures the vehicles table has the 'type' column and creates the 'maintenances' table if it doesn't exist.

-- 1. Ensure 'type' column exists in 'vehicles'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='type') THEN
        ALTER TABLE public.vehicles ADD COLUMN type text NOT NULL DEFAULT 'combustion' CHECK (type IN ('combustion', 'electric', 'motorcycle'));
    END IF;
END $$;

-- 2. Create 'maintenances' table
CREATE TABLE IF NOT EXISTS public.maintenances (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL, -- e.g., 'oleo', 'pneu', 'revisao', 'outros'
    date date NOT NULL DEFAULT CURRENT_DATE,
    km_at_maintenance numeric,
    cost numeric NOT NULL DEFAULT 0,
    note text,
    created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (using DO block to avoid errors if they already exist)
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

-- 5. Create Index
CREATE INDEX IF NOT EXISTS idx_maintenances_vehicle_id ON public.maintenances(vehicle_id);
