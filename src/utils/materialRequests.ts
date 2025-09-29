/**
 * Material request utility functions for creating requests with proper authentication
 */

import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

/**
 * Creates a material request with proper Supabase authentication
 * @param eventId - ID of the event
 * @param reason - Optional reason for the request
 * @returns Promise with the created request ID or throws error
 */
export async function createMaterialRequest(
  eventId: number, 
  reason?: string
): Promise<string> {
  try {
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("Erro de autenticação:", {
        error: authError,
        code: authError.code,
        message: authError.message
      });
      throw new Error(`Erro de autenticação: ${authError.message}`);
    }

    if (!user) {
      console.error("Usuário não autenticado");
      throw new Error("Usuário não autenticado. Faça login novamente.");
    }

    // Get user profile details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Erro ao obter perfil do usuário:", {
        error: profileError,
        code: profileError.code,
        message: profileError.message,
        details: profileError.details
      });
      throw new Error(`Erro ao obter dados do usuário: ${profileError.message}`);
    }

    // Create display name from profile data
    const displayName = profile 
      ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || user.user_metadata?.full_name || null
      : user.user_metadata?.full_name || null;

    // Prepare payload according to DDL schema
    const payload = {
      event_id: eventId,
      requested_by_id: user.id,
      requested_by_details: {
        name: displayName,
        email: user.email
      },
      reason: reason || null,
      status: 'Pendente' as const
    };

    console.log("Criando requisição de material:", {
      eventId,
      userId: user.id,
      payload
    });

    // Insert material request
    const { data: request, error: insertError } = await supabase
      .from('material_requests')
      .insert(payload)
      .select('id')
      .single();

    if (insertError) {
      console.error("Erro ao criar requisição de material:", {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        payload
      });
      
      const errorMessage = insertError.message || insertError.details || 'Erro desconhecido';
      throw new Error(`Erro ao criar requisição: ${errorMessage}`);
    }

    console.log("Requisição criada com sucesso:", request);
    showSuccess("Requisição de materiais enviada com sucesso!");
    
    return request.id;

  } catch (error: any) {
    console.error("Erro geral na criação da requisição:", {
      error,
      message: error?.message,
      code: error?.code,
      details: error?.details
    });

    // Show user-friendly error message
    const errorMessage = error?.message || error?.details || 'Erro ao enviar requisição. Tente novamente.';
    showError(errorMessage);
    
    throw error;
  }
}

/**
 * Creates a material request with items (legacy compatibility)
 * @param eventId - ID of the event
 * @param items - Record of materialId -> quantity
 * @param requestedBy - User details (ignored, uses auth instead)
 * @returns Promise that resolves when request is created
 */
export async function createMaterialRequestWithItems(
  eventId: number,
  items: Record<string, number>,
  requestedBy: { name: string; email: string; role: string }
): Promise<void> {
  try {
    // Create the base request
    const requestId = await createMaterialRequest(eventId, `Requisição de ${Object.keys(items).length} itens`);
    
    // Normalize items
    const normalizedItems = Object.entries(items)
      .filter(([_, qty]) => qty > 0)
      .map(([materialId, quantity]) => ({
        request_id: requestId,
        material_id: materialId,
        quantity: quantity
      }));

    if (normalizedItems.length === 0) {
      console.warn("Nenhum item válido para inserir");
      return;
    }

    // Insert items
    const { error: itemsError } = await supabase
      .from('material_request_items')
      .insert(normalizedItems);

    if (itemsError) {
      console.error("Erro ao inserir itens da requisição:", {
        error: itemsError,
        code: itemsError.code,
        message: itemsError.message,
        details: itemsError.details,
        items: normalizedItems
      });
      
      throw new Error(`Erro ao adicionar itens: ${itemsError.message}`);
    }

    console.log("Itens da requisição inseridos com sucesso:", normalizedItems);

  } catch (error: any) {
    console.error("Erro na criação da requisição com itens:", error);
    throw error;
  }
}