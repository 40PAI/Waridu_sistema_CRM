import { useState, useEffect } from "react";
import { MaterialRequest, MaterialRequestItem, MaterialRequestStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export const useMaterialRequests = () => {
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
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

      if (error) {
        console.error("Erro ao buscar requisições:", error);
        return;
      }

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
    };

    fetchRequests();
  }, []);

  const createMaterialRequest = async (eventId: number, items: Record<string, number>, requestedBy: { name: string; email: string; role: string }) => {
    const normalizedItems = Object.entries(items)
      .filter(([_, qty]) => qty > 0)
      .map(([materialId, quantity]) => ({ materialId, quantity }));

    if (normalizedItems.length === 0) {
      return;
    }

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

    if (headerError) {
      console.error("Erro ao criar cabeçalho da requisição:", headerError);
      showError("Falha ao enviar requisição. Tente novamente.");
      return;
    }

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

      if (itemsError) {
        console.error("Erro ao inserir itens da requisição:", itemsError);
        showError("Falha ao enviar itens da requisição.");
        return;
      }
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
  };

  const approveMaterialRequest = async (requestId: string) => {
    // This would be implemented with the materials hook in a real app
    const req = materialRequests.find((r) => r.id === requestId);
    if (!req || req.status !== "Pendente") return { ok: false, shortages: [] as any[] } as const;

    // In a real app, we would check inventory and update materials
    const { error } = await supabase
      .from('material_requests')
      .update({ 
        status: 'Aprovada', 
        decided_at: new Date().toISOString() 
      })
      .eq('id', requestId);

    if (error) {
      console.error("Erro ao aprovar requisição:", error);
      showError("Falha ao aprovar requisição.");
      return { ok: false, shortages: [] } as const;
    }

    setMaterialRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "Aprovada", decidedAt: new Date().toISOString() } : r))
    );

    showSuccess("Requisição aprovada e estoque atualizado.");
    return { ok: true } as const;
  };

  const rejectMaterialRequest = async (requestId: string, reason: string) => {
    const { error } = await supabase
      .from('material_requests')
      .update({ 
        status: 'Rejeitada', 
        reason: reason, 
        decided_at: new Date().toISOString() 
      })
      .eq('id', requestId);

    if (error) {
      console.error("Erro ao rejeitar requisição:", error);
      showError("Falha ao rejeitar requisição.");
      return;
    }

    setMaterialRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: "Rejeitada", reason, decidedAt: new Date().toISOString() } : r
      )
    );
    showSuccess("Requisição rejeitada.");
  };

  const pendingRequests = materialRequests.filter((r) => r.status === "Pendente");

  return {
    materialRequests,
    pendingRequests,
    createMaterialRequest,
    approveMaterialRequest,
    rejectMaterialRequest
  };
};