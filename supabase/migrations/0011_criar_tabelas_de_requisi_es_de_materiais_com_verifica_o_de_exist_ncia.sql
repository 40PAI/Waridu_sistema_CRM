-- Criar tabela de requisições de materiais (se não existir)
CREATE TABLE IF NOT EXISTS public.material_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id INTEGER NOT NULL,
    requested_by_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_by_details JSONB,
    status TEXT NOT NULL DEFAULT 'Pendente',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    decided_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de itens das requisições (se não existir)
CREATE TABLE IF NOT EXISTS public.material_request_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES public.material_requests(id) ON DELETE CASCADE,
    material_id TEXT,
    quantity INTEGER NOT NULL
);