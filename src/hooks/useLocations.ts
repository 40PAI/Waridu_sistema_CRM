import { useState, useEffect, useMemo } from "react";
import { Location } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
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
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar localizações.";
      setError(errorMessage);
      showError(errorMessage);
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
      const errorMessage = error instanceof Error ? error.message : "Erro ao adicionar localização.";
      showError(errorMessage);
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
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar localização.";
      showError(errorMessage);
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
      const errorMessage = error instanceof Error ? error.message : "Erro ao remover localização.";
      showError(errorMessage);
    }
  };

  const locationsById = useMemo(() => {
    const map: Record<string, Location> = {};
    locations.forEach(location => {
      map[location.id] = location;
    });
    return map;
  }, [locations]);

  return {
    locations,
    locationsById,
    loading,
    error,
    addLocation,
    updateLocation,
    deleteLocation,
    refreshLocations: fetchLocations
  };
};