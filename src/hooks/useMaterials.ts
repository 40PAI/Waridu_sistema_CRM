import { useState, useEffect, useMemo } from "react";
import { PageMaterial, InventoryMaterial, MaterialStatus, AllocationHistoryEntry } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export const useMaterials = () => {
  const [materials, setMaterials] = useState<InventoryMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch materials with their locations
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select(`
          id,
          name,
          status,
          category,
          description,
          material_locations(location_id, quantity)
        `)
        .order('name', { ascending: true });

      if (materialsError) throw materialsError;

      // Fetch all locations for reference
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name');

      if (locationsError) throw locationsError;

      // Format materials with location distribution
      const formattedMaterials: InventoryMaterial[] = (materialsData || []).map((mat: any) => {
        const locations: Record<string, number> = {};
        
        // Create a map of all locations with 0 quantity
        locationsData?.forEach((loc: any) => {
          locations[loc.id] = 0;
        });
        
        // Update with actual quantities
        mat.material_locations?.forEach((ml: any) => {
          locations[ml.location_id] = ml.quantity;
        });

        return {
          id: mat.id,
          name: mat.name,
          status: mat.status as MaterialStatus,
          category: mat.category,
          description: mat.description,
          locations
        };
      });

      setMaterials(formattedMaterials);
    } catch (error) {
      console.error("Error fetching materials:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar materiais.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveMaterial = async (materialData: Omit<PageMaterial, 'id' | 'locations'> & { id?: string }) => {
    try {
      if (materialData.id) {
        // Update existing material
        const { error } = await supabase
          .from('materials')
          .update({
            name: materialData.name,
            category: materialData.category,
            status: materialData.status,
            description: materialData.description
          })
          .eq('id', materialData.id);

        if (error) throw error;
        showSuccess("Material atualizado com sucesso!");
      } else {
        // Create new material
        const { data, error } = await supabase
          .from('materials')
          .insert({
            name: materialData.name,
            category: materialData.category,
            status: materialData.status,
            description: materialData.description
          })
          .select()
          .single();

        if (error) throw error;
        showSuccess("Material adicionado com sucesso!");
        return data; // Return the saved material for addInitialStock
      }

      fetchMaterials(); // Refresh the list
    } catch (error) {
      console.error("Error saving material:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar material.";
      showError(errorMessage);
    }
  };

  const addInitialStock = async (materialId: string, locationId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        showError("Quantidade deve ser maior que 0.");
        return;
      }

      // Check if entry already exists
      const { data: existing, error: checkError } = await supabase
        .from('material_locations')
        .select('quantity')
        .eq('material_id', materialId)
        .eq('location_id', locationId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('material_locations')
          .update({ quantity: existing.quantity + quantity })
          .eq('material_id', materialId)
          .eq('location_id', locationId);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('material_locations')
          .insert({
            material_id: materialId,
            location_id: locationId,
            quantity
          });

        if (error) throw error;
      }

      showSuccess("Estoque inicial adicionado!");
      fetchMaterials(); // Refresh
    } catch (error) {
      console.error("Error adding initial stock:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao adicionar estoque inicial.";
      showError(errorMessage);
    }
  };

  const transferMaterial = async (materialId: string, fromLocationId: string, toLocationId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        showError("Quantidade inválida para transferência.");
        return;
      }

      // Read source quantity using maybeSingle to avoid depending on internal error codes
      const { data: sourceData, error: sourceError } = await supabase
        .from('material_locations')
        .select('quantity')
        .eq('material_id', materialId)
        .eq('location_id', fromLocationId)
        .maybeSingle();

      if (sourceError) throw sourceError;

      const currentSourceQty = sourceData?.quantity || 0;
      if (quantity > currentSourceQty) {
        showError("Quantidade inválida para transferência.");
        return;
      }

      // Update source location: if resulting quantity is 0 delete row, otherwise update
      if (currentSourceQty === quantity) {
        const { error: deleteError } = await supabase
          .from('material_locations')
          .delete()
          .eq('material_id', materialId)
          .eq('location_id', fromLocationId);

        if (deleteError) throw deleteError;
      } else {
        const { error: updateError } = await supabase
          .from('material_locations')
          .update({ quantity: currentSourceQty - quantity })
          .eq('material_id', materialId)
          .eq('location_id', fromLocationId);

        if (updateError) throw updateError;
      }

      // Destination: try to read an existing row
      const { data: destData, error: destError } = await supabase
        .from('material_locations')
        .select('quantity')
        .eq('material_id', materialId)
        .eq('location_id', toLocationId)
        .maybeSingle();

      if (destError) throw destError;

      const currentDestQty = destData?.quantity || 0;
      const newDestQty = currentDestQty + quantity;

      if (destData) {
        const { error: updateError } = await supabase
          .from('material_locations')
          .update({ quantity: newDestQty })
          .eq('material_id', materialId)
          .eq('location_id', toLocationId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('material_locations')
          .insert({
            material_id: materialId,
            location_id: toLocationId,
            quantity: newDestQty
          });

        if (insertError) throw insertError;
      }

      showSuccess("Transferência realizada com sucesso!");
      fetchMaterials(); // Refresh the list
    } catch (error) {
      console.error("Error transferring material:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao realizar transferência.";
      showError(errorMessage);
    }
  };

  const fetchAllocationHistory = async (): Promise<AllocationHistoryEntry[]> => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, name, start_date, status, roster')
        .eq('status', 'Concluído')
        .order('start_date', { ascending: false })
        .limit(50);

      if (eventsError) throw eventsError;

      const history: AllocationHistoryEntry[] = (eventsData || [])
        .filter(event => event.roster && event.roster.materials && Object.keys(event.roster.materials).length > 0)
        .map(event => ({
          id: event.id.toString(),
          date: new Date(event.start_date).toLocaleDateString('pt-BR'),
          eventName: event.name,
          materials: event.roster.materials
        }));

      return history;
    } catch (error) {
      console.error("Error fetching allocation history:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar histórico.";
      showError(errorMessage);
      return [];
    }
  };

  const pageMaterials: PageMaterial[] = useMemo(() => materials.map(m => ({
    id: m.id,
    name: m.name,
    category: m.category,
    status: m.status,
    description: m.description,
    locations: m.locations,
    quantity: Object.values(m.locations).reduce((a, b) => a + b, 0),
  })), [materials]);

  return {
    materials: pageMaterials,
    rawMaterials: materials,
    loading,
    error,
    saveMaterial,
    addInitialStock,
    transferMaterial,
    fetchAllocationHistory,
    refreshMaterials: fetchMaterials
  };
};