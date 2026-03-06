-- F1 Bingo Leagues Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users with username and display info)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL CHECK (length(username) >= 3 AND length(username) <= 30),
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leagues table
CREATE TABLE IF NOT EXISTS leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    season_year INTEGER NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    scoring_mode TEXT NOT NULL CHECK (scoring_mode IN ('classic', 'points')),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- League members table
CREATE TABLE IF NOT EXISTS league_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cumulative_points INTEGER DEFAULT 0,
    total_correct_predictions INTEGER DEFAULT 0,
    total_bingos INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(league_id, user_id)
);

-- Races table
CREATE TABLE IF NOT EXISTS races (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    scheduled_start_time TIMESTAMPTZ NOT NULL,
    lock_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('upcoming', 'locked', 'live', 'finished')),
    country TEXT NOT NULL,
    flag_emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boards table (user's bingo board for a race)
CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(race_id, user_id)
);

-- Predictions table (individual squares on a board)
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    position_index INTEGER NOT NULL,
    marked BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (position_index >= 0 AND position_index < 25)
);

-- Claims table (claims for predictions)
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    claimed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    approvals_count INTEGER DEFAULT 0,
    rejects_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claim votes table (voting on claims)
CREATE TABLE IF NOT EXISTS claim_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(claim_id, user_id)
);

-- Race scores table (final scores for a race)
CREATE TABLE IF NOT EXISTS race_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    race_points INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    has_bingo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(race_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leagues_created_by ON leagues(created_by);
CREATE INDEX IF NOT EXISTS idx_leagues_invite_code ON leagues(invite_code);
CREATE INDEX IF NOT EXISTS idx_league_members_league_id ON league_members(league_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user_id ON league_members(user_id);
CREATE INDEX IF NOT EXISTS idx_races_league_id ON races(league_id);
CREATE INDEX IF NOT EXISTS idx_boards_race_id ON boards(race_id);
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_board_id ON predictions(board_id);
CREATE INDEX IF NOT EXISTS idx_claims_prediction_id ON claims(prediction_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimed_by ON claims(claimed_by);
CREATE INDEX IF NOT EXISTS idx_claim_votes_claim_id ON claim_votes(claim_id);
CREATE INDEX IF NOT EXISTS idx_race_scores_race_id ON race_scores(race_id);

-- Create a function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_username TEXT;
BEGIN
    -- Get username from metadata or generate from email
    user_username := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
        SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Insert profile
    INSERT INTO profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        user_username,
        user_username,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- If username exists, append random suffix
        INSERT INTO profiles (id, username, display_name, avatar_url)
        VALUES (
            NEW.id,
            user_username || '_' || substr(md5(random()::text), 1, 6),
            user_username,
            NEW.raw_user_meta_data->>'avatar_url'
        );
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail the auth
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for leagues
CREATE POLICY "Leagues are viewable by members" ON leagues
    FOR SELECT USING (
        id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create leagues" ON leagues
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "League creators can update their leagues" ON leagues
    FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for league_members
CREATE POLICY "League members are viewable by league members" ON league_members
    FOR SELECT USING (
        league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can join leagues" ON league_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for races
CREATE POLICY "Races are viewable by league members" ON races
    FOR SELECT USING (
        league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid())
    );

CREATE POLICY "League creators can manage races" ON races
    FOR ALL USING (
        league_id IN (SELECT id FROM leagues WHERE created_by = auth.uid())
    );

-- RLS Policies for boards
CREATE POLICY "Boards are viewable by league members" ON boards
    FOR SELECT USING (
        race_id IN (
            SELECT r.id FROM races r
            JOIN league_members lm ON lm.league_id = r.league_id
            WHERE lm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own boards" ON boards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards" ON boards
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for predictions
CREATE POLICY "Predictions are viewable by league members" ON predictions
    FOR SELECT USING (
        board_id IN (
            SELECT b.id FROM boards b
            JOIN races r ON r.id = b.race_id
            JOIN league_members lm ON lm.league_id = r.league_id
            WHERE lm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage predictions on their boards" ON predictions
    FOR ALL USING (
        board_id IN (SELECT id FROM boards WHERE user_id = auth.uid())
    );

-- RLS Policies for claims
CREATE POLICY "Claims are viewable by league members" ON claims
    FOR SELECT USING (
        prediction_id IN (
            SELECT p.id FROM predictions p
            JOIN boards b ON b.id = p.board_id
            JOIN races r ON r.id = b.race_id
            JOIN league_members lm ON lm.league_id = r.league_id
            WHERE lm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create claims" ON claims
    FOR INSERT WITH CHECK (auth.uid() = claimed_by);

-- RLS Policies for claim_votes
CREATE POLICY "Votes are viewable by league members" ON claim_votes
    FOR SELECT USING (
        claim_id IN (
            SELECT c.id FROM claims c
            JOIN predictions p ON p.id = c.prediction_id
            JOIN boards b ON b.id = p.board_id
            JOIN races r ON r.id = b.race_id
            JOIN league_members lm ON lm.league_id = r.league_id
            WHERE lm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can vote on claims" ON claim_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for race_scores
CREATE POLICY "Race scores are viewable by league members" ON race_scores
    FOR SELECT USING (
        race_id IN (
            SELECT r.id FROM races r
            JOIN league_members lm ON lm.league_id = r.league_id
            WHERE lm.user_id = auth.uid()
        )
    );

CREATE POLICY "League creators can manage race scores" ON race_scores
    FOR ALL USING (
        race_id IN (
            SELECT r.id FROM races r
            JOIN leagues l ON l.id = r.league_id
            WHERE l.created_by = auth.uid()
        )
    );
