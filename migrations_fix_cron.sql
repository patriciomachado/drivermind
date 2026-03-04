-- MIGRATION: FIX UPDATED_AT ERROR AND ADD AUTO-CLOSE CRON
-- Run this script in the Supabase SQL Editor

-- 1. Fix 'updated_at' column in work_days
-- Ensure the column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='work_days' AND column_name='updated_at') THEN
        ALTER TABLE public.work_days ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 2. Recreate the Trigger Function and Trigger
-- This ensures the function expects the correct record structure
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_work_days_updated_at ON public.work_days;

CREATE TRIGGER update_work_days_updated_at
BEFORE UPDATE ON public.work_days
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- 3. Enable pg_cron (Requires supported Supabase plan)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 4. Schedule Auto-Close Job
-- Schedule: Every day at 03:00 UTC (00:00 BRT)
-- Logic: Close any 'open' day, setting km_end = km_start (since we don't know the real end)
SELECT cron.schedule(
    'auto-close-days', -- Job name
    '0 3 * * *',       -- Cron schedule (03:00 AM UTC)
    $$
    UPDATE public.work_days 
    SET status = 'closed', 
        km_end = km_start, 
        updated_at = now()
    WHERE status = 'open';
    $$
);

-- Note: To check if it ran: SELECT * FROM cron.job_run_details;
-- To unschedule: SELECT cron.unschedule('auto-close-days');
