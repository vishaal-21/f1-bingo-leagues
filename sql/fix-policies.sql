-- Fix infinite recursion in league_members policies
-- Run this in Supabase SQL Editor

-- Drop existing problematic policies
DROP POLICY IF EXISTS "League members are viewable by league members" ON league_members;
DROP POLICY IF EXISTS "Users can join leagues" ON league_members;

-- Simpler policies that don't cause recursion
-- Allow users to view league members for any league (public read)
-- This avoids the self-referencing query that causes infinite recursion
CREATE POLICY "Anyone can view league members" 
    ON league_members FOR SELECT 
    USING (true);

-- Allow users to insert themselves as league members
CREATE POLICY "Users can join leagues" 
    ON league_members FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own membership info
CREATE POLICY "Users can update own membership" 
    ON league_members FOR UPDATE 
    USING (auth.uid() = user_id);

-- Drop and recreate leagues policies to avoid recursion
DROP POLICY IF EXISTS "Leagues are viewable by members" ON leagues;
DROP POLICY IF EXISTS "Users can create leagues" ON leagues;
DROP POLICY IF EXISTS "League creators can update their leagues" ON leagues;

-- Allow anyone to view leagues (simpler approach)
CREATE POLICY "Anyone can view leagues" 
    ON leagues FOR SELECT 
    USING (true);

-- Allow authenticated users to create leagues
CREATE POLICY "Users can create leagues" 
    ON leagues FOR INSERT 
    WITH CHECK (auth.uid() = created_by);

-- Allow league creators to update their leagues
CREATE POLICY "League creators can update their leagues" 
    ON leagues FOR UPDATE 
    USING (auth.uid() = created_by);
