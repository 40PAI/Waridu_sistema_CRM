CREATE OR REPLACE FUNCTION update_client_lifecycle()
RETURNS TRIGGER AS $$
BEGIN
  -- If project confirmed, set client to 'Ativo'
  IF NEW.pipeline_status = 'Confirmado' AND OLD.pipeline_status != 'Confirmado' THEN
    UPDATE clients SET lifecycle_stage = 'Ativo', updated_at = NOW() WHERE id = NEW.client_id;
  END IF;
  
  -- If no projects in 12 months, set to 'Perdido' (simplified check)
  IF NEW.pipeline_status = 'Cancelado' THEN
    UPDATE clients SET lifecycle_stage = 'Perdido', updated_at = NOW() WHERE id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_lifecycle
AFTER UPDATE ON events
FOR EACH ROW
WHEN (OLD.pipeline_status IS DISTINCT FROM NEW.pipeline_status)
EXECUTE FUNCTION update_client_lifecycle();