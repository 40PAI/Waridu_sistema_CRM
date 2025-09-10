import { useState, useEffect } from "react";
import { Event, Roster, Expense } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

export const useEvents = () => {
  const initialEvents: Event[] = [
    { id: 1, name: "Conferência Anual de Tecnologia", startDate: "2024-08-15", endDate: "2024-08-17", location: "Centro de Convenções", startTime: "09:00", endTime: "18:00", revenue: 50000, expenses: [{id: 'exp1', description: 'Catering', amount: 5000}], status: 'Concluído', description: 'Evento anual para discutir as novas tendências em tecnologia.' },
    { id: 2, name: "Lançamento do Produto X", startDate: "2024-09-01", endDate: "2024-09-01", location: "Sede da Empresa", startTime: "19:00", endTime: "22:00", revenue: 25000, status: 'Planejado' },
    { id: 3, name: "Workshop de Marketing Digital", startDate: "2024-09-10", endDate: "2024-09-12", location: "Online", startTime: "14:00", endTime: "17:00", revenue: 10000, status: 'Planejado' },
    { id: 4, name: "Festa de Fim de Ano", startDate: "2024-12-20", endDate: "2024-12-20", location: "Salão de Festas", startTime: "20:00", revenue: 75000, status: 'Cancelado' },
    { id: 5, name: "Imersão de Vendas Q3", startDate: "2024-09-09", endDate: "2024-09-13", location: "Hotel Fazenda", status: "Em Andamento", description: "Treinamento intensivo para a equipe de vendas." },
  ];

  const [events, setEvents] = useState<Event[]>(() => {
    try {
      const storedEvents = localStorage.getItem('events');
      return storedEvents ? JSON.parse(storedEvents) : initialEvents;
    } catch (error) {
      console.error("Failed to parse events from localStorage", error);
      return initialEvents;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('events', JSON.stringify(events));
    } catch (error) {
      console.error("Failed to save events to localStorage", error);
    }
  }, [events]);

  const addEvent = (newEventData: Omit<Event, 'id' | 'roster' | 'expenses' | 'status'>) => {
    setEvents(prevEvents => [
      ...prevEvents,
      { ...newEventData, id: prevEvents.length > 0 ? Math.max(...prevEvents.map(e => e.id)) + 1 : 1, status: 'Planejado' }
    ]);
  };

  const updateEvent = (updatedEvent: Event) => {
    setEvents(prevEvents => {
      const prev = prevEvents.find(e => e.id === updatedEvent.id);
      const becameConcluded = prev && prev.status !== 'Concluído' && updatedEvent.status === 'Concluído';
      // In a real app, this would be handled by a separate hook for allocation history
      return prevEvents.map(event =>
        event.id === updatedEvent.id ? updatedEvent : event
      );
    });
  };

  const updateEventDetails = (eventId: number, details: { roster: Roster; expenses: Expense[] }) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId ? { ...event, roster: details.roster, expenses: details.expenses } : event
      )
    );
  };

  return {
    events,
    addEvent,
    updateEvent,
    updateEventDetails
  };
};