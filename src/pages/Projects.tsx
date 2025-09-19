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

export default function ProjectsPage() {
  const { events, fetchEvents } = useEvents();
  const { services } = useServices();

  const [serviceFilter, setServiceFilter] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'kanban' | 'create'>('kanban');

  const allProjects: EventProject[] = events
    .filter((e: any) => !!e.status) // usa status como fase
    .map((e: any) => ({
      id: e.id,
      name: e.name ?? `Evento ${e.id}`,
      client_id: e.client_id,
      pipeline_status: e.status,      // para o cartão
      service_ids: e.service_ids ?? [],
      estimated_value: e.estimated_value,
      startDate: e.startDate,
      endDate: e.endDate ?? e.startDate,
      location: e.location ?? "",
      status: e.status,
      tags: e.tags ?? [],
      notes: e.notes ?? "",
    }));

  const filteredProjects = useMemo(() => {
    if (!serviceFilter || serviceFilter.length === 0) return allProjects;
    return allProjects.filter((p) => (p.service_ids || []).some(id => serviceFilter.includes(id)));
  }, [allProjects, serviceFilter]);

  const serviceNameById = useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach(s => (map[s.id] = s.name));
    return map;
  }, [services]);

  const slugify = (s?: string) => String(s || "").toLowerCase().replace(/[^a-z0-9-_]/g, "-");

  const scrollToNewProject = (createdEvent: any) => {
    try {
      const statusSlug = slugify(createdEvent.status);
      const columnEl = document.getElementById(`pipeline-column-${statusSlug}`);
      if (columnEl && columnEl.scrollIntoView) columnEl.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      setTimeout(() => {
        const cardEl = document.getElementById(`project-${createdEvent.id}`);
        if (cardEl && cardEl.scrollIntoView) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          cardEl.classList.add('ring-2', 'ring-primary', 'rounded-md');
          setTimeout(() => cardEl.classList.remove('ring-2', 'ring-primary', 'rounded-md'), 1500);
        }
      }, 300);
    } catch {}
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
              <CardDescription>Filtre projetos por serviços (seleção múltipla)</CardDescription>
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
            </CardContent>
          </Card>

          <PipelineKanban
            projects={filteredProjects}
            onUpdateProject={async () => { await fetchEvents(); }}
          />
        </TabsContent>

        <TabsContent value="create">
          <CreateProjectTab
            onCreated={async (createdEvent: any) => {
              await fetchEvents();
              setActiveTab('kanban');
              setTimeout(() => scrollToNewProject(createdEvent), 350);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}