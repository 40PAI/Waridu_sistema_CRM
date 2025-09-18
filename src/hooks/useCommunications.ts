import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export interface Communication {
  id: string;
  client_id?: string;
  project_id?: number;
  type: 'email' | 'call' | 'meeting' | 'note';
  date: string;
  subject?: string;
  notes?: string;
  user_id: string;
  created_at: string;
  // provider information (e.g. gmail) — optional, included when synced from provider
  provider?: string;
  provider_meta?: {
    threadId?: string;
    messageId?: string;
    headers?: Record<string, string>;
    [key: string]: any;
  } | null;
  is_internal?: boolean;
}

export const useCommunications = () => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCommunications();
  }, []);

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setCommunications((data || []) as Communication[]);
    } catch (err) {
      console.error("Error fetching communications:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar comunicações.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createCommunication = async (comm: Omit<Communication, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('communications')
        .insert(comm)
        .select()
        .single();

      if (error) throw error;
      setCommunications(prev => [data, ...prev]);
      showSuccess("Comunicação registrada!");
      return data;
    } catch (err) {
      console.error("Error creating communication:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao registrar comunicação.";
      showError(errorMessage);
      throw err;
    }
  };

  return {
    communications,
    loading,
    error,
    createCommunication,
    refreshCommunications: fetchCommunications
  };
};