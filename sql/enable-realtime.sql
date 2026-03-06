-- Enable Realtime for claims, claim_votes, predictions, and league_members tables
-- This allows real-time subscriptions to work

-- Enable realtime on claims table
ALTER PUBLICATION supabase_realtime ADD TABLE claims;

-- Enable realtime on claim_votes table
ALTER PUBLICATION supabase_realtime ADD TABLE claim_votes;

-- Enable realtime on predictions table
ALTER PUBLICATION supabase_realtime ADD TABLE predictions;

-- Enable realtime on league_members table
ALTER PUBLICATION supabase_realtime ADD TABLE league_members;

-- Verify realtime is enabled (optional - run this to check)
-- SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
