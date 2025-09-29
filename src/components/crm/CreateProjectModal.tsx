"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { MultiSelectServices } from "@/components/MultiSelectServices";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { showError, showSuccess } from "@/utils/toast";
import { Plus } from "lucide-react";
import CreateClientModal from "@/components/crm/CreateClientModal";
import usePipelineStages from "@/hooks/usePipelineStages";
import { useEmployees } from "@/hooks/useEmployees";
import { supabase } from "@/integrations/supabase/client"; // Import supabase for createProject
import { useQueryClient } from "@tanstack/react-query"; // Import useQueryClient
import { useIdPrefix } from "@/hooks/useIdPrefix";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const projectSchema = z.object({
  clientId: z.string().min(1).refine((v) => UUID_REGEX.test(v), "client_id deve ser um UUID"),
  name: z.string().min(1),
  serviceIds: z.array(z.string()).min(1),
  startDate: z.string().min(1),
  startTime: z.string().min(1),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().min(1),
  estimatedValue: z.number().min(0).optional(),
  notes: z.string().optional(),
  pipelinePhaseId: z.string().min(1).refine((v) => UUID_REGEX.test(v), "pipeline_phase_id deve ser um UUID"),
  responsibleId: z.string().optional(),
  nextActionDate: z.string().optional(),
  nextActionTime: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

function toISO(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm, ss] = (timeStr || "00:00:00").split(":").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d, hh || 0, mm || 0, ss || 0)).toISOString();
}

// New function to get insert rank
async function getInsertRank(phaseId: string) {
  const { data } = await supabase
    .from('events')
    .select('pipeline_rank')
    .eq('pipeline_phase_id', phaseId)
    .order('pipeline_rank', { ascending: true })
    .limit(1);
  if (!data?.length) return '1000000';              // primeiro item
  const right = BigInt(data[0].pipeline_rank);
  return (right - 1000000n).toString();             // insere acima do primeiro
}

// Centralized createProject function
export async function createProject(payload: {
  name: string;
  pipeline_phase_id: string;
  client_id?: string | null;
  estimated_value?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  notes?: string | null;
  service_ids?: string[] | null;
  responsible_id?: string | null;
  next_action_date?: string | null;
}) {
  const pipeline_rank = await getInsertRank(payload.pipeline_phase_id);
  const { data, error } = await supabase
    .from('events')
    .insert([{ ...payload, pipeline_rank }])
    .select('id,name,pipeline_phase_id,pipeline_rank,updated_at');
  if (error) throw error;
  return data?.[0];
}

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (projectId: number) => void;
  preselectedClientId?: string;
  defaultPhaseId?: string; // New prop
}

