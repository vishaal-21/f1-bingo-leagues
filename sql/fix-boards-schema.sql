-- Fix boards table to use race identifier instead of race UUID reference
-- This allows boards to work with the static F1 calendar without needing race records in DB

-- Drop the boards table and recreate it
DROP TABLE IF EXISTS boards CASCADE;
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    race_identifier TEXT NOT NULL, -- e.g., 'race-mon', 'race-aus', etc.
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(league_id, race_identifier, user_id)
);

-- Recreate index
CREATE INDEX idx_boards_race_identifier ON boards(race_identifier);
CREATE INDEX idx_boards_user_id ON boards(user_id);
CREATE INDEX idx_boards_league_id ON boards(league_id);

-- Enable RLS
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boards
DROP POLICY IF EXISTS "Boards are viewable by league members" ON boards;
DROP POLICY IF EXISTS "Users can create their own boards" ON boards;
DROP POLICY IF EXISTS "Users can update their own boards" ON boards;

CREATE POLICY "Boards are viewable by league members" ON boards
    FOR SELECT USING (
        league_id IN (
            SELECT league_id FROM league_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own boards" ON boards
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update their own boards" ON boards
    FOR UPDATE USING (auth.uid() = user_id);

-- Delete policy for users to delete their own boards
CREATE POLICY "Users can delete their own boards" ON boards
    FOR DELETE USING (auth.uid() = user_id);

-- Update predictions policies to work with new boards structure
DROP POLICY IF EXISTS "Predictions are viewable by league members" ON predictions;
DROP POLICY IF EXISTS "Users can manage predictions on their boards" ON predictions;

CREATE POLICY "Predictions are viewable by league members" ON predictions
    FOR SELECT USING (
        board_id IN (
            SELECT b.id FROM boards b
            JOIN league_members lm ON lm.league_id = b.league_id
            WHERE lm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage predictions on their boards" ON predictions
    FOR ALL USING (
        board_id IN (SELECT id FROM boards WHERE user_id = auth.uid())
    );
