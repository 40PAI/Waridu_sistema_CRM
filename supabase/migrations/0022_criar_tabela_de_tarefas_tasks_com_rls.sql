-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  done BOOLEAN DEFAULT false,
  has_issues BOOLEAN DEFAULT false,
  issue_description TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  event_id INTEGER REFERENCES public.events(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT TO authenticated USING (assigned_to = auth.uid());

CREATE POLICY "Admins can manage all tasks" ON public.tasks
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Coordinators can assign tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'Coordenador'
    )
  );