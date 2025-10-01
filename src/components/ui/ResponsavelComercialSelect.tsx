"use client";

import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployees } from "@/hooks/useEmployees";
import { getComercialEmployeeOptions } from "@/utils/clientMappers";

interface ResponsavelComercialSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Select component for "Responsável Comercial" field
 * - Filters employees by role="Comercial"
 * - Options format: { label: name, value: id }
 * - Sends only responsible_id (UUID) or null
 */
export function ResponsavelComercialSelect({
  value,
  onChange,
  placeholder = "Selecione um responsável comercial...",
  disabled = false
}: ResponsavelComercialSelectProps) {
  const { activeEmployees, loading } = useEmployees();
  
  // Filter employees by role="Comercial" and map to options format
  const comercialOptions = React.useMemo(() => {
    return getComercialEmployeeOptions(activeEmployees);
  }, [activeEmployees]);

  const handleValueChange = (newValue: string) => {
    // Send only the UUID or clear value
    if (newValue === "clear") {
      onChange("");
    } else {
      onChange(newValue);
    }
  };

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Carregando funcionários..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value || ""} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* Option to clear selection */}
        <SelectItem value="clear">
          <span className="text-muted-foreground">Nenhum responsável</span>
        </SelectItem>
        
        {/* Commercial employees options */}
        {comercialOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
        
        {/* Show message if no commercial employees */}
        {comercialOptions.length === 0 && (
          <SelectItem value="" disabled>
            <span className="text-muted-foreground">Nenhum funcionário comercial encontrado</span>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}