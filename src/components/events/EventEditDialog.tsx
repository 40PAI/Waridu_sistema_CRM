import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Event } from "@/types";
import { showSuccess, showError } from "@/utils/toast";

interface EventEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onSave: (updatedEvent: Event) => void;
}

export function EventEditDialog({ open, onOpenChange, event, onSave }: EventEditDialogProps) {
  const [eventName, setEventName] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [eventLocation, setEventLocation] = React.useState("");
  const [revenue, setRevenue] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    if (event) {
      setEventName(event.name);
      setStartDate(event.startDate);
      setEndDate(event.endDate || "");
      setStartTime(event.startTime || "");
      setEndTime(event.endTime || "");
      setEventLocation(event.location);
      setRevenue(event.revenue);
    }
  }, [event]);

  const handleSubmit = () => {
    if (!eventName || !startDate || !eventLocation) {
      showError("Nome, Data de Início e Local são obrigatórios.");
      return;
    }

    const updatedEvent: Event = {
      ...event,
      name: eventName,
      startDate: startDate,
      endDate: endDate || startDate,
      startTime: startTime,
      endTime: endTime,
      location: eventLocation,
      revenue: revenue,
    };

    onSave(updatedEvent);
    showSuccess("Evento atualizado com sucesso!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do evento abaixo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="eventName">Nome do Evento</Label>
            <Input id="eventName" value={eventName} onChange={(e) => setEventName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Fim</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Hora de Início</Label>
              <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Hora de Fim</Label>
              <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventLocation">Local do Evento</Label>
            <Input id="eventLocation" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="revenue">Receita Bruta do Evento (AOA)</Label>
            <Input id="revenue" type="number" value={revenue || ''} onChange={(e) => setRevenue(e.target.value ? Number(e.target.value) : undefined)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={handleSubmit}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}