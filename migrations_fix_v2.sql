-- FIX V2: Run these blocks ONE BY ONE if you encounter errors.

-- BLOCK 1: Fix column and clean up old triggers
ALTER TABLE public.work_days ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
DROP TRIGGER IF EXISTS update_work_days_updated_at ON public.work_days;

-- BLOCK 2: Create the function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- BLOCK 3: Re-attach the trigger
CREATE TRIGGER update_work_days_updated_at
BEFORE UPDATE ON public.work_days
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- BLOCK 4: Enable Cron (Only if your plan supports it)
-- If this fails, just SKIP it. The app will still work, just won't auto-close.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- BLOCK 5: Schedule the job
-- We use standard single quotes to avoid $$ parsing issues. 
-- Note the doubled single quotes '' inside the string to escape them.
SELECT cron.schedule(
    'auto-close-days',
    '0 3 * * *',
    'UPDATE public.work_days SET status = ''closed'', km_end = km_start, updated_at = now() WHERE status = ''open'''
);
