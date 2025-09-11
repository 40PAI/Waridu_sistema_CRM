import { useState, useEffect, useMemo } from "react";
import { MaterialRequest, MaterialRequestItem, MaterialRequestStatus, ApproveResult } from "@/types"; // Import ApproveResult
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export const useMaterialRequests = () => {
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const approveMaterialRequest = async (requestId: string): Promise<ApproveResult> => {
    try {
      const { error } = await supabase
        .from('material_requests')
        .update({ 
          status: 'Aprovada', 
          decided_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      if (error) throw error;

      setMaterialRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "Aprovada", decidedAt: new Date().toISOString() } : r))
      );

      showSuccess("Requisição aprovada e estoque atualizado.");
      return { ok: true };
    } catch (error) {
      console.error("Error approving request:", error);
      const errorMessage = error instanceof Error ? error.message : "Falha ao aprovar requisição.";
      showError(errorMessage);
      return { ok: false, shortages: [] }; // Explicitly returning an empty array that matches the type
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