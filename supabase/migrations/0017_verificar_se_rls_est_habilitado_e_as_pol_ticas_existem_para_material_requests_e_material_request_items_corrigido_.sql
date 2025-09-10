-- Verificar RLS para material_requests
SELECT relrowsecurity FROM pg_class WHERE relname = 'material_requests';

-- Verificar políticas para material_requests
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'material_requests';

-- Verificar RLS para material_request_items
SELECT relrowsecurity FROM pg_class WHERE relname = 'material_request_items';

-- Verificar políticas para material_request_items
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'material_request_items';