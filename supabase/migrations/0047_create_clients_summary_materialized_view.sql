-- Create materialized view for client metrics
CREATE MATERIALIZED VIEW clients_summary AS
SELECT
  c.id AS client_id,
  COUNT(e.id) AS projects_count,
  COALESCE(SUM(e.estimated_value), 0) AS total_revenue,
  MAX(comm.date) AS last_contact_at,
  COUNT(CASE WHEN e.pipeline_status = 'Confirmado' THEN 1 END) AS active_projects
FROM clients c
LEFT JOIN events e ON e.client_id = c.id
LEFT JOIN communications comm ON comm.client_id = c.id
GROUP BY c.id;

-- Create index for fast lookup
CREATE INDEX idx_clients_summary_client_id ON clients_summary(client_id);

-- Enable RLS
ALTER MATERIALIZED VIEW clients_summary ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "clients_summary_select_policy" ON clients_summary
FOR SELECT TO authenticated USING (true);

-- Function to refresh the view
CREATE OR REPLACE FUNCTION refresh_clients_summary()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  REFRESH MATERIALIZED VIEW clients_summary;
$$;