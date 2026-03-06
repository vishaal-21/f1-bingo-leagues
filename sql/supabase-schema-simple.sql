-- F1 Bingo Leagues Database Schema - SIMPLIFIED VERSION
-- Run this in your Supabase SQL Editor
-- This version handles profile creation in the app code instead of triggers

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Profiles table (extends auth.users with username and display info)
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL CHECK (length(username) >= 3 AND length(username) <= 30),
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles - Allow anyone to read, users can insert their own profile
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
    ON profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Leagues table
DROP TABLE IF EXISTS leagues CASCADE;
CREATE TABLE leagues (
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
DROP TABLE IF EXISTS league_members CASCADE;
CREATE TABLE league_members (
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
DROP TABLE IF EXISTS races CASCADE;
CREATE TABLE races (
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
DROP TABLE IF EXISTS boards CASCADE;
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(race_id, user_id)
);

-- Predictions table (individual squares on a board)
DROP TABLE IF EXISTS predictions CASCADE;
CREATE TABLE predictions (
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
DROP TABLE IF EXISTS claims CASCADE;
CREATE TABLE claims (
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
DROP TABLE IF EXISTS claim_votes CASCADE;
CREATE TABLE claim_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(claim_id, user_id)
);

-- Race scores table (final scores for a race)
DROP TABLE IF EXISTS race_scores CASCADE;
CREATE TABLE race_scores (
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
CREATE INDEX idx_leagues_created_by ON leagues(created_by);
CREATE INDEX idx_leagues_invite_code ON leagues(invite_code);
CREATE INDEX idx_league_members_league_id ON league_members(league_id);
CREATE INDEX idx_league_members_user_id ON league_members(user_id);
CREATE INDEX idx_races_league_id ON races(league_id);
CREATE INDEX idx_boards_race_id ON boards(race_id);
CREATE INDEX idx_boards_user_id ON boards(user_id);
CREATE INDEX idx_predictions_board_id ON predictions(board_id);
CREATE INDEX idx_claims_prediction_id ON claims(prediction_id);
CREATE INDEX idx_claims_claimed_by ON claims(claimed_by);
CREATE INDEX idx_claim_votes_claim_id ON claim_votes(claim_id);
CREATE INDEX idx_race_scores_race_id ON race_scores(race_id);

-- Enable Row Level Security (RLS)
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leagues
DROP POLICY IF EXISTS "Leagues are viewable by members" ON leagues;
DROP POLICY IF EXISTS "Users can create leagues" ON leagues;
DROP POLICY IF EXISTS "League creators can update their leagues" ON leagues;

CREATE POLICY "Anyone can view leagues" ON leagues
    FOR SELECT USING (true);

CREATE POLICY "Users can create leagues" ON leagues
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "League creators can update their leagues" ON leagues
    FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for league_members
DROP POLICY IF EXISTS "League members are viewable by league members" ON league_members;
DROP POLICY IF EXISTS "Users can join leagues" ON league_members;

CREATE POLICY "Anyone can view league members" ON league_members
    FOR SELECT USING (true);

CREATE POLICY "Users can join leagues" ON league_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own membership" ON league_members
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for races
DROP POLICY IF EXISTS "Races are viewable by league members" ON races;
DROP POLICY IF EXISTS "League creators can manage races" ON races;

CREATE POLICY "Races are viewable by league members" ON races
    FOR SELECT USING (
        league_id IN (SELECT league_id FROM league_members WHERE user_id = auth.uid())
    );

CREATE POLICY "League creators can manage races" ON races
    FOR ALL USING (
        league_id IN (SELECT id FROM leagues WHERE created_by = auth.uid())
    );

-- RLS Policies for boards
DROP POLICY IF EXISTS "Boards are viewable by league members" ON boards;
DROP POLICY IF EXISTS "Users can create their own boards" ON boards;
DROP POLICY IF EXISTS "Users can update their own boards" ON boards;

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
DROP POLICY IF EXISTS "Predictions are viewable by league members" ON predictions;
DROP POLICY IF EXISTS "Users can manage predictions on their boards" ON predictions;

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
DROP POLICY IF EXISTS "Claims are viewable by league members" ON claims;
DROP POLICY IF EXISTS "Users can create claims" ON claims;

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
DROP POLICY IF EXISTS "Votes are viewable by league members" ON claim_votes;
DROP POLICY IF EXISTS "Users can vote on claims" ON claim_votes;

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
DROP POLICY IF EXISTS "Race scores are viewable by league members" ON race_scores;
DROP POLICY IF EXISTS "League creators can manage race scores" ON race_scores;

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
