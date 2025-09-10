-- Verificar se a tabela material_requests existe e sua estrutura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'material_requests'
ORDER BY ordinal_position;

-- Verificar se a tabela material_request_items existe e sua estrutura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'material_request_items'
ORDER BY ordinal_position;