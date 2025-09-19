"use client";

import * as React from "react";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import { useEvents } from "@/hooks/useEvents";
import type { EventProject } from "@/types/crm";
import { MultiSelectServices } from "@/components/MultiSelectServices";
import { useServices } from "@/hooks/useServices";
import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CreateProjectTab from "@/components/crm/CreateProjectTab";
import { eventsService } from "@/services";
import { showError } from "@/utils/toast";

export default function ProjectsPage() {
  const { events, fetchEvents } = useEvents();
  const { services } = useServices();

  // service filter (array of service ids)
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'kanban' | 'create'>('kanban');

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

  const persistProjectUpdate = async (p: EventProject) => {
    try {
      await eventsService.upsertEvent({
        id: p.id,
        pipeline_status: p.pipeline_status ?? null,
        notes: p.notes ?? null,
        tags: p.tags ?? null,
        estimated_value: p.estimated_value ?? null,
      });
      await fetchEvents();
    } catch (err: any) {
      showError(err?.message || "Falha ao salvar alterações do projeto.");
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Projetos</h1>
        <div />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="kanban">Pipeline</TabsTrigger>
          <TabsTrigger value="create">Criar Projeto</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
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
                  <button className="inline-flex items-center px-3 py-1 rounded border" onClick={() => setServiceFilter([])}>Limpar filtros</button>
                </div>
              </div>

              {serviceFilter.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {serviceFilter.map(id => (
                    <span key={id} className="px-2 py-1 bg-muted rounded text-sm">
                      {serviceNameById[id] || id}
                      <button onClick={() => setServiceFilter(prev => prev.filter(x => x !== id))} className="ml-2">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <PipelineKanban
            projects={filteredProjects}
            onUpdateProject={persistProjectUpdate}
            onEditProject={(p) => {}}
            onViewProject={(p) => {}}
          />
        </TabsContent>

        <TabsContent value="create">
          <CreateProjectTab
            onCreated={async (id: number) => {
              await fetchEvents();
              setActiveTab('kanban');
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}