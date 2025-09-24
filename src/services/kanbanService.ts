import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export interface MoveEventParams {
  eventId: number;
  targetPhaseId: string;
  beforeId?: number | null;
  afterId?: number | null;
}

/**
 * Move an event to a new phase and position using the RPC function
 * This ensures server-side rank calculation and persistence
 */
export async function moveEventRPC({
  eventId,
  targetPhaseId,
  beforeId,
  afterId,
}: MoveEventParams): Promise<void> {
  try {
    const { error } = await supabase.rpc('rpc_move_event', {
      p_event_id: eventId,
      p_new_phase: targetPhaseId,
      p_before_id: beforeId ?? null,
      p_after_id: afterId ?? null,
    });

    if (error) {
      console.error("RPC move event error:", error);
      throw new Error(`Erro na movimentação: ${error.message}`);
    }
  } catch (err: any) {
    console.error("Error calling moveEventRPC:", err);
    throw new Error(err?.message || "Erro ao mover evento");
  }
}

/**
 * Alternative JSON-based RPC call (if needed)
 */
export async function moveEventRPCJson(payload: {
  event_id: number;
  new_phase: string;
  before_id?: number | null;
  after_id?: number | null;
}): Promise<void> {
  try {
    const { error } = await supabase.rpc('rpc_move_event_json', payload);

    if (error) {
      console.error("RPC move event JSON error:", error);
      throw new Error(`Erro na movimentação: ${error.message}`);
    }
  } catch (err: any) {
    console.error("Error calling moveEventRPCJson:", err);
    throw new Error(err?.message || "Erro ao mover evento");
  }
}

/**
 * Fetch events ordered by server (phase -> rank -> updated_at)
 * This ensures consistent ordering across sessions
 */
export async function fetchOrderedEvents(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        name,
        pipeline_phase_id,
        pipeline_phase_label,
        pipeline_status,
        pipeline_rank,
        updated_at,
        start_date,
        end_date,
        location,
        service_ids,
        estimated_value,
        client_id,
        notes,
        status,
        description,
        roster,
        expenses
      `)
      .order('pipeline_phase_id', { ascending: true })
      .order('pipeline_rank', { ascending: true })
      .order('updated_at', { ascending: false });

    if (error) {
      console.error("Error fetching ordered events:", error);
      throw error;
    }

    return data || [];
  } catch (err: any) {
    console.error("Error in fetchOrderedEvents:", err);
    throw new Error(err?.message || "Erro ao carregar eventos");
  }
}

export default {
  moveEventRPC,
  moveEventRPCJson,
  fetchOrderedEvents,
};