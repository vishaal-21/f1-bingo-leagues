-- Allow admins to update any user's league_members stats
-- This is needed for race finalization to update cumulative points

CREATE POLICY "Admins can update all league member stats" 
ON league_members
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- Verify the policy was created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'league_members';
