import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";

interface CreateEventPageProps {
  onAddEvent: (event: { 
    name: string; 
    startDate: string; 
    endDate: string; 
    location: string;
    startTime: string;
    endTime: string;
    revenue?: number;
    pipeline_status?: string | null;
    estimated_value?: number;
    client_id?: string;
    service_ids?: string[];
    notes?: string;
  }) => Promise<void> | void; // aceita funções assíncronas também
}

const CreateEventPage = ({ onAddEvent }: CreateEventPageProps) => {
  const navigate = useNavigate();
  const [eventName, setEventName] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [eventLocation, setEventLocation] = React.useState("");
  const [revenue, setRevenue] = React.useState<number | undefined>(undefined);
  const [pipelineStatus, setPipelineStatus] = React.useState("");
  const [estimatedValue, setEstimatedValue] = React.useState<number | undefined>(undefined);
  const [clientId, setClientId] = React.useState("");
  const [serviceIds, setServiceIds] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName || !startDate || !eventLocation || !startTime || !endTime) {
      showError("Por favor, preencha os campos obrigatórios: Nome, Data de Início, Local, Hora de Início e Hora de Fim.");
      return;
    }

    await onAddEvent({
      name: eventName,
      startDate: startDate,
      endDate: endDate || startDate,
      location: eventLocation,
      startTime: startTime,
      endTime: endTime,
      revenue: revenue,
      pipeline_status: pipelineStatus || null,
      estimated_value: estimatedValue,
      client_id: clientId || undefined,
      service_ids: serviceIds,
      notes: notes || undefined,
    });

    showSuccess("Evento criado com sucesso!");
    
    // Navigate to pipeline if it's a commercial project, otherwise to roster management
    if (pipelineStatus) {
      navigate("/crm/pipeline");
    } else {
      navigate("/roster-management");
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Criar Novo Evento</CardTitle>
        <CardDescription>
          Preencha os detalhes abaixo para registrar um novo evento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="event-name">Nome do Evento</Label>
            <Input 
              id="event-name" 
              name="event-name"
              autoComplete="off"
              placeholder="Ex: Conferência Anual de Tecnologia" 
              value={eventName} 
              onChange={(e) => setEventName(e.target.value)} 
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="event-start-date">Data de Início</Label>
              <Input 
                id="event-start-date" 
                name="event-start-date"
                autoComplete="off"
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="event-start-time">Hora de Início *</Label>
              <Input 
                id="event-start-time" 
                name="event-start-time"
                autoComplete="off"
                type="time" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end-date">Data de Fim</Label>
              <Input 
                id="event-end-date" 
                name="event-end-date"
                autoComplete="off"
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end-time">Hora de Fim *</Label>
              <Input 
                id="event-end-time" 
                name="event-end-time"
                autoComplete="off"
                type="time" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-location">Local do Evento</Label>
            <Input 
              id="event-location" 
              name="event-location"
              autoComplete="address-level2"
              placeholder="Ex: Centro de Convenções Morumbi" 
              value={eventLocation} 
              onChange={(e) => setEventLocation(e.target.value)} 
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nome do Cliente</Label>
              <Input 
                id="client-name" 
                name="client-name"
                autoComplete="organization"
                placeholder="Ex: Empresa Acme" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-person">Pessoa de Contato</Label>
              <Input 
                id="contact-person" 
                name="contact-person"
                autoComplete="name"
                placeholder="Ex: João da Silva" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-revenue">Receita Bruta do Evento (AOA)</Label>
            <Input 
              id="event-revenue" 
              name="event-revenue"
              autoComplete="off"
              type="number" 
              placeholder="Ex: 50000" 
              value={revenue || ''} 
              onChange={(e) => setRevenue(e.target.value ? Number(e.target.value) : undefined)} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-pipeline-status">Status Inicial (Pipeline)</Label>
            <Select value={pipelineStatus} onValueChange={setPipelineStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione se é um projeto comercial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Não é projeto comercial</SelectItem>
                <SelectItem value="1º Contato">1º Contato</SelectItem>
                <SelectItem value="Orçamento">Orçamento</SelectItem>
                <SelectItem value="Negociação">Negociação</SelectItem>
                <SelectItem value="Confirmado">Confirmado</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pipelineStatus && (
            <>
              <div className="space-y-2">
                <Label htmlFor="estimated-value">Valor Estimado (AOA)</Label>
                <Input 
                  id="estimated-value" 
                  name="estimated-value"
                  autoComplete="off"
                  type="number" 
                  placeholder="Ex: 30000" 
                  value={estimatedValue || ''} 
                  onChange={(e) => setEstimatedValue(e.target.value ? Number(e.target.value) : undefined)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-id">ID do Cliente</Label>
                <Input 
                  id="client-id" 
                  name="client-id"
                  autoComplete="off"
                  placeholder="Ex: cliente-uuid" 
                  value={clientId} 
                  onChange={(e) => setClientId(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-ids">IDs dos Serviços (separados por vírgula)</Label>
                <Input 
                  id="service-ids" 
                  name="service-ids"
                  autoComplete="off"
                  placeholder="Ex: service-1, service-2" 
                  value={serviceIds.join(', ')} 
                  onChange={(e) => setServiceIds(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="event-observations">Observações Adicionais</Label>
            <Textarea 
              id="event-observations"
              name="event-observations"
              autoComplete="off"
              placeholder="Qualquer detalhe importante, como horários de montagem, restrições do local, etc." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button className="w-full" size="lg" type="submit">Criar Evento</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateEventPage;