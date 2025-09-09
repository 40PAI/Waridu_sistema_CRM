import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";

interface CreateEventPageProps {
  onAddEvent: (event: { 
    name: string; 
    date: string; 
    endDate: string; 
    location: string;
    startTime: string;
    endTime: string;
    revenue?: number;
  }) => void;
}

const CreateEventPage = ({ onAddEvent }: CreateEventPageProps) => {
  const navigate = useNavigate();
  const [eventName, setEventName] = React.useState("");
  const [eventDate, setEventDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [eventLocation, setEventLocation] = React.useState("");
  const [revenue, setRevenue] = React.useState<number | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName || !eventDate || !eventLocation) {
      showError("Por favor, preencha os campos obrigatórios: Nome, Data de Início e Local.");
      return;
    }

    onAddEvent({
      name: eventName,
      date: eventDate,
      endDate: endDate,
      location: eventLocation,
      startTime: startTime,
      endTime: endTime,
      revenue: revenue,
    });

    showSuccess("Evento criado com sucesso!");
    navigate("/roster-management");
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
            <Label htmlFor="eventName">Nome do Evento</Label>
            <Input id="eventName" placeholder="Ex: Conferência Anual de Tecnologia" value={eventName} onChange={(e) => setEventName(e.target.value)} />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Data de Início</Label>
              <Input id="eventDate" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="startTime">Hora de Início</Label>
              <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Fim</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Hora de Fim</Label>
              <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventLocation">Local do Evento</Label>
            <Input id="eventLocation" placeholder="Ex: Centro de Convenções Morumbi" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input id="clientName" placeholder="Ex: Empresa Acme" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Pessoa de Contato</Label>
              <Input id="contactPerson" placeholder="Ex: João da Silva" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="revenue">Receita Bruta do Evento (AOA)</Label>
            <Input id="revenue" type="number" placeholder="Ex: 50000" value={revenue || ''} onChange={(e) => setRevenue(e.target.value ? Number(e.target.value) : undefined)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observações Adicionais</Label>
            <Textarea id="observations" placeholder="Qualquer detalhe importante, como horários de montagem, restrições do local, etc." />
          </div>

          <Button className="w-full" size="lg" type="submit">Criar Evento</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateEventPage;