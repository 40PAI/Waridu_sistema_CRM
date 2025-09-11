-- 1) Tabela de categorias de técnicos
CREATE TABLE IF NOT EXISTS public.technician_category_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT UNIQUE NOT NULL,
  daily_rate NUMERIC NOT NULL CHECK (daily_rate >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.technician_category_rates ENABLE ROW LEVEL SECURITY;

-- Políticas:
-- Leitura: todos autenticados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'technician_category_rates' 
      AND policyname = 'technician_category_rates_select_authenticated'
  ) THEN
    CREATE POLICY "technician_category_rates_select_authenticated"
    ON public.technician_category_rates
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END$$;

-- Insert: Admin e Financeiro
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'technician_category_rates' 
      AND policyname = 'technician_category_rates_insert_admin_financeiro'
  ) THEN
    CREATE POLICY "technician_category_rates_insert_admin_financeiro"
    ON public.technician_category_rates
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('Admin','Financeiro')
      )
    );
  END IF;
END$$;

-- Update: Admin e Financeiro
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'technician_category_rates' 
      AND policyname = 'technician_category_rates_update_admin_financeiro'
  ) THEN
    CREATE POLICY "technician_category_rates_update_admin_financeiro"
    ON public.technician_category_rates
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('Admin','Financeiro')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('Admin','Financeiro')
      )
    );
  END IF;
END$$;

-- Delete: Admin e Financeiro
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'technician_category_rates' 
      AND policyname = 'technician_category_rates_delete_admin_financeiro'
  ) THEN
    CREATE POLICY "technician_category_rates_delete_admin_financeiro"
    ON public.technician_category_rates
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('Admin','Financeiro')
      )
    );
  END IF;
END$$;

-- 2) Coluna de categoria em employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'employees' 
      AND column_name = 'technician_category'
  ) THEN
    ALTER TABLE public.employees
      ADD COLUMN technician_category UUID REFERENCES public.technician_category_rates(id);
  END IF;
END$$;