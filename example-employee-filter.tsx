/**
 * Exemplo prático de uso da função getComercialEmployeeOptions()
 * 
 * Este exemplo mostra como usar a função para filtrar employees comerciais
 * e exibi-los em um Select component dentro do formulário de projeto.
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';

// Importações necessárias
import { useEmployees } from '@/hooks/useEmployees';
import { NewProjectForm, NewProjectFormSchema, getComercialEmployeeOptions } from '@/utils/clientMappers';

export function ProjectFormExample() {
  // Hook para carregar todos os employees
  const { data: allEmployees = [], isLoading: isLoadingEmployees } = useEmployees();

  // Filtrar apenas employees com role="Comercial" e mapear para options
  const commercialEmployeeOptions = getComercialEmployeeOptions(allEmployees);

  const form = useForm<NewProjectForm>({
    resolver: zodResolver(NewProjectFormSchema),
    defaultValues: {
      projectName: '',
      startDate: '',
      location: '',
      clientId: '',
      services: [],
      pipelineStatus: '',
      responsável: '', // Este campo será ignorado na inserção na BD (não existe na DDL)
    },
  });

  const onSubmit = (data: NewProjectForm) => {
    console.log('Dados do formulário:', data);
    console.log('Responsável selecionado:', data.responsável);
    
    // Nota: quando enviar para database usando formToEventsInsert(),
    // o campo 'responsável' será ignorado pois não existe na tabela events
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Outros campos do formulário... */}
        
        {/* Campo Responsável - filtra apenas employees comerciais */}
        <FormField
          control={form.control}
          name="responsável"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsável Comercial</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoadingEmployees}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        isLoadingEmployees 
                          ? "A carregar employees..." 
                          : "Selecionar responsável comercial"
                      } 
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {commercialEmployeeOptions.map((employee) => (
                    <SelectItem key={employee.value} value={employee.value}>
                      {employee.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoadingEmployees}>
          Criar Projeto
        </Button>
      </form>
    </Form>
  );
}

/**
 * EXEMPLO DE SAÍDA:
 * 
 * Se tivermos os seguintes employees na base de dados:
 * - João Silva (role: "Comercial") → aparece no dropdown
 * - Maria Santos (role: "Técnico") → NÃO aparece no dropdown  
 * - Pedro Costa (role: "Comercial") → aparece no dropdown
 * - Ana Lima (role: "Administrativo") → NÃO aparece no dropdown
 * 
 * O Select irá mostrar apenas:
 * - João Silva
 * - Pedro Costa
 * 
 * Quando o utilizador selecionar um responsável, o valor será o UUID do employee,
 * mas este campo será ignorado na função formToEventsInsert() pois não existe
 * na tabela events da base de dados.
 */