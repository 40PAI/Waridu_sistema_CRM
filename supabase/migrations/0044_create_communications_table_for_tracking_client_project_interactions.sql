CREATE TABLE communications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'call', 'meeting', 'note')),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subject TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view communications for their clients/projects" ON communications FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE id = client_id) OR
  project_id IN (SELECT id FROM events WHERE id = project_id)
);
CREATE POLICY "Users can insert communications" ON communications FOR INSERT WITH CHECK (auth.uid() = user_id);