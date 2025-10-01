-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks" ON tasks;

-- Enable RLS on tasks table if not already enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Users can view their own tasks
CREATE POLICY "Users can view their own tasks" ON tasks 
FOR SELECT TO authenticated USING (assigned_to = auth.uid());

-- Policy for INSERT: Only Admins and Coordenadores can create tasks
CREATE POLICY "Admins and Coordenadores can create tasks" ON tasks 
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('Admin', 'Coordenador')
  )
);

-- Policy for UPDATE: Users can update their own tasks, Admins can update all
CREATE POLICY "Users can update their own tasks" ON tasks 
FOR UPDATE TO authenticated USING (
  assigned_to = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'Admin'
  )
);

-- Policy for DELETE: Only Admins can delete tasks
CREATE POLICY "Admins can delete tasks" ON tasks 
FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'Admin'
  )
);