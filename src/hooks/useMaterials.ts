import { useState, useEffect, useMemo } from "react";
import { PageMaterial, InventoryMaterial, MaterialStatus } from "@/types";
import { showError, showSuccess } from "@/utils/toast";
import * as materialsService from "@/services/materialsService";

export const useMaterials = () => {
  const [materials, setMaterials] = useState<InventoryMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError(null);

      const materialsData = await materialsService.fetchMaterials();
      const locationsData = await materialsService.fetchLocations();

      const locationMap: Record<string, string> = {};
      (locationsData || []).forEach((loc: any) => {
        locationMap[loc.id] = loc.name;
      });

      const formattedMaterials: InventoryMaterial[] = (materialsData || []).map((mat: any) => {
        const locations: Record<string, number> = {};
        Object.keys(locationMap).forEach(locId => {
          locations[locId] = 0;
        });
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
    } catch (err: any) {
      console.error("Error fetching materials:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar materiais.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const saveMaterial = async (materialData: Omit<PageMaterial, 'id' | 'locations'> & { id?: string }) => {
    try {
      const res = await materialsService.saveMaterial(materialData);
      await fetchMaterials();
      return res;
    } catch (err) {
      console.error("Error saving material:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao salvar material.";
      showError(errorMessage);
      throw err;
    }
  };

  const deleteMaterial = async (id: string) => {
    try {
      await materialsService.deleteMaterial(id);
      await fetchMaterials();
    } catch (err) {
      console.error("Error deleting material:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao remover material.";
      showError(errorMessage);
    }
  };

  const addInitialStock = async (materialId: string, locationId: string, quantity: number) => {
    try {
      await materialsService.addInitialStock(materialId, locationId, quantity);
      await fetchMaterials();
    } catch (err) {
      console.error("Error adding initial stock:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar estoque inicial.";
      showError(errorMessage);
    }
  };

  const transferMaterial = async (materialId: string, fromLocationId: string, toLocationId: string, quantity: number) => {
    try {
      await materialsService.transferMaterial(materialId, fromLocationId, toLocationId, quantity);
      await fetchMaterials();
    } catch (err) {
      console.error("Error transferring material:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao transferir material.";
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