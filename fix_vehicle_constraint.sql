-- FIX: VEHICLE TYPE CONSTRAINT
-- Run this in Supabase SQL Editor to ensure the allowed types match the App.

-- 1. Drop the existing check constraint (if any)
-- We use a DO block to avoid errors if the constraint has a different auto-generated name or doesn't exist
DO $$
BEGIN
    -- Try to drop constraint by common names
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_type_check') THEN
        ALTER TABLE public.vehicles DROP CONSTRAINT vehicles_type_check;
    END IF;
END $$;

-- 2. Add the correct constraint
-- Allowed values: 'combustion', 'electric', 'motorcycle'
ALTER TABLE public.vehicles 
ADD CONSTRAINT vehicles_type_check 
CHECK (type IN ('combustion', 'electric', 'motorcycle'));
