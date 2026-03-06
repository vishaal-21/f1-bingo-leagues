-- Add admin flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Add finish_time column to existing global_races table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'global_races') THEN
    -- Table exists, add column if missing
    ALTER TABLE global_races ADD COLUMN IF NOT EXISTS finish_time TIMESTAMPTZ;
    
    -- Update existing rows to calculate finish_time
    UPDATE global_races 
    SET finish_time = scheduled_start_time + INTERVAL '4 hours'
    WHERE finish_time IS NULL;
    
    -- Make it NOT NULL after populating
    ALTER TABLE global_races ALTER COLUMN finish_time SET NOT NULL;
  END IF;
END $$;

-- Create global races table (not per-league, these are the F1 season races)
CREATE TABLE IF NOT EXISTS global_races (
    id TEXT PRIMARY KEY, -- e.g., 'race-aus', 'race-mon'
    name TEXT NOT NULL,
    scheduled_start_time TIMESTAMPTZ NOT NULL,
    lock_time TIMESTAMPTZ NOT NULL,
    finish_time TIMESTAMPTZ NOT NULL, -- Auto-calculated: scheduled_start_time + 4 hours
    status TEXT NOT NULL CHECK (status IN ('upcoming', 'locked', 'live', 'finished')),
    country TEXT NOT NULL,
    flag_emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE global_races ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view races" ON global_races;
DROP POLICY IF EXISTS "Only admins can update races" ON global_races;

-- Everyone can read races
CREATE POLICY "Anyone can view races"
    ON global_races FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can update race status
CREATE POLICY "Only admins can update races"
    ON global_races FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Insert the 2026 F1 calendar (lock_time = scheduled_start_time, boards lock when race starts)
INSERT INTO global_races (id, name, scheduled_start_time, lock_time, finish_time, status, country, flag_emoji) VALUES
  ('race-aus', 'Australian Grand Prix', '2026-03-08T04:00:00Z', '2026-03-08T04:00:00Z', '2026-03-08T08:00:00Z', 'upcoming', 'Australia', '🇦🇺'),
  ('race-chn', 'Chinese Grand Prix', '2026-03-15T07:00:00Z', '2026-03-15T07:00:00Z', '2026-03-15T11:00:00Z', 'upcoming', 'China', '🇨🇳'),
  ('race-jpn', 'Japanese Grand Prix', '2026-03-29T05:00:00Z', '2026-03-29T05:00:00Z', '2026-03-29T09:00:00Z', 'upcoming', 'Japan', '🇯🇵'),
  ('race-bhr', 'Bahrain Grand Prix', '2026-04-12T15:00:00Z', '2026-04-12T15:00:00Z', '2026-04-12T19:00:00Z', 'upcoming', 'Bahrain', '🇧🇭'),
  ('race-ksa', 'Saudi Arabian Grand Prix', '2026-04-19T17:00:00Z', '2026-04-19T17:00:00Z', '2026-04-19T21:00:00Z', 'upcoming', 'Saudi Arabia', '🇸🇦'),
  ('race-mia', 'Miami Grand Prix', '2026-05-03T19:00:00Z', '2026-05-03T19:00:00Z', '2026-05-03T23:00:00Z', 'upcoming', 'United States', '🇺🇸'),
  ('race-can', 'Canadian Grand Prix', '2026-05-24T18:00:00Z', '2026-05-24T18:00:00Z', '2026-05-24T22:00:00Z', 'upcoming', 'Canada', '🇨🇦'),
  ('race-mon', 'Monaco Grand Prix', '2026-06-07T13:00:00Z', '2026-06-07T13:00:00Z', '2026-06-07T17:00:00Z', 'upcoming', 'Monaco', '🇲🇨'),
  ('race-cat', 'Barcelona-Catalunya Grand Prix', '2026-06-14T13:00:00Z', '2026-06-14T13:00:00Z', '2026-06-14T17:00:00Z', 'upcoming', 'Spain', '🇪🇸'),
  ('race-aut', 'Austrian Grand Prix', '2026-06-28T13:00:00Z', '2026-06-28T13:00:00Z', '2026-06-28T17:00:00Z', 'upcoming', 'Austria', '🇦🇹'),
  ('race-gbr', 'British Grand Prix', '2026-07-05T14:00:00Z', '2026-07-05T14:00:00Z', '2026-07-05T18:00:00Z', 'upcoming', 'United Kingdom', '🇬🇧'),
  ('race-bel', 'Belgian Grand Prix', '2026-07-19T13:00:00Z', '2026-07-19T13:00:00Z', '2026-07-19T17:00:00Z', 'upcoming', 'Belgium', '🇧🇪'),
  ('race-hun', 'Hungarian Grand Prix', '2026-07-26T13:00:00Z', '2026-07-26T13:00:00Z', '2026-07-26T17:00:00Z', 'upcoming', 'Hungary', '🇭🇺'),
  ('race-ned', 'Dutch Grand Prix', '2026-08-23T13:00:00Z', '2026-08-23T13:00:00Z', '2026-08-23T17:00:00Z', 'upcoming', 'Netherlands', '🇳🇱'),
  ('race-ita', 'Italian Grand Prix', '2026-09-06T13:00:00Z', '2026-09-06T13:00:00Z', '2026-09-06T17:00:00Z', 'upcoming', 'Italy', '🇮🇹'),
  ('race-esp', 'Spanish Grand Prix', '2026-09-13T13:00:00Z', '2026-09-13T13:00:00Z', '2026-09-13T17:00:00Z', 'upcoming', 'Spain', '🇪🇸'),
  ('race-aze', 'Azerbaijan Grand Prix', '2026-09-26T11:00:00Z', '2026-09-26T11:00:00Z', '2026-09-26T15:00:00Z', 'upcoming', 'Azerbaijan', '🇦🇿'),
  ('race-sgp', 'Singapore Grand Prix', '2026-10-11T12:00:00Z', '2026-10-11T12:00:00Z', '2026-10-11T16:00:00Z', 'upcoming', 'Singapore', '🇸🇬'),
  ('race-usa', 'United States Grand Prix', '2026-10-25T19:00:00Z', '2026-10-25T19:00:00Z', '2026-10-25T23:00:00Z', 'upcoming', 'United States', '🇺🇸'),
  ('race-mex', 'Mexico City Grand Prix', '2026-11-01T20:00:00Z', '2026-11-01T20:00:00Z', '2026-11-02T00:00:00Z', 'upcoming', 'Mexico', '🇲🇽'),
  ('race-bra', 'São Paulo Grand Prix', '2026-11-08T17:00:00Z', '2026-11-08T17:00:00Z', '2026-11-08T21:00:00Z', 'upcoming', 'Brazil', '🇧🇷'),
  ('race-lvs', 'Las Vegas Grand Prix', '2026-11-21T06:00:00Z', '2026-11-21T06:00:00Z', '2026-11-21T10:00:00Z', 'upcoming', 'United States', '🇺🇸'),
  ('race-qat', 'Qatar Grand Prix', '2026-11-29T14:00:00Z', '2026-11-29T14:00:00Z', '2026-11-29T18:00:00Z', 'upcoming', 'Qatar', '🇶🇦'),
  ('race-abd', 'Abu Dhabi Grand Prix', '2026-12-06T13:00:00Z', '2026-12-06T13:00:00Z', '2026-12-06T17:00:00Z', 'upcoming', 'Abu Dhabi', '🇦🇪')
ON CONFLICT (id) DO NOTHING;

-- Add to realtime publication (ignore error if already exists)
DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE global_races;
EXCEPTION 
  WHEN duplicate_object THEN NULL;
END $$;
