-- Add type to vehicles
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'combustion' CHECK (type IN ('combustion', 'electric', 'motorcycle'));

-- Create Maintenances table
CREATE TABLE IF NOT EXISTS public.maintenances (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL, -- e.g., 'oil_change', 'tire_rotation', 'revision', 'other'
    date date NOT NULL DEFAULT CURRENT_DATE,
    km_at_maintenance numeric,
    cost numeric NOT NULL DEFAULT 0,
    note text,
    created_at timestamptz DEFAULT now()
);

-- RLS for Maintenances
ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own maintenances"
  ON public.maintenances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own maintenances"
  ON public.maintenances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maintenances"
  ON public.maintenances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maintenances"
  ON public.maintenances FOR DELETE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_maintenances_vehicle_id ON public.maintenances(vehicle_id);
