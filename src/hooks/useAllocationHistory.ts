import { useMemo } from "react";
import type { Event, AllocationHistoryEntry } from "@/types";

export const useAllocationHistory = (events: Event[]) => {
  const history = useMemo<AllocationHistoryEntry[]>(() => {
    return events
      .filter(e => e.status === 'Concluído' && e.roster?.materials)
      .map(e => ({
        id: `hist-${e.id}`,
        date: e.endDate || e.startDate,
        eventName: e.name,
        materials: e.roster?.materials || {}
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events]);

  return { history };
};