import { useMemo } from 'react';

/**
 * Hook para gerar IDs únicos e estáveis para campos de formulário
 * Garante acessibilidade com htmlFor/id corretos
 * 
 * @param prefix - Prefixo para identificar o componente (ex: 'np' para NewProject)
 * @returns Função que gera IDs únicos para cada campo
 */
export function useIdPrefix(prefix: string) {
  const generateId = useMemo(() => {
    const instanceId = Math.random().toString(36).substr(2, 6);
    
    return (fieldName: string): string => {
      return `${prefix}-${fieldName}-${instanceId}`;
    };
  }, [prefix]);

  return generateId;
}