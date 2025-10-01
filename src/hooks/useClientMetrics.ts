import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClientMetrics {
  projectsCount: number;
  totalRevenue: number;
  lastContactAt: string | null;
  activeProjects: number;
}

export const useClientMetrics = (clientId: string) => {
  const [metrics, setMetrics] = useState<ClientMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!clientId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('clients_summary')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (error) {
        console.error("Error fetching client metrics:", error);
        setMetrics(null);
      } else {
        setMetrics(data);
      }
      setLoading(false);
    };

    fetchMetrics();
  }, [clientId]);

  return { metrics, loading };
};