export default function CreateProjectModal({ open, onOpenChange, onCreated, preselectedClientId, defaultPhaseId }: CreateProjectModalProps) {
  const { clients, fetchClients } = useClients();
  const { services } = useServices();
  const { employees, refreshEmployees } = useEmployees(); // Fetch all employees
  const { stages } = usePipelineStages();
  const qc = useQueryClient(); // Get query client for invalidation

  const [isCreateClientOpen, setIsCreateClientOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  
  // Generate unique IDs for form fields
  const getId = useIdPrefix('np');
  
  // Ref for first field focus
  const firstFieldRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientId: preselectedClientId || "",
      name: "",
      serviceIds: [],
      pipelinePhaseId: defaultPhaseId || "",
      startDate: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endDate: "",
      endTime: "",
      location: "",
      estimatedValue: undefined,
      notes: "",
      responsibleId: "",
      nextActionDate: "",
      nextActionTime: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      const defaultPhase = defaultPhaseId || (stages && stages.length > 0 ? stages[0].id : "");
      const defaultResponsible = employees.find(emp => emp.status === 'Ativo')?.id || ""; // Find any active employee
      form.reset({
        clientId: preselectedClientId || "",
        name: "",
        serviceIds: [],
        pipelinePhaseId: defaultPhase,
        startDate: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endDate: "",
        endTime: "",
        location: "",
        estimatedValue: undefined,
        notes: "",
        responsibleId: defaultResponsible,
        nextActionDate: "",
        nextActionTime: "",
      });
      
      // Focus first field for accessibility
      setTimeout(() => {
        firstFieldRef.current?.focus();
      }, 100);
    }
  }, [open, preselectedClientId, defaultPhaseId, form, stages, employees]);

  const clientOptions = React.useMemo(() => clients.map(c => ({ value: c.id, label: `${c.name} (${c.email || "sem email"})` })), [clients]);

  const responsibleUserOptions = React.useMemo(() =>
    employees
      .filter(emp => emp.status === 'Ativo') // Only show active employees
      .map(emp => {
        const roleText = emp.role ? ` - ${emp.role}` : '';
        return {
          value: emp.id, // Use employee id
          label: `${emp.name}${roleText}`
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  , [employees]);

  const pipelineOptions = React.useMemo(() => 
    stages.filter(s => s.is_active).map(s => ({ value: s.id, label: s.name }))
  , [stages]);

  const handleSubmit = async (data: ProjectFormData) => {
    if (!data.pipelinePhaseId) {
      showError("Selecione uma fase do pipeline.");
      return;
    }

    setSaving(true);

    const startISO = toISO(data.startDate, data.startTime);
    const endISO = data.endDate ? toISO(data.endDate, data.endTime || data.startTime) : startISO;
    const nextActionISO = data.nextActionDate ? toISO(data.nextActionDate, data.nextActionTime || "09:00") : null;

    const payload = {
      name: data.name,
      start_date: startISO,
      end_date: endISO,
      start_time: data.startTime ? `${data.startTime}:00` : null,
      end_time: data.endTime ? `${data.endTime}:00` : null,
      location: data.location,
      pipeline_phase_id: data.pipelinePhaseId, // Use phase ID as source of truth
      estimated_value: data.estimatedValue ?? null,
      service_ids: data.serviceIds,
      client_id: data.clientId,
      notes: data.notes || null,
      responsible_id: data.responsibleId || null,
      next_action_date: nextActionISO,
    };

    try {
      const result = await createProject(payload); // Use the new centralized createProject
      if (!result) throw new Error("Falha ao salvar evento");
      showSuccess("Projeto criado com sucesso");
      await fetchClients();
      await refreshEmployees();
      qc.invalidateQueries({ queryKey: ['events'] }); // Invalidate events query
      onCreated?.(result.id);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Erro ao criar projeto:", err);
      showError("Erro ao criar projeto. Verifique os campos e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="max-w-6xl mx-auto max-h-[80vh] overflow-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="np-title"
        >
          <DialogHeader>
            <DialogTitle id="np-title">Novo Projeto</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 pb-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={getId('clientId')}>Cliente *</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Combobox
                              options={clientOptions}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Selecione um cliente"
                              searchPlaceholder="Pesquisar cliente..."
                              className="flex-1"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsCreateClientOpen(true)} 
                              title="Criar Novo Cliente"
                              aria-label="Criar Novo Cliente"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={getId('name')}>Nome do Projeto *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            id={getId('name')}
                            name="name"
                            autoComplete="off"
                            ref={firstFieldRef}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="responsibleId" render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={getId('responsibleId')} id={getId('responsibleId-label')}>Responsável Comercial</FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger 
                              id={getId('responsibleId')}
                              aria-labelledby={getId('responsibleId-label')}
                            >
                              <SelectValue placeholder="Selecione um responsável" />
                            </SelectTrigger>
                            <SelectContent>
                              {responsibleUserOptions.map(u => (
                                <SelectItem key={u.value} value={u.value}>
                                  {u.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={getId('startDate')}>Data de Início *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            id={getId('startDate')}
                            name="startDate"
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="startTime" render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={getId('startTime')}>Hora de Início *</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field} 
                            id={getId('startTime')}
                            name="startTime"
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="endDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={getId('endDate')}>Data de Fim</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            id={getId('endDate')}
                            name="endDate"
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="endTime" render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={getId('endTime')}>Hora de Fim</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field} 
                            id={getId('endTime')}
                            name="endTime"
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="nextActionDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={getId('nextActionDate')}>Próxima Ação - Data</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            id={getId('nextActionDate')}
                            name="nextActionDate"
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="nextActionTime" render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={getId('nextActionTime')}>Próxima Ação - Hora</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field} 
                            id={getId('nextActionTime')}
                            name="nextActionTime"
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="location" render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={getId('location')}>Local *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            id={getId('location')}
                            name="location"
                            autoComplete="street-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="estimatedValue" render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={getId('estimatedValue')}>Valor Estimado</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            id={getId('estimatedValue')}
                            name="estimatedValue"
                            autoComplete="off"
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                </div>

            <div className="space-y-4">
              <div>
                <Label id={getId('serviceIds-label')} className="text-sm font-medium mb-2 block">
                  Serviços de Interesse *
                </Label>
                <FormField control={form.control} name="serviceIds" render={({ field }) => (
                  <FormControl>
                    <MultiSelectServices 
                      selected={field.value} 
                      onChange={field.onChange} 
                      placeholder="Selecione serviços..."
                      aria-labelledby={getId('serviceIds-label')}
                    />
                  </FormControl>
                )} />
              </div>

              <div>
                <Label id={getId('pipelinePhaseId-label')} className="text-sm font-medium mb-2 block">
                  Fase do Pipeline *
                </Label>
                <FormField control={form.control} name="pipelinePhaseId" render={({ field }) => (
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger 
                        id={getId('pipelinePhaseId')}
                        aria-labelledby={getId('pipelinePhaseId-label')}
                      >
                        <SelectValue placeholder="Selecione a fase" />
                      </SelectTrigger>
                      <SelectContent>
                        {pipelineOptions.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                )} />
              </div>

              <div>
                <Label htmlFor={getId('notes')} className="text-sm font-medium mb-2 block">
                  Observações
                </Label>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormControl>
                    <Textarea 
                      rows={8} 
                      {...field} 
                      id={getId('notes')}
                      name="notes"
                      autoComplete="off"
                    />
                  </FormControl>
                )} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 px-4 pb-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar Projeto"}
            </Button>
          </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <CreateClientModal open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen} />
    </>
  );
}