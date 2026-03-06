-- Add admin access to view all claims (for claims manager)
-- Run drop-admin-policies.sql first if policies already exist

CREATE POLICY "Claims are viewable by league members or admins" ON claims
    FOR SELECT USING (
        -- Admins can see all claims
        (
            SELECT is_admin FROM profiles WHERE id = auth.uid()
        ) = true
        OR
        -- League members can see claims in their leagues
        prediction_id IN (
            SELECT p.id FROM predictions p
            JOIN boards b ON b.id = p.board_id
            JOIN league_members lm ON lm.league_id = b.league_id
            WHERE lm.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins and system can update claims" ON claims
    FOR UPDATE USING (
        -- Admins can update all claims
        (
            SELECT is_admin FROM profiles WHERE id = auth.uid()
        ) = true
        OR
        -- Users can update claims in their leagues
        prediction_id IN (
            SELECT p.id FROM predictions p
            JOIN boards b ON b.id = p.board_id
            JOIN league_members lm ON lm.league_id = b.league_id
            WHERE lm.user_id = auth.uid()
        )
    );

CREATE POLICY "Predictions are viewable by league members or admins" ON predictions
    FOR SELECT USING (
        -- Admins can see all predictions
        (
            SELECT is_admin FROM profiles WHERE id = auth.uid()
        ) = true
        OR
        -- League members can see predictions
        board_id IN (
            SELECT b.id FROM boards b
            JOIN league_members lm ON lm.league_id = b.league_id
            WHERE lm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage predictions or admins can manage all" ON predictions
    FOR ALL USING (
        -- Admins can manage all predictions
        (
            SELECT is_admin FROM profiles WHERE id = auth.uid()
        ) = true
        OR
        -- Users can manage their own board predictions
        board_id IN (SELECT id FROM boards WHERE user_id = auth.uid())
    );

CREATE POLICY "Boards are viewable by league members or admins" ON boards
    FOR SELECT USING (
        -- Admins can see all boards
        (
            SELECT is_admin FROM profiles WHERE id = auth.uid()
        ) = true
        OR
        -- League members can see boards
        league_id IN (
            SELECT league_id FROM league_members WHERE user_id = auth.uid()
        )
        OR
        -- Users can see their own boards
        user_id = auth.uid()
    );
