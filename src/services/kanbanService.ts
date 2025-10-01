import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export interface MoveEventParams {
  eventId: number;
  targetPhaseId: string;
  beforeId?: number | null;
  afterId?: number | null;
}

/**
 * Move an event to a new phase and position
 * Uses localStorage fallback only when tables don't exist (development mode)
 */
export async function moveEventRPC({
  eventId,
  targetPhaseId,
  beforeId,
  afterId,
}: MoveEventParams): Promise<void> {
  try {
    // First, try to get the phase label from Supabase
    const { data: phaseData, error: phaseError } = await supabase
      .from('pipeline_phases')
      .select('name')
      .eq('id', targetPhaseId)
      .single();

    // If table doesn't exist, use localStorage fallback for development
    if (phaseError && (phaseError.code === 'PGRST116' || phaseError.message.includes('does not exist'))) {
      console.log("Tables not found, using localStorage fallback for development");
      await moveEventLocal({ eventId, targetPhaseId, beforeId, afterId });
      showSuccess("Evento movido (modo demonstração)");
      return;
    }

    if (phaseError) {
      console.error("Error fetching phase:", phaseError);
      throw new Error(`Erro ao buscar fase: ${phaseError.message}`);
    }

    // Calculate new rank based on position
    let newRank = 1000;
    
    if (beforeId && afterId) {
      // Insert between two items
      const { data: beforeEvent } = await supabase
        .from('events')
        .select('pipeline_rank')
        .eq('id', beforeId)
        .single();
      
      const { data: afterEvent } = await supabase
        .from('events')
        .select('pipeline_rank')
        .eq('id', afterId)
        .single();
      
      const beforeRank = beforeEvent?.pipeline_rank || 0;
      const afterRank = afterEvent?.pipeline_rank || 2000;
      newRank = Math.floor((beforeRank + afterRank) / 2);
    } else if (beforeId) {
      // Insert after beforeId
      const { data: beforeEvent } = await supabase
        .from('events')
        .select('pipeline_rank')
        .eq('id', beforeId)
        .single();
      
      newRank = (beforeEvent?.pipeline_rank || 0) + 1000;
    } else if (afterId) {
      // Insert before afterId
      const { data: afterEvent } = await supabase
        .from('events')
        .select('pipeline_rank')
        .eq('id', afterId)
        .single();
      
      newRank = Math.max((afterEvent?.pipeline_rank || 1000) - 500, 100);
    } else {
      // Add to end of phase
      const { data: maxRankData } = await supabase
        .from('events')
        .select('pipeline_rank')
        .eq('pipeline_phase_id', targetPhaseId)
        .order('pipeline_rank', { ascending: false })
        .limit(1)
        .single();
      
      newRank = (maxRankData?.pipeline_rank || 0) + 1000;
    }

    // Ensure newRank is positive
    if (newRank <= 0) {
      newRank = 1000;
    }

    // Update the event
    const { error: updateError } = await supabase
      .from('events')
      .update({
        pipeline_phase_id: targetPhaseId,
        pipeline_phase_label: phaseData.name,
        pipeline_rank: newRank,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (updateError) {
      console.error("Error updating event:", updateError);
      throw new Error(`Erro ao atualizar evento: ${updateError.message}`);
    }

  } catch (err: any) {
    // Only use localStorage fallback if tables don't exist
    if (err?.code === 'PGRST116' || err?.message?.includes('does not exist')) {
      console.log("Tables not found, using localStorage fallback for development");
      await moveEventLocal({ eventId, targetPhaseId, beforeId, afterId });
      showSuccess("Evento movido (modo demonstração)");
      return;
    }
    
    console.error("Error calling moveEventRPC:", err);
    throw new Error(err?.message || "Erro ao mover evento");
  }
}

/**
 * Local storage fallback for moving events when Supabase is not available
 */
async function moveEventLocal({
  eventId,
  targetPhaseId,
  beforeId,
  afterId,
}: MoveEventParams): Promise<void> {
  const phases = {
    '1': '1º Contato',
    '2': 'Orçamento', 
    '3': 'Negociação',
    '4': 'Confirmado',
    '5': 'Cancelado'
  };
  
  const phaseLabel = phases[targetPhaseId as keyof typeof phases] || 'Desconhecido';
  
  // Get current events from localStorage
  const eventsData = localStorage.getItem('pipeline_events');
  const events = eventsData ? JSON.parse(eventsData) : [];
  
  // Find and update the event
  const eventIndex = events.findIndex((e: any) => e.id === eventId);
  if (eventIndex !== -1) {
    // Calculate new rank
    let newRank = 1000;
    
    if (beforeId && afterId) {
      const beforeEvent = events.find((e: any) => e.id === beforeId);
      const afterEvent = events.find((e: any) => e.id === afterId);
      const beforeRank = beforeEvent?.pipeline_rank || 0;
      const afterRank = afterEvent?.pipeline_rank || 2000;
      newRank = Math.floor((beforeRank + afterRank) / 2);
    } else if (beforeId) {
      const beforeEvent = events.find((e: any) => e.id === beforeId);
      newRank = (beforeEvent?.pipeline_rank || 0) + 1000;
    } else if (afterId) {
      const afterEvent = events.find((e: any) => e.id === afterId);
      newRank = Math.max((afterEvent?.pipeline_rank || 1000) - 500, 100);
    } else {
      const samePhaseEvents = events.filter((e: any) => e.pipeline_phase_id === targetPhaseId);
      const maxRank = Math.max(...samePhaseEvents.map((e: any) => e.pipeline_rank || 0), 0);
      newRank = maxRank + 1000;
    }

    // Update event
    events[eventIndex] = {
      ...events[eventIndex],
      pipeline_phase_id: targetPhaseId,
      pipeline_phase_label: phaseLabel,
      pipeline_rank: newRank,
      updated_at: new Date().toISOString(),
    };
    
    // Save back to localStorage
    localStorage.setItem('pipeline_events', JSON.stringify(events));
    console.log(`Event ${eventId} moved to phase ${phaseLabel} (local storage)`);
  } else {
    console.warn(`Event ${eventId} not found in local storage`);
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
 * Only provides demo data when table specifically doesn't exist
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
      // Only provide demo data if table doesn't exist (PGRST116)
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log("Events table not found, providing demo data for development");
        showSuccess("🚧 Modo Demonstração Ativo - Dados não são persistidos no servidor");
        return getDemoEvents();
      }
      
      // For other errors, throw to preserve error handling
      console.error("Error fetching ordered events:", error);
      throw error;
    }

    // Return actual data (even if empty array)
    return data || [];
  } catch (err: any) {
    // Only catch table not found errors for demo data
    if (err?.code === 'PGRST116' || err?.message?.includes('does not exist')) {
      console.log("Events table not found, providing demo data for development");
      showSuccess("🚧 Modo Demonstração Ativo - Dados não são persistidos no servidor");
      return getDemoEvents();
    }
    
    console.error("Error in fetchOrderedEvents:", err);
    throw new Error(err?.message || "Erro ao carregar eventos");
  }
}

