-- Create events table
CREATE TABLE public.events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  location TEXT,
  start_time TIME,
  end_time TIME,
  revenue NUMERIC,
  status TEXT DEFAULT 'Planejado',
  description TEXT,
  technician_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Events are viewable by authenticated users" ON public.events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and Coordinators can insert events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('Admin', 'Coordenador')
    )
  );

CREATE POLICY "Admins and Coordinators can update events" ON public.events
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('Admin', 'Coordenador')
    )
  );

CREATE POLICY "Admins can delete events" ON public.events
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );