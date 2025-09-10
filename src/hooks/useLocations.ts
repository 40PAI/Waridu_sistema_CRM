import { useState } from "react";
import { Location } from "@/types";

export const useLocations = () => {
  const initialLocations: Location[] = [
    { id: 'loc-1', name: 'Armazém' },
    { id: 'loc-2', name: 'Estúdio A' },
  ];

  const [locations, setLocations] = useState<Location[]>(initialLocations);

  const addLocation = (name: string) => {
    const id = `loc-${Date.now()}`;
    setLocations(prev => [...prev, { id, name }]);
  };

  const updateLocation = (id: string, name: string) => {
    setLocations(prev => prev.map(l => l.id === id ? { ...l, name } : l));
  };

  const deleteLocation = (id: string) => {
    setLocations(prev => {
      if (prev.length <= 1) {
        console.warn("Não é possível remover a única localização existente.");
        return prev;
      }
      const remaining = prev.filter(l => l.id !== id);
      const fallback = remaining[0];
      // In a real app, we would update materials to move items to the fallback location
      return remaining;
    });
  };

  return {
    locations,
    addLocation,
    updateLocation,
    deleteLocation
  };
};