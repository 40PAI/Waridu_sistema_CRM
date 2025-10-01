import { useMemo } from "react";

/**
 * Hook para gerar IDs únicos e estáveis por componente
 * @param prefix Prefixo para o ID (ex: "form", "modal", "dialog")
 * @returns Função para gerar IDs únicos baseados no prefixo e campo
 * 
 * @example
 * const getId = useAutoId('registration-form');
 * const nameId = getId('name'); // "registration-form-name-abc123"
 * const emailId = getId('email'); // "registration-form-email-abc123"
 */
export function useAutoId(prefix: string) {
  const generateId = useMemo(() => {
    // Gerar ID único por instância do componente
    const instanceId = Math.random().toString(36).substr(2, 6);
    
    return (fieldName: string): string => {
      return `${prefix}-${fieldName}-${instanceId}`;
    };
  }, [prefix]);
  
  return generateId;
}