/**
 * Get demo events from localStorage or create new ones
 */
function getDemoEvents(): any[] {
  // Check if we have events in localStorage
  const savedEvents = localStorage.getItem('pipeline_events');
  if (savedEvents) {
    try {
      const events = JSON.parse(savedEvents);
      if (events && events.length > 0) {
        return events;
      }
    } catch (e) {
      console.warn("Failed to parse saved events from localStorage");
    }
  }

  // Create demo events
  const demoEvents = [
    {
      id: 1,
      name: "Evento Corporativo - Empresa ABC",
      pipeline_phase_id: "1",
      pipeline_phase_label: "1º Contato",
      pipeline_status: "1º Contato",
      pipeline_rank: 1000,
      estimated_value: 15000,
      start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: "Hotel Central",
      status: "Planejado",
      notes: "Cliente interessado em evento para 100 pessoas",
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Casamento - Silva Family",
      pipeline_phase_id: "2",
      pipeline_phase_label: "Orçamento",
      pipeline_status: "Orçamento",
      pipeline_rank: 1000,
      estimated_value: 25000,
      start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      location: "Quinta das Flores",
      status: "Planejado",
      notes: "Orçamento enviado aguardando resposta",
      updated_at: new Date().toISOString(),
    },
    {
      id: 3,
      name: "Festa de Aniversário - Maria",
      pipeline_phase_id: "3",
      pipeline_phase_label: "Negociação",
      pipeline_status: "Negociação",
      pipeline_rank: 1000,
      estimated_value: 8000,
      start_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      location: "Salão de Festas Central",
      status: "Planejado",
      notes: "Negociando detalhes do cardápio",
      updated_at: new Date().toISOString(),
    },
    {
      id: 4,
      name: "Evento de Formatura - Universidade",
      pipeline_phase_id: "4",
      pipeline_phase_label: "Confirmado",
      pipeline_status: "Confirmado",
      pipeline_rank: 1000,
      estimated_value: 35000,
      start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      location: "Centro de Convenções",
      status: "Confirmado",
      notes: "Evento confirmado, preparação em andamento",
      updated_at: new Date().toISOString(),
    },
  ];

  // Save demo events to localStorage
  localStorage.setItem('pipeline_events', JSON.stringify(demoEvents));
  console.log("Created demo events in localStorage");
  return demoEvents;
}

export default {
  moveEventRPC,
  moveEventRPCJson,
  fetchOrderedEvents,
};