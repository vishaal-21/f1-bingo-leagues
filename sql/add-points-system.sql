-- Add points system to boards table
-- Points breakdown:
-- - 5 points per confirmed prediction
-- - 25 bonus points per bingo (row/column/diagonal)
-- - 100 bonus points for completing all 25 cells

-- Add points column to boards table
ALTER TABLE boards ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Add bingos_completed column to track number of bingos
ALTER TABLE boards ADD COLUMN IF NOT EXISTS bingos_completed INTEGER DEFAULT 0;

-- Add full_board_completed boolean
ALTER TABLE boards ADD COLUMN IF NOT EXISTS full_board_completed BOOLEAN DEFAULT false;

-- Update existing boards to have 0 points
UPDATE boards SET points = 0 WHERE points IS NULL;
UPDATE boards SET bingos_completed = 0 WHERE bingos_completed IS NULL;
UPDATE boards SET full_board_completed = false WHERE full_board_completed IS NULL;
