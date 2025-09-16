import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export interface Service {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setServices(data || []);
    } catch (err) {
      console.error("Error fetching services:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar serviços.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createService = async (serviceData: Omit<Service, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single();

      if (error) throw error;

      setServices(prev => [...prev, data]);
      showSuccess("Serviço criado com sucesso!");
      return data;
    } catch (err) {
      console.error("Error creating service:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar serviço.";
      showError(errorMessage);
      throw err;
    }
  };

  const updateService = async (id: string, updates: Partial<Omit<Service, 'id' | 'created_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setServices(prev => prev.map(service => service.id === id ? data : service));
      showSuccess("Serviço atualizado com sucesso!");
      return data;
    } catch (err) {
      console.error("Error updating service:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar serviço.";
      showError(errorMessage);
      throw err;
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setServices(prev => prev.filter(service => service.id !== id));
      showSuccess("Serviço removido com sucesso!");
    } catch (err) {
      console.error("Error deleting service:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao remover serviço.";
      showError(errorMessage);
      throw err;
    }
  };

  return {
    services,
    loading,
    error,
    createService,
    updateService,
    deleteService,
    refreshServices: fetchServices
  };
};