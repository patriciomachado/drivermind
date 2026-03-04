-- FIX V2: VEHICLE TYPE CONSTRAINT
-- Execute this entire script in Supabase SQL Editor.

-- 1. Remove the problematic constraint by name
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_type_check;

-- 2. Validate existing data (Optional: Update bad data to default)
-- This ensures the ADD CONSTRAINT won't fail if there's already "bad" data
UPDATE public.vehicles 
SET type = 'combustion' 
WHERE type NOT IN ('combustion', 'electric', 'motorcycle');

-- 3. Add the correct constraint matching the App
ALTER TABLE public.vehicles 
ADD CONSTRAINT vehicles_type_check 
CHECK (type IN ('combustion', 'electric', 'motorcycle'));

-- 4. Verify (Optional output)
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'vehicles_type_check';
