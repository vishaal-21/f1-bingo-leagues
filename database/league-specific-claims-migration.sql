-- Migration: Add league_id to claims for league-specific voting
-- This enables fair voting where only league members can vote on claims for their league

-- Step 1: Add league_id column to claims table
ALTER TABLE claims ADD COLUMN IF NOT EXISTS league_id UUID REFERENCES leagues(id) ON DELETE CASCADE;

-- Step 2: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_claims_league_id ON claims(league_id);

-- Step 3: Update the unique constraint to include league_id
-- This allows the same prediction to have multiple claims (one per league)
-- First, we need to check if there's an existing constraint to drop

-- Drop any existing constraint that prevents multiple claims per prediction
-- (if one exists from previous schema)
ALTER TABLE claims DROP CONSTRAINT IF EXISTS claims_prediction_id_key;

-- Step 4: Add new constraint - one claim per prediction per league
-- This allows user to have claim in League A and League B for same prediction
CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_prediction_league 
ON claims(prediction_id, league_id);

-- Step 5: Update RLS policies to include league filtering
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view claims for their league races" ON claims;
DROP POLICY IF EXISTS "Users can create claims for their predictions" ON claims;
DROP POLICY IF EXISTS "Users can update their own claims" ON claims;

-- Recreate with league awareness
CREATE POLICY "Users can view claims for their league races"
  ON claims FOR SELECT
  USING (
    league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create claims for their predictions"
  ON claims FOR INSERT
  WITH CHECK (
    claimed_by = auth.uid() AND
    league_id IN (
      SELECT league_id FROM league_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own claims"
  ON claims FOR UPDATE
  USING (claimed_by = auth.uid());

-- Step 6: Update claim_votes RLS to ensure voters are in the same league
DROP POLICY IF EXISTS "Users can view votes for claims in their leagues" ON claim_votes;
DROP POLICY IF EXISTS "Users can vote on claims in their leagues" ON claim_votes;

CREATE POLICY "Users can view votes for claims in their leagues"
  ON claim_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM claims 
      WHERE claims.id = claim_votes.claim_id 
      AND claims.league_id IN (
        SELECT league_id FROM league_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can vote on claims in their leagues"
  ON claim_votes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM claims
      WHERE claims.id = claim_id
      AND claims.league_id IN (
        SELECT league_id FROM league_members WHERE user_id = auth.uid()
      )
    )
  );

-- Note: Existing claims without league_id will need to be handled
-- Option 1: Keep them as global (league_id = NULL)
-- Option 2: Delete them and let users recreate
-- Option 3: Assign them to a default league

-- For now, we'll allow NULL league_id but new claims must have league_id
-- You can clean up old claims with: DELETE FROM claims WHERE league_id IS NULL;
