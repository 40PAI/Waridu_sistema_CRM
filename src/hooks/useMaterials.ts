import { useState, useEffect, useMemo } from "react";
import { PageMaterial, InventoryMaterial, MaterialStatus } from "@/types";
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

  const saveMaterial = async (materialData: Omit<PageMaterial, 'id' | 'locations'> & { id?: string }): Promise<PageMaterial> => {
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
        return { id: materialData.id, ...materialData };
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
        return { ...data, locations: {}, quantity: 0 } as PageMaterial;
      }
    } catch (error) {
      console.error("Error saving material:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar material.";
      showError(errorMessage);
      throw error;
    }
  };

  const deleteMaterial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showSuccess("Material removido com sucesso!");
      fetchMaterials(); // Refresh the list
    } catch (error) {
      console.error("Error deleting material:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao remover material.";
      showError(errorMessage);
    }
  };

  const addInitialStock = async (materialId: string, locationId: string, quantity: number) => {
    try {
      console.log("addInitialStock called with:", { materialId, locationId, quantity });

      // Validate inputs
      if (!materialId || typeof materialId !== 'string' || materialId.trim() === '') {
        showError("ID do material inválido.");
        return;
      }
      if (!locationId || typeof locationId !== 'string' || locationId.trim() === '') {
        showError("ID da localização inválido.");
        return;
      }
      if (quantity <= 0 || !Number.isInteger(quantity)) {
        showError("Quantidade deve ser um número inteiro positivo.");
        return;
      }

      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        showError("Erro de sessão. Tente novamente.");
        return;
      }
      if (!session) {
        showError("Sessão expirada. Faça login novamente.");
        return;
      }

      console.log("Session valid, proceeding with database operations");

      // Check if entry already exists
      console.log("Checking existing entry for material:", materialId, "location:", locationId);
      const { data: existing, error: checkError } = await supabase
        .from('material_locations')
        .select('quantity')
        .eq('material_id', materialId)
        .eq('location_id', locationId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing entry:", checkError);
        throw checkError;
      }

      console.log("Existing entry:", existing);

      const currentQuantity = existing?.quantity || 0;
      const newQuantity = currentQuantity + quantity;

      console.log("Current quantity:", currentQuantity, "New quantity:", newQuantity);

      if (existing) {
        // Update existing
        console.log("Updating existing entry");
        const { error } = await supabase
          .from('material_locations')
          .update({ quantity: newQuantity })
          .eq('material_id', materialId)
          .eq('location_id', locationId);

        if (error) {
          console.error("Error updating entry:", error);
          throw error;
        }
      } else {
        // Insert new
        console.log("Inserting new entry");
        const { error } = await supabase
          .from('material_locations')
          .insert({
            material_id: materialId,
            location_id: locationId,
            quantity: newQuantity
          });

        if (error) {
          console.error("Error inserting new entry:", error);
          throw error;
        }
      }

      console.log("Operation successful, refreshing materials");
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
    deleteMaterial,
    addInitialStock,
    transferMaterial,
    refreshMaterials: fetchMaterials
  };
};