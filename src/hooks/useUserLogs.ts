import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserLog {
  id: string;
  action_type: string;
  actor_name: string;
  target_email: string | null;
  details: any;
  created_at: string;
}

export const useUserLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) {
        setLogs([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_actions_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const formatted = await Promise.all(
          (data || []).map(async (row: any) => {
            let actorName = 'Sistema';
            if (row.actor_id) {
              const { data: p, error: pe } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', row.actor_id)
                .maybeSingle();
              if (!pe && p) {
                actorName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Usuário';
              }
            }
            return {
              id: row.id,
              action_type: row.action_type,
              actor_name: actorName,
              target_email: row.target_email ?? null,
              details: row.details,
              created_at: row.created_at,
            } as UserLog;
          })
        );

        setLogs(formatted);
      } catch (e) {
        console.error('Error fetching user logs:', e);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user]);

  return { logs, loading };
};