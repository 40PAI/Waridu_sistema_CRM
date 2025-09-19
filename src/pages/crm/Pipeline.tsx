"use client";

import * as React from "react";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import CreateProjectTab from "@/components/crm/CreateProjectTab";
import { useEvents } from "@/hooks/useEvents";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import type { EventProject } from "@/types/crm";
import { eventsService } from "@/services";
import { showError } from "@/utils/toast";

export default function PipelinePage() {
  const { events, fetchEvents } = useEvents();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'novo'>('pipeline');

  const projects = React.useMemo(() => {
    return (events || [])
      .filter((e: any) => !!e.status)
      .map((e: any) => ({
        id: e.id,
        name: e.name ?? `Evento ${e.id}`,
        client_id: e.client_id,
        pipeline_status: e.status,
        service_ids: e.service_ids ?? [],
        estimated_value: e.estimated_value,
        startDate: e.startDate,
        endDate: e.endDate ?? e.startDate,
        location: e.location ?? "",
        status: e.status,
        tags: e.tags ?? [],
        notes: e.notes ?? "",
      }));
  }, [events]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-sm text-muted-foreground">Gerencie o funil comercial e crie projetos diretamente no pipeline.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="novo">Novo Projeto</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Kanban</CardTitle>
              <CardDescription>Arraste projetos entre fases do funil.</CardDescription>
            </CardHeader>
            <CardContent>
              <PipelineKanban
                projects={projects}
                onUpdateProject={persistProjectUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="novo">
          <Card>
            <CardHeader>
              <CardTitle>Novo Projeto</CardTitle>
              <CardDescription>Crie um novo projeto diretamente no Pipeline.</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateProjectTab
                onCreated={async (createdEvent: any) => {
                  await fetchEvents();
                  setActiveTab('pipeline');
                  setTimeout(() => scrollToNewProject(createdEvent), 350);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}