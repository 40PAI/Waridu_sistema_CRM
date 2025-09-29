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
import { useAutoId } from "@/hooks/useAutoId";
import { formToEventsUpdate } from "@/utils/eventMappers";

interface EventEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onSave: (updatedEvent: Event) => void;
}

export function EventEditDialog({ open, onOpenChange, event, onSave }: EventEditDialogProps) {
  // Generate unique IDs for form fields
  const getId = useAutoId('event-edit');
  
  // Ref for first field focus
  const firstFieldRef = React.useRef<HTMLInputElement>(null);
  
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
      
      // Focus first field for accessibility when dialog opens
      if (open) {
        setTimeout(() => {
          firstFieldRef.current?.focus();
        }, 100);
      }
    }
  }, [event, open]);

  const handleSubmit = () => {
    if (!eventName || !startDate || !eventLocation || !startTime || !endTime) {
      showError("Nome, Data de Início, Local, Hora de Início e Hora de Fim são obrigatórios.");
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
      <DialogContent 
        className="sm:max-w-[600px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={getId('title')}
        aria-describedby={getId('description')}
      >
        <DialogHeader>
          <DialogTitle id={getId('title')}>Editar Evento</DialogTitle>
          <DialogDescription id={getId('description')}>
            Atualize os detalhes do evento abaixo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor={getId('name')}>Nome do Evento</Label>
            <Input 
              id={getId('name')} 
              name="eventName"
              autoComplete="off"
              value={eventName} 
              onChange={(e) => setEventName(e.target.value)}
              ref={firstFieldRef}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={getId('start-date')}>Data de Início</Label>
              <Input 
                id={getId('start-date')} 
                name="startDate"
                type="date" 
                autoComplete="off"
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={getId('end-date')}>Data de Fim</Label>
              <Input 
                id={getId('end-date')} 
                name="endDate"
                type="date" 
                autoComplete="off"
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={getId('start-time')}>Hora de Início *</Label>
              <Input 
                id={getId('start-time')} 
                name="startTime"
                type="time" 
                autoComplete="off"
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={getId('end-time')}>Hora de Fim *</Label>
              <Input 
                id={getId('end-time')} 
                name="endTime"
                type="time" 
                autoComplete="off"
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={getId('location')}>Local do Evento</Label>
            <Input 
              id={getId('location')} 
              name="eventLocation"
              autoComplete="street-address"
              value={eventLocation} 
              onChange={(e) => setEventLocation(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={getId('revenue')}>Receita Bruta do Evento (AOA)</Label>
            <Input 
              id={getId('revenue')} 
              name="revenue"
              type="number" 
              autoComplete="off"
              value={revenue || ''} 
              onChange={(e) => setRevenue(e.target.value ? Number(e.target.value) : undefined)} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={handleSubmit}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}