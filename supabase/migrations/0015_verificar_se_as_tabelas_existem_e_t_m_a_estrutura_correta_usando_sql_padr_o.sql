-- Verificar se a tabela material_requests existe
SELECT EXISTS (
   SELECT 1
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'material_requests'
);

-- Verificar a estrutura da tabela material_requests
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'material_requests'
ORDER BY ordinal_position;

-- Verificar se a tabela material_request_items existe
SELECT EXISTS (
   SELECT 1
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'material_request_items'
);

-- Verificar a estrutura da tabela material_request_items
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'material_request_items'
ORDER BY ordinal_position;