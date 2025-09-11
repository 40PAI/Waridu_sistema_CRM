import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

export interface UserActionLog {
  id: string;
  action_type: 'invite' | 'promote' | 'ban' | 'delete';
  actor_name: string;
  target_email: string;
  details: any;
  created_at: string;
}

export const useUserLogs = () => {
  const [logs, setLogs] = useState<UserActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('user_actions_log')
        .select(`
          id,
          action_type,
          details,
          created_at,
          profiles!actor_id(first_name, last_name),
          auth.users!target_user_id(email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedLogs: UserActionLog[] = (data || []).map((log: any) => ({
        id: log.id,
        action_type: log.action_type,
        actor_name: `${log.profiles?.first_name || ''} ${log.profiles?.last_name || ''}`.trim() || 'Sistema',
        target_email: log['auth.users']?.email || 'Desconhecido',
        details: log.details,
        created_at: log.created_at,
      }));

      setLogs(formattedLogs);
    } catch (err) {
      console.error("Error fetching logs:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar logs.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    logs,
    loading,
    error,
    refreshLogs: fetchLogs,
  };
};