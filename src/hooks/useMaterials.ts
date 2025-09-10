import { useState, useEffect } from "react";
import { InventoryMaterial, MaterialStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

type PageMaterial = {
  id: string;
  name: string;
  category: string;
  status: MaterialStatus;
  description: string;
  locations: Record<string, number>;
  quantity: number;
};

export const useMaterials = () => {
  const [materials, setMaterials] = useState<InventoryMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      
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
      showError("Erro ao carregar materiais.");
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
        const { error } = await supabase
          .from('materials')
          .insert({
            name: materialData.name,
            category: materialData.category,
            status: materialData.status,
            description: materialData.description
          });

        if (error) throw error;
        showSuccess("Material adicionado com sucesso!");
      }

      fetchMaterials(); // Refresh the list
    } catch (error) {
      console.error("Error saving material:", error);
      showError("Erro ao salvar material.");
    }
  };

  const transferMaterial = async (materialId: string, fromLocationId: string, toLocationId: string, quantity: number) => {
    try {
      // Get current quantity at source location
      const { data: sourceData, error: sourceError } = await supabase
        .from('material_locations')
        .select('quantity')
        .eq('material_id', materialId)
        .eq('location_id', fromLocationId)
        .single();

      if (sourceError && sourceError.code !== 'PGRST116') throw sourceError; // PGRST116 means no rows found

      const currentSourceQty = sourceData?.quantity || 0;
      if (quantity <= 0 || quantity > currentSourceQty) {
        showError("Quantidade inválida para transferência.");
        return;
      }

      // Update source location
      if (currentSourceQty === quantity) {
        // Remove the record if quantity becomes 0
        const { error: deleteError } = await supabase
          .from('material_locations')
          .delete()
          .eq('material_id', materialId)
          .eq('location_id', fromLocationId);

        if (deleteError) throw deleteError;
      } else {
        // Update the quantity
        const { error: updateError } = await supabase
          .from('material_locations')
          .update({ quantity: currentSourceQty - quantity })
          .eq('material_id', materialId)
          .eq('location_id', fromLocationId);

        if (updateError) throw updateError;
      }

      // Update destination location
      const { data: destData, error: destError } = await supabase
        .from('material_locations')
        .select('quantity')
        .eq('material_id', materialId)
        .eq('location_id', toLocationId)
        .single();

      if (destError && destError.code !== 'PGRST116') throw destError; // PGRST116 means no rows found

      const currentDestQty = destData?.quantity || 0;
      const newDestQty = currentDestQty + quantity;

      if (destData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('material_locations')
          .update({ quantity: newDestQty })
          .eq('material_id', materialId)
          .eq('location_id', toLocationId);

        if (updateError) throw updateError;
      } else {
        // Insert new record
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
      showError("Erro ao realizar transferência.");
    }
  };

  const pageMaterials: PageMaterial[] = materials.map(m => ({
    id: m.id,
    name: m.name,
    category: m.category,
    status: m.status,
    description: m.description,
    locations: m.locations,
    quantity: Object.values(m.locations).reduce((a, b) => a + b, 0),
  }));

  return {
    materials: pageMaterials,
    rawMaterials: materials,
    loading,
    saveMaterial,
    transferMaterial,
    refreshMaterials: fetchMaterials
  };
};