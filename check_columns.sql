-- CHECK TABLE COLUMNS
-- Run this to verify if the updated_at column exists in work_days
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'work_days';
