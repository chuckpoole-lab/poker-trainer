-- Flagged Hands table
-- Stores hands where testers/admins want to challenge the recommendation
-- Reviewed in the admin dashboard under a "Flagged Hands" tab

CREATE TABLE IF NOT EXISTS flagged_hands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  flagged_at TIMESTAMPTZ DEFAULT now(),

  -- Hand context
  hand_code TEXT NOT NULL,           -- e.g. "83s", "A2o"
  position TEXT NOT NULL,            -- e.g. "Button", "Under the Gun"
  stack TEXT NOT NULL,               -- e.g. "20 blinds"
  situation TEXT NOT NULL,           -- e.g. "Everyone folds to you..."
  card1_rank TEXT NOT NULL,
  card1_suit TEXT NOT NULL,
  card2_rank TEXT NOT NULL,
  card2_suit TEXT NOT NULL,

  -- What the app recommended vs what user chose
  app_action TEXT NOT NULL,          -- e.g. "Fold", "Raise", "All-in"
  user_action TEXT,                  -- what the user actually picked (null if flagged before choosing)
  explanation TEXT NOT NULL,         -- the coaching tip text

  -- User feedback
  note TEXT DEFAULT '',              -- optional note from the flagger
  is_bonus BOOLEAN DEFAULT false,    -- was this a bonus hand or daily?

  -- Review status
  status TEXT DEFAULT 'open',        -- open, agreed, adjusted, dismissed
  reviewer_note TEXT DEFAULT '',     -- admin response
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- RLS: users can insert their own flags, admins can read all
ALTER TABLE flagged_hands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can flag hands"
  ON flagged_hands FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own flags"
  ON flagged_hands FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all flags"
  ON flagged_hands FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update flags"
  ON flagged_hands FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Allow anonymous/guest flagging too
CREATE POLICY "Anon can flag hands"
  ON flagged_hands FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Index for admin dashboard queries
CREATE INDEX idx_flagged_hands_status ON flagged_hands(status, flagged_at DESC);
CREATE INDEX idx_flagged_hands_hand ON flagged_hands(hand_code, position);
