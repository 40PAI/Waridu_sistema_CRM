-- Inserir o role 'Comercial' se ele não existir
INSERT INTO public.roles (name)
SELECT 'Comercial'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'Comercial');