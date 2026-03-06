-- Drop existing admin policies before recreating them

DROP POLICY IF EXISTS "Claims are viewable by league members or admins" ON claims;
DROP POLICY IF EXISTS "Claims are viewable by league members" ON claims;
DROP POLICY IF EXISTS "Admins and system can update claims" ON claims;
DROP POLICY IF EXISTS "System can update claims" ON claims;

DROP POLICY IF EXISTS "Predictions are viewable by league members or admins" ON predictions;
DROP POLICY IF EXISTS "Predictions are viewable by league members" ON predictions;
DROP POLICY IF EXISTS "Users can manage predictions or admins can manage all" ON predictions;
DROP POLICY IF EXISTS "Users can manage predictions on their boards" ON predictions;

DROP POLICY IF EXISTS "Boards are viewable by league members or admins" ON boards;
DROP POLICY IF EXISTS "Boards are viewable by league members" ON boards;
