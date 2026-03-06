-- Fix claims and claim_votes RLS policies to work with updated boards schema

-- RLS Policies for claims
DROP POLICY IF EXISTS "Claims are viewable by league members" ON claims;
DROP POLICY IF EXISTS "Users can create claims" ON claims;
DROP POLICY IF EXISTS "Users can update claims" ON claims;

CREATE POLICY "Claims are viewable by league members" ON claims
    FOR SELECT USING (
        prediction_id IN (
            SELECT p.id FROM predictions p
            JOIN boards b ON b.id = p.board_id
            JOIN league_members lm ON lm.league_id = b.league_id
            WHERE lm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create claims" ON claims
    FOR INSERT WITH CHECK (
        auth.uid() = claimed_by
        AND prediction_id IN (
            SELECT p.id FROM predictions p
            JOIN boards b ON b.id = p.board_id
            JOIN league_members lm ON lm.league_id = b.league_id
            WHERE lm.user_id = auth.uid()
        )
    );

CREATE POLICY "System can update claims" ON claims
    FOR UPDATE USING (
        prediction_id IN (
            SELECT p.id FROM predictions p
            JOIN boards b ON b.id = p.board_id
            JOIN league_members lm ON lm.league_id = b.league_id
            WHERE lm.user_id = auth.uid()
        )
    );

-- RLS Policies for claim_votes
DROP POLICY IF EXISTS "Votes are viewable by league members" ON claim_votes;
DROP POLICY IF EXISTS "Users can vote on claims" ON claim_votes;

CREATE POLICY "Votes are viewable by league members" ON claim_votes
    FOR SELECT USING (
        claim_id IN (
            SELECT c.id FROM claims c
            JOIN predictions p ON p.id = c.prediction_id
            JOIN boards b ON b.id = p.board_id
            JOIN league_members lm ON lm.league_id = b.league_id
            WHERE lm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can vote on claims" ON claim_votes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND claim_id IN (
            SELECT c.id FROM claims c
            JOIN predictions p ON p.id = c.prediction_id
            JOIN boards b ON b.id = p.board_id
            JOIN league_members lm ON lm.league_id = b.league_id
            WHERE lm.user_id = auth.uid()
        )
    );
