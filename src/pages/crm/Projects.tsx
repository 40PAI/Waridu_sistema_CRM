"use client";

import { PipelineKanban } from "@/components/crm/PipelineKanban";
import { useEvents } from "@/hooks/useEvents";
import type { EventProject } from "@/types/crm";
import { MultiSelectServices } from "@/components/MultiSelectServices";
import { useServices } from "@/hooks/useServices";
import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ProjectsPage() {
  const { events } = useEvents();
  const { services } = useServices();

  // service filter (array of service ids)
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);

  const allProjects: EventProject[] = events
    .filter((e) => !!e.pipeline_status)
    .map((e) => ({
      id: e.id,
      name: e.name ?? `Evento ${e.id}`,
      client_id: (e as any).client_id,
      pipeline_status: (e as any).pipeline_status,
      service_ids: (e as any).service_ids ?? [],
      estimated_value: (e as any).estimated_value,
      startDate: e.startDate,
      endDate: e.endDate ?? e.startDate,
      location: e.location ?? "",
      status: e.status ?? "Planejado",
      tags: e.tags ?? [],
      notes: e.notes ?? "",
    }));

  // filter projects by selected services (match ANY)
  const filteredProjects = useMemo(() => {
    if (!serviceFilter || serviceFilter.length === 0) return allProjects;
    return allProjects.filter((p) => {
      const svcIds = p.service_ids || [];
      return svcIds.some(id => serviceFilter.includes(id));
    });
  }, [allProjects, serviceFilter]);

  const serviceNameById = useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach(s => (map[s.id] = s.name));
    return map;
  }, [services]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Projetos</h1>
        <div />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre projetos por serviços contratados (seleção múltipla)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:gap-4">
            <div className="flex-1">
              <MultiSelectServices selected={serviceFilter} onChange={setServiceFilter} />
            </div>
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <Button variant="outline" onClick={() => setServiceFilter([])}>Limpar filtros</Button>
            </div>
          </div>

          {serviceFilter.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {serviceFilter.map(id => (
                <Badge key={id} variant="secondary" className="inline-flex items-center gap-2">
                  <span>{serviceNameById[id] || id}</span>
                  <button onClick={() => setServiceFilter(prev => prev.filter(x => x !== id))} className="ml-1">
                    ✕
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PipelineKanban
        projects={filteredProjects}
        onUpdateProject={async (p) => {
          // PipelineKanban persists changes itself to the events table; this handler can be a noop or used for additional side effects.
          return;
        }}
      />
    </div>
  );
}