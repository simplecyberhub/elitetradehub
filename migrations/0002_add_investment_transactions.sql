
-- Add description column to transactions table
ALTER TABLE transactions ADD COLUMN description text;

-- Update transaction type to allow investments
-- Note: The type column already allows any text, so investments are already supported
