ALTER TABLE clients ADD COLUMN lifecycle_stage TEXT DEFAULT 'Lead' CHECK (lifecycle_stage IN ('Lead', 'MQL', 'SQL', 'Ativo', 'Perdido'));
ALTER TABLE clients ADD COLUMN sector TEXT;
ALTER TABLE clients ADD COLUMN persona TEXT;