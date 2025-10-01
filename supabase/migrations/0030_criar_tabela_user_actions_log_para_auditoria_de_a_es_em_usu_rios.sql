CREATE TABLE IF NOT EXISTS user_actions_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL CHECK (action_type IN ('invite', 'promote', 'ban', 'delete')),
  actor_id UUID NOT NULL REFERENCES profiles(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_email TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE user_actions_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_actions_log_select_admin" ON user_actions_log FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'));
CREATE POLICY "user_actions_log_insert_admin" ON user_actions_log FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'));