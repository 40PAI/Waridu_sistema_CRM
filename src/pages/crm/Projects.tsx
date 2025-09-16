"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { showError, showSuccess } from "@/utils/toast";
import { Plus, Edit, Trash2, Calendar, DollarSign } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Project {
  id: number;
  name: string;
  client_id?: string;
  pipeline_status: '1º Contato' | 'Orçamento' | 'Negociação' | 'Confirmado';
  service_ids: string[];
  estimated_value?: number;
  notes?: string;
  startDate: string;
  endDate: string;
  tags?: string[]; // Add tags
}

const pipelineStatuses = [
  { value: '1º Contato', label: '1º Contato', color: 'bg-gray-100 text-gray-800' },
  { value: 'Orçamento', label: 'Orçamento', color: 'bg-blue-100 text-blue-800' },
  { value: 'Negociação', label: 'Negociação', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Confirmado', label: 'Confirmado', color: 'bg-green-100 text-green-800' }
];

const ProjectsPage = () => {
  const { events, addEvent, updateEvent } = useEvents();
  const { clients } = useClients();
  const { services } = useServices();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    client_id: '',
    pipeline_status: '1º Contato' as Project['pipeline_status'],
    service_ids: [] as string[],
    estimated_value: '',
    notes: '',
    startDate: '',
    endDate: '',
    tags: [] as string[] // Add tags
  });

  const projects = React.useMemo(() => {
    return events.filter((event) => !!event.pipeline_status).map((event) => ({
      id: event.id,
      name: event.name,
      client_id: event.client_id,
      pipeline_status: event.pipeline_status as Project['pipeline_status'],
      service_ids: event.service_ids || [],
      estimated_value: event.estimated_value,
      notes: event.notes,
      startDate: event.startDate,
      endDate: event.endDate,
      tags: event.tags || [] // Add tags
    }));
  }, [events]);

  const clientMap = React.useMemo(() => {
    return clients.reduce<Record<string, any>>((acc, client) => {
      acc[client.id] = client;
      return acc;
    }, {});
  }, [clients]);

  const serviceMap = React.useMemo(() => {
    return services.reduce<Record<string, any>>((acc, service) => {
      acc[service.id] = service;
      return acc;
    }, {});
  }, [services]);

  const resetForm = () => {
    setFormData({
      name: '',
      client_id: '',
      pipeline_status: '1º Contato',
      service_ids: [],
      estimated_value: '',
      notes: '',
      startDate: '',
      endDate: '',
      tags: []
    });
  };

  const openDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        client_id: project.client_id || '',
        pipeline_status: project.pipeline_status,
        service_ids: project.service_ids,
        estimated_value: project.estimated_value?.toString() || '',
        notes: project.notes || '',
        startDate: project.startDate,
        endDate: project.endDate,
        tags: project.tags || []
      });
    } else {
      setEditingProject(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError("Nome do projeto é obrigatório.");
      return;
    }

    try {
      const projectData: any = {
        name: formData.name.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: 'A definir', // default location
        client_id: formData.client_id || undefined,
        pipeline_status: formData.pipeline_status,
        service_ids: formData.service_ids,
        estimated_value: formData.estimated_value ? Number(formData.estimated_value) : undefined,
        notes: formData.notes.trim() || undefined,
        tags: formData.tags // Add tags
      };

      if (editingProject) {
        // updateEvent expects an Event object; construct minimal event with CRM fields
        await updateEvent({
          id: editingProject.id,
          name: projectData.name,
          startDate: projectData.startDate,
          endDate: projectData.endDate,
          location: projectData.location,
          pipeline_status: projectData.pipeline_status,
          service_ids: projectData.service_ids,
          estimated_value: projectData.estimated_value,
          notes: projectData.notes,
          tags: projectData.tags, // Add tags
          // preserve required fields with defaults
          status: 'Planejado',
        } as any);
      } else {
        await addEvent(projectData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const handleDelete = async (projectId: number) => {
    try {
      showError("Funcionalidade de exclusão ainda não implementada.");
    } catch (error) {
      // Error handling
    }
  };

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter(id => id !== serviceId)
        : [...prev.service_ids, serviceId]
    }));
  };

  const getStatusBadge = (status: Project['pipeline_status']) => {
    const statusConfig = pipelineStatuses.find(s => s.value === status);
    return (
      <Badge className={statusConfig?.color}>
        {statusConfig?.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Projetos</h1>
          <p className="text-muted-foreground">Gerencie o pipeline de projetos comerciais.</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Projetos</CardTitle>
          <CardDescription>
            {projects.length} projeto{projects.length !== 1 ? 's' : ''} no pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Serviços</TableHead>
                <TableHead>Valor Estimado</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length > 0 ? projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    {project.client_id && clientMap[project.client_id]
                      ? clientMap[project.client_id].name
                      : 'Cliente não definido'}
                  </TableCell>
                  <TableCell>{getStatusBadge(project.pipeline_status)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {project.service_ids.map(serviceId => {
                        const service = serviceMap[serviceId];
                        return service ? (
                          <Badge key={serviceId} variant="outline" className="text-xs">
                            {service.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.estimated_value ? (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        AOA {project.estimated_value.toLocaleString('pt-AO')}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(project.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openDialog(project)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(project.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    Nenhum projeto no pipeline ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
            <DialogDescription>
              {editingProject ? 'Atualize as informações do projeto.' : 'Preencha os dados para cadastrar um novo projeto no pipeline.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nome *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">Cliente</Label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                  className="col-span-3 border rounded p-2"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <select
                  value={formData.pipeline_status}
                  onChange={(e) => setFormData(prev => ({ ...prev, pipeline_status: e.target.value as Project['pipeline_status'] }))}
                  className="col-span-3 border rounded p-2"
                >
                  {pipelineStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Serviços</Label>
                <div className="col-span-3 space-y-2">
                  {services.map(service => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <input
                        id={`service-${service.id}`}
                        type="checkbox"
                        checked={formData.service_ids.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                      />
                      <Label htmlFor={`service-${service.id}`} className="text-sm">
                        {service.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="estimated_value" className="text-right">Valor Estimado</Label>
                <Input
                  id="estimated_value"
                  name="estimated_value"
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_value: e.target.value }))}
                  className="col-span-3"
                  placeholder="AOA"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">Data Início</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">Data Fim</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="col-span-3"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tags" className="text-right">Tags</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
                  className="col-span-3"
                  placeholder="urgente, prazo-curto, VIP"
                />
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right pt-2">Observações</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingProject ? 'Atualizar' : 'Criar'} Projeto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsPage;