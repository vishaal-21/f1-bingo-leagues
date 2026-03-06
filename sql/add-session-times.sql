-- Add session timing columns to global_races table
ALTER TABLE global_races ADD COLUMN IF NOT EXISTS is_sprint_weekend BOOLEAN DEFAULT FALSE;
ALTER TABLE global_races ADD COLUMN IF NOT EXISTS fp1_time TIMESTAMPTZ;
ALTER TABLE global_races ADD COLUMN IF NOT EXISTS qualifying_time TIMESTAMPTZ;
ALTER TABLE global_races ADD COLUMN IF NOT EXISTS sprint_qualifying_time TIMESTAMPTZ;
ALTER TABLE global_races ADD COLUMN IF NOT EXISTS sprint_time TIMESTAMPTZ;

-- Update lock_time to be determined by:
-- - Sprint weekends: lock at sprint qualifying start
-- - Normal weekends: lock at qualifying start
-- This will be populated by the fetch script

COMMENT ON COLUMN global_races.is_sprint_weekend IS 'True if this race weekend includes a sprint race';
COMMENT ON COLUMN global_races.qualifying_time IS 'Time when main qualifying session starts (normal weekends) or traditional qualifying (sprint weekends)';
COMMENT ON COLUMN global_races.sprint_qualifying_time IS 'Time when sprint qualifying starts (sprint weekends only)';
COMMENT ON COLUMN global_races.sprint_time IS 'Time when sprint race starts (sprint weekends only)';
COMMENT ON COLUMN global_races.lock_time IS 'Board lock time - set to qualifying_time or sprint_qualifying_time depending on weekend type';
