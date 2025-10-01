import type { InventoryMaterial, PageMaterial } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export const fetchMaterials = async () => {
  const { data, error } = await supabase
    .from("materials")
    .select(`
      id,
      name,
      status,
      category,
      description,
      material_locations(location_id, quantity)
    `)
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
};

export const fetchLocations = async () => {
  const { data, error } = await supabase.from("locations").select("id, name");
  if (error) throw error;
  return data;
};

export const saveMaterial = async (payload: Partial<PageMaterial>) => {
  if (payload.id) {
    const { data, error } = await supabase
      .from("materials")
      .update({
        name: payload.name,
        category: payload.category,
        status: payload.status,
        description: payload.description,
      })
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("materials")
      .insert({
        name: payload.name,
        category: payload.category,
        status: payload.status,
        description: payload.description,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

export const deleteMaterial = async (id: string) => {
  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) throw error;
  return true;
};

export const upsertMaterialLocation = async (materialId: string, locationId: string, quantity: number) => {
  const { data: existing, error: checkErr } = await supabase
    .from("material_locations")
    .select("quantity")
    .eq("material_id", materialId)
    .eq("location_id", locationId)
    .maybeSingle();

  if (checkErr) throw checkErr;

  if (existing) {
    const { error } = await supabase
      .from("material_locations")
      .update({ quantity })
      .eq("material_id", materialId)
      .eq("location_id", locationId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("material_locations")
      .insert({ material_id: materialId, location_id: locationId, quantity });
    if (error) throw error;
  }
  return true;
};

export const addInitialStock = async (materialId: string, locationId: string, addQty: number) => {
  const { data: existing, error: checkErr } = await supabase
    .from("material_locations")
    .select("quantity")
    .eq("material_id", materialId)
    .eq("location_id", locationId)
    .maybeSingle();

  if (checkErr) throw checkErr;

  const current = existing?.quantity || 0;
  const newQty = current + addQty;

  return upsertMaterialLocation(materialId, locationId, newQty);
};

export const transferMaterial = async (materialId: string, fromLocationId: string, toLocationId: string, qty: number) => {
  const { data: sourceData, error: sourceErr } = await supabase
    .from("material_locations")
    .select("quantity")
    .eq("material_id", materialId)
    .eq("location_id", fromLocationId)
    .maybeSingle();

  if (sourceErr) throw sourceErr;

  const currentSource = sourceData?.quantity || 0;
  if (qty > currentSource) throw new Error("Quantidade insuficiente na origem");

  if (currentSource === qty) {
    const { error } = await supabase
      .from("material_locations")
      .delete()
      .eq("material_id", materialId)
      .eq("location_id", fromLocationId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("material_locations")
      .update({ quantity: currentSource - qty })
      .eq("material_id", materialId)
      .eq("location_id", fromLocationId);
    if (error) throw error;
  }

  const { data: destData, error: destErr } = await supabase
    .from("material_locations")
    .select("quantity")
    .eq("material_id", materialId)
    .eq("location_id", toLocationId)
    .maybeSingle();

  if (destErr) throw destErr;

  const destCurrent = destData?.quantity || 0;
  const newDest = destCurrent + qty;

  return upsertMaterialLocation(materialId, toLocationId, newDest);
};