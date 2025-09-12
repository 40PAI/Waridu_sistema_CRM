import { useState, useEffect, useMemo } from "react";
import { MaterialRequest, MaterialRequestItem, MaterialRequestStatus, ApproveResult } from "@/types"; // Import ApproveResult
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useMaterials } from "./useMaterials"; // Import useMaterials to use decrementMaterialFromLocations

export const useMaterialRequests = () => {
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { decrementMaterialFromLocations, refreshMaterials } = useMaterials(); // Use the new function

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('material_requests')
        .select(`
          id, 
          event_id, 
          requested_by_id,
          requested_by_details, 
          status, 
          reason, 
          created_at, 
          decided_at,
          material_request_items(material_id, quantity)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRequests: MaterialRequest[] = (data || []).map((req: any) => ({
        id: req.id,
        eventId: req.event_id,
        requestedBy: req.requested_by_details || { name: 'Desconhecido', email: '', role: '' },
        status: req.status as MaterialRequestStatus,
        reason: req.reason,
        createdAt: req.created_at,
        decidedAt: req.decided_at,
        items: (req.material_request_items || []).map((item: any) => ({
          materialId: item.material_id,
          quantity: item.quantity
        }))
      }));

      setMaterialRequests(formattedRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar requisições.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createMaterialRequest = async (eventId: number, items: Record<string, number>, requestedBy: { name: string; email: string; role: string }) => {
    const normalizedItems = Object.entries(items)
      .filter(([_, qty]) => qty > 0)
      .map(([materialId, quantity]) => ({ materialId, quantity }));

    if (normalizedItems.length === 0) {
      return;
    }

    try {
      const { data: requestHeader, error: headerError } = await supabase
        .from('material_requests')
        .insert({
          event_id: eventId,
          requested_by_details: requestedBy,
          status: 'Pendente',
          created_at: new Date().toISOString(),
          requested_by_id: requestedBy.id // Ensure requested_by_id is set
        })
        .select()
        .single();

      if (headerError) throw headerError;

      const requestId = requestHeader.id;

      const itemsToInsert = normalizedItems.map(item => ({
        request_id: requestId,
        material_id: item.materialId,
        quantity: item.quantity
      }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('material_request_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      const newRequest: MaterialRequest = {
        id: requestId,
        eventId: eventId,
        items: normalizedItems,
        requestedBy: requestedBy,
        status: 'Pendente',
        createdAt: requestHeader.created_at,
      };
      setMaterialRequests(prev => [newRequest, ...prev]);
      showSuccess("Requisição de materiais enviada com sucesso!");
    } catch (error) {
      console.error("Error creating material request:", error);
      const errorMessage = error instanceof Error ? error.message : "Falha ao enviar requisição. Tente novamente.";
      showError(errorMessage);
    }
  };

  const sendNotification = async (targetUserId: string, title: string, description: string, type: 'material' | 'system' = 'material') => {
    if (!targetUserId) return;
    await supabase.from('notifications').insert({
      title,
      description,
      type,
      user_id: targetUserId,
      read: false,
      created_at: new Date().toISOString(),
    });
  };

  const approveMaterialRequest = async (requestId: string): Promise<ApproveResult> => {
    try {
      // 1. Fetch the request and its items
      const { data: requestData, error: fetchRequestError } = await supabase
          .from('material_requests')
          .select(`
              id,
              event_id,
              requested_by_id,
              material_request_items(material_id, quantity)
          `)
          .eq('id', requestId)
          .single();

      if (fetchRequestError || !requestData) throw fetchRequestError || new Error("Requisição não encontrada.");

      const eventId = requestData.event_id;
      const requestedItems = requestData.material_request_items;

      // 2. Check for stock availability (doing it here for safety before decrementing)
      const shortages: { materialId: string; needed: number; available: number }[] = [];
      for (const item of requestedItems) {
          const { data: materialLocations, error: locError } = await supabase
              .from('material_locations')
              .select('quantity')
              .eq('material_id', item.material_id);

          if (locError) throw locError;

          const totalAvailable = materialLocations.reduce((sum, loc) => sum + loc.quantity, 0);
          if (totalAvailable < item.quantity) {
              shortages.push({ materialId: item.material_id, needed: item.quantity, available: totalAvailable });
          }
      }

      if (shortages.length > 0) {
          return { ok: false, shortages };
      }

      // 3. Decrement inventory and update event roster
      const { data: eventData, error: fetchEventError } = await supabase
          .from('events')
          .select('roster')
          .eq('id', eventId)
          .single();

      if (fetchEventError || !eventData) throw fetchEventError || new Error("Evento não encontrado.");

      let currentRoster = eventData.roster || { teamLead: null, teamMembers: [], materials: {} };
      let updatedMaterialsInRoster = { ...currentRoster.materials };

      for (const item of requestedItems) {
          // Decrement from material_locations using the helper function
          await decrementMaterialFromLocations(item.material_id, item.quantity);

          // Update event roster
          updatedMaterialsInRoster[item.material_id] = (updatedMaterialsInRoster[item.material_id] || 0) + item.quantity;
      }

      // 4. Update the event with the new roster materials
      const { error: updateEventError } = await supabase
          .from('events')
          .update({ roster: { ...currentRoster, materials: updatedMaterialsInRoster } })
          .eq('id', eventId);

      if (updateEventError) throw updateEventError;

      // 5. Update the request status
      const { error: updateRequestError } = await supabase
          .from('material_requests')
          .update({
              status: 'Aprovada',
              decided_at: new Date().toISOString()
          })
          .eq('id', requestId);

      if (updateRequestError) throw updateRequestError;

      // 6. Update local state and notify
      setMaterialRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: "Aprovada", decidedAt: new Date().toISOString() } : r))
      );

      const { data: reqData, error: reqErr } = await supabase
          .from('material_requests')
          .select('requested_by_id, event_id')
          .eq('id', requestId)
          .single();
      if (!reqErr && reqData?.requested_by_id) {
          await sendNotification(
              reqData.requested_by_id,
              "Requisição Aprovada",
              `Sua requisição de materiais para o evento #${reqData.event_id} foi aprovada.`,
              'material'
          );
      }
      
      refreshMaterials(); // Refresh materials to reflect inventory changes
      showSuccess("Requisição aprovada e estoque atualizado.");
      return { ok: true };
    } catch (error) {
      console.error("Error approving request:", error);
      const errorMessage = error instanceof Error ? error.message : "Falha ao aprovar requisição.";
      showError(errorMessage);
      return { ok: false, shortages: [] };
    }
  };

  const rejectMaterialRequest = async (requestId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('material_requests')
        .update({ 
          status: 'Rejeitada', 
          reason: reason, 
          decided_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      if (error) throw error;

      setMaterialRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: "Rejeitada", reason, decidedAt: new Date().toISOString() } : r
        )
      );

      // Buscar solicitante para notificar
      const { data: reqData, error: reqErr } = await supabase
        .from('material_requests')
        .select('requested_by_id, event_id')
        .eq('id', requestId)
        .single();
      if (!reqErr && reqData?.requested_by_id) {
        await sendNotification(
          reqData.requested_by_id,
          "Requisição Rejeitada",
          `Sua requisição de materiais para o evento #${reqData.event_id} foi rejeitada. Motivo: ${reason}`,
          'material'
        );
      }

      showSuccess("Requisição rejeitada.");
    } catch (error) {
      console.error("Error rejecting request:", error);
      const errorMessage = error instanceof Error ? error.message : "Falha ao rejeitar requisição.";
      showError(errorMessage);
    }
  };

  const pendingRequests = useMemo(() => materialRequests.filter((r) => r.status === "Pendente"), [materialRequests]);
  const approvedRequests = useMemo(() => materialRequests.filter((r) => r.status === "Aprovada"), [materialRequests]);
  const rejectedRequests = useMemo(() => materialRequests.filter((r) => r.status === "Rejeitada"), [materialRequests]);

  return {
    materialRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    loading,
    error,
    createMaterialRequest,
    approveMaterialRequest,
    rejectMaterialRequest,
    refreshRequests: fetchRequests
  };
};