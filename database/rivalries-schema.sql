-- Rivalries Feature Schema
-- Enables 1v1 head-to-head competition between users

-- ============================================
-- RIVALRIES TABLE
-- ============================================
-- Tracks rival relationships between two users
CREATE TABLE IF NOT EXISTS rivalries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'declined', 'ended'
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique rivalry pairs (regardless of order)
  CONSTRAINT unique_rivalry_pair CHECK (user1_id < user2_id),
  CONSTRAINT different_users CHECK (user1_id != user2_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rivalries_user1 ON rivalries(user1_id);
CREATE INDEX IF NOT EXISTS idx_rivalries_user2 ON rivalries(user2_id);
CREATE INDEX IF NOT EXISTS idx_rivalries_status ON rivalries(status);

-- ============================================
-- RIVAL APPROVALS TABLE
-- ============================================
-- Tracks approval/denial of predictions in rival mode
-- Replaces the claims/voting system for 1v1 competitions
CREATE TABLE IF NOT EXISTS rival_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rivalry_id UUID NOT NULL REFERENCES rivalries(id) ON DELETE CASCADE,
  race_id VARCHAR(50) NOT NULL,
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  approved_by UUID NOT NULL REFERENCES auth.users(id), -- The rival marking this prediction
  approved BOOLEAN NOT NULL, -- true = correct, false = incorrect
  notes TEXT, -- Optional: reason for approval/denial
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each rival can only approve each prediction once
  CONSTRAINT unique_rival_approval UNIQUE (rivalry_id, prediction_id, approved_by)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rival_approvals_rivalry ON rival_approvals(rivalry_id);
CREATE INDEX IF NOT EXISTS idx_rival_approvals_race ON rival_approvals(race_id);
CREATE INDEX IF NOT EXISTS idx_rival_approvals_prediction ON rival_approvals(prediction_id);

-- ============================================
-- RIVAL RESULTS TABLE
-- ============================================
-- Stores calculated results for each rivalry per race
CREATE TABLE IF NOT EXISTS rival_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rivalry_id UUID NOT NULL REFERENCES rivalries(id) ON DELETE CASCADE,
  race_id VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  board_id UUID REFERENCES boards(id),
  points INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  bingos INTEGER DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_rival_result UNIQUE (rivalry_id, race_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_rival_results_rivalry_race ON rival_results(rivalry_id, race_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Users can view rivalries where they are involved
ALTER TABLE rivalries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rivalries"
  ON rivalries FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create rivalries (send invitations)"
  ON rivalries FOR INSERT
  WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "Users can update their rivalries (accept/decline)"
  ON rivalries FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Rival approvals policies
ALTER TABLE rival_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approvals for their rivalries"
  ON rival_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rivalries
      WHERE rivalries.id = rival_approvals.rivalry_id
      AND (rivalries.user1_id = auth.uid() OR rivalries.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can create approvals for rival's predictions"
  ON rival_approvals FOR INSERT
  WITH CHECK (
    approved_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM rivalries
      WHERE rivalries.id = rivalry_id
      AND rivalries.status = 'active'
      AND (rivalries.user1_id = auth.uid() OR rivalries.user2_id = auth.uid())
    )
  );

-- Rival results policies
ALTER TABLE rival_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view results for their rivalries"
  ON rival_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rivalries
      WHERE rivalries.id = rival_results.rivalry_id
      AND (rivalries.user1_id = auth.uid() OR rivalries.user2_id = auth.uid())
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get the other user in a rivalry
CREATE OR REPLACE FUNCTION get_rival_user_id(rivalry_id UUID, current_user_id UUID)
RETURNS UUID AS $$
  SELECT CASE
    WHEN user1_id = current_user_id THEN user2_id
    WHEN user2_id = current_user_id THEN user1_id
    ELSE NULL
  END
  FROM rivalries
  WHERE id = rivalry_id;
$$ LANGUAGE sql STABLE;
