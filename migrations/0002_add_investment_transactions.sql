-- Add description column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Add investment maturity tracking
ALTER TABLE investments ADD COLUMN IF NOT EXISTS end_date TIMESTAMP;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS profit DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS total_return DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Update existing investments with end dates based on plan duration
UPDATE investments
SET end_date = start_date + INTERVAL '30 days'
WHERE end_date IS NULL AND plan_id = 1;

UPDATE investments
SET end_date = start_date + INTERVAL '90 days'
WHERE end_date IS NULL AND plan_id = 2;

UPDATE investments
SET end_date = start_date + INTERVAL '180 days'
WHERE end_date IS NULL AND plan_id = 3;