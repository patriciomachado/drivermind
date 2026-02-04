-- FIX V3: VEHICLE DATA CLEANUP AND CONSTRAINT
-- Execute completely.

BEGIN;

-- 1. Drop bad constraint
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_type_check;

-- 2. Fix NULLs (Just in case)
UPDATE public.vehicles 
SET type = 'combustion' 
WHERE type IS NULL;

-- 3. Fix Invalid Values (Trim whitespace just in case)
UPDATE public.vehicles 
SET type = 'combustion' 
WHERE trim(type) NOT IN ('combustion', 'electric', 'motorcycle');

-- 4. Re-apply constraint
ALTER TABLE public.vehicles 
ADD CONSTRAINT vehicles_type_check 
CHECK (type IN ('combustion', 'electric', 'motorcycle'));

COMMIT;
