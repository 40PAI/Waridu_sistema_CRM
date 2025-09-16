import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export interface Client {
  id: string;
  name: string;
  nif?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setClients(data || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar clientes.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (error) throw error;

      setClients(prev => [...prev, data]);
      showSuccess("Cliente criado com sucesso!");
      return data;
    } catch (err) {
      console.error("Error creating client:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar cliente.";
      showError(errorMessage);
      throw err;
    }
  };

  const updateClient = async (id: string, updates: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setClients(prev => prev.map(client => client.id === id ? data : client));
      showSuccess("Cliente atualizado com sucesso!");
      return data;
    } catch (err) {
      console.error("Error updating client:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar cliente.";
      showError(errorMessage);
      throw err;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClients(prev => prev.filter(client => client.id !== id));
      showSuccess("Cliente removido com sucesso!");
    } catch (err) {
      console.error("Error deleting client:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao remover cliente.";
      showError(errorMessage);
      throw err;
    }
  };

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    refreshClients: fetchClients
  };
};