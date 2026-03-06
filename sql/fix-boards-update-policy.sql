-- Fix boards UPDATE policy to include WITH CHECK clause
-- This ensures users can update their own board points

DROP POLICY IF EXISTS "Users can update their own boards" ON boards;

CREATE POLICY "Users can update their own boards" ON boards
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Verify the policy
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'boards' AND cmd = 'UPDATE';
