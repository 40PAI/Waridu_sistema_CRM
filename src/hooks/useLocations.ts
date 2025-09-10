import { useState, useEffect } from "react";
import { Location } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedLocations: Location[] = (data || []).map((loc: any) => ({
        id: loc.id,
        name: loc.name
      }));

      setLocations(formattedLocations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      showError("Erro ao carregar localizações.");
    } finally {
      setLoading(false);
    }
  };

  const addLocation = async (name: string) => {
    try {
      const { error } = await supabase
        .from('locations')
        .insert({ name });

      if (error) throw error;

      showSuccess("Localização adicionada com sucesso!");
      fetchLocations(); // Refresh the list
    } catch (error) {
      console.error("Error adding location:", error);
      showError("Erro ao adicionar localização.");
    }
  };

  const updateLocation = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('locations')
        .update({ name })
        .eq('id', id);

      if (error) throw error;

      showSuccess("Localização atualizada com sucesso!");
      fetchLocations(); // Refresh the list
    } catch (error) {
      console.error("Error updating location:", error);
      showError("Erro ao atualizar localização.");
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      // Check if this is the last location
      if (locations.length <= 1) {
        showError("Não é possível remover a única localização existente.");
        return;
      }

      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showSuccess("Localização removida com sucesso!");
      fetchLocations(); // Refresh the list
    } catch (error) {
      console.error("Error deleting location:", error);
      showError("Erro ao remover localização.");
    }
  };

  return {
    locations,
    loading,
    addLocation,
    updateLocation,
    deleteLocation,
    refreshLocations: fetchLocations
  };
};