"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { MultiSelectServices } from "@/components/MultiSelectServices";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { ClientFilters, ActiveFilters } from "@/hooks/useClientFilters";

interface ClientFiltersProps {
  filters: ClientFilters;
  activeFilters: ActiveFilters;
  activeFiltersCount: number;
  onUpdateFilter: (key: keyof ClientFilters, value: any) => void;
  onToggleActiveFilter: (key: keyof ActiveFilters) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
}

const ClientFilters: React.FC<ClientFiltersProps> = ({
  filters,
  activeFilters,
  activeFiltersCount,
  onUpdateFilter,
  onToggleActiveFilter,
  onClearFilters,
  onApplyFilters,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Filtros Avançados
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount} filtro(s) ativo(s)</Badge>
          )}
        </CardTitle>
        <CardDescription>Selecione e configure os filtros que deseja aplicar.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={["cliente", "relacionamento", "projetos"]} className="w-full">
          <AccordionItem value="cliente">
            <AccordionTrigger>Relacionados ao Cliente</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox checked={activeFilters.nome} onCheckedChange={() => onToggleActiveFilter("nome")} />
                  <label className="text-sm font-medium">Nome</label>
                </div>
                {activeFilters.nome && (
                  <Input placeholder="Buscar por nome..." value={filters.nome} onChange={(e) => onUpdateFilter("nome", e.target.value)} />
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox checked={activeFilters.empresa} onCheckedChange={() => onToggleActiveFilter("empresa")} />
                  <label className="text-sm font-medium">Empresa</label>
                </div>
                {activeFilters.empresa && (
                  <Input placeholder="Buscar empresa..." value={filters.empresa} onChange={(e) => onUpdateFilter("empresa", e.target.value)} />
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox checked={activeFilters.setor} onCheckedChange={() => onToggleActiveFilter("setor")} />
                  <label className="text-sm font-medium">Setor</label>
                </div>
                {activeFilters.setor && (
                  <Input placeholder="Buscar por setor..." value={filters.setor} onChange={(e) => onUpdateFilter("setor", e.target.value)} />
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox checked={activeFilters.funcao} onCheckedChange={() => onToggleActiveFilter("funcao")} />
                  <label className="text-sm font-medium">Função na Empresa</label>
                </div>
                {activeFilters.funcao && (
                  <Input placeholder="Buscar por função..." value={filters.funcao} onChange={(e) => onUpdateFilter("funcao", e.target.value)} />
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox checked={activeFilters.localizacao} onCheckedChange={() => onToggleActiveFilter("localizacao")} />
                  <label className="text-sm font-medium">Localização</label>
                </div>
                {activeFilters.localizacao && (
                  <Input placeholder="Cidade/país..." value={filters.localizacao} onChange={(e) => onUpdateFilter("localizacao", e.target.value)} />
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox checked={activeFilters.nif} onCheckedChange={() => onToggleActiveFilter("nif")} />
                  <label className="text-sm font-medium">NIF</label>
                </div>
                {activeFilters.nif && (
                  <Input placeholder="Número fiscal..." value={filters.nif} onChange={(e) => onUpdateFilter("nif", e.target.value)} />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="relacionamento">
            <AccordionTrigger>Relacionamento Comercial</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox checked={activeFilters.cicloVida} onCheckedChange={() => onToggleActiveFilter("cicloVida")} />
                  <label className="text-sm font-medium">Ciclo de Vida</label>
                </div>
                {activeFilters.cicloVida && (
                  <Select value={filters.cicloVida} onValueChange={(v) => onUpdateFilter("cicloVida", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Oportunidade">Oportunidade</SelectItem>
                      <SelectItem value="Cliente Ativo">Cliente Ativo</SelectItem>
                      <SelectItem value="Cliente Perdido">Cliente Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox checked={activeFilters.dataCriacao} onCheckedChange={() => onToggleActiveFilter("dataCriacao")} />
                  <label className="text-sm font-medium">Data de Criação</label>
                </div>
                {activeFilters.dataCriacao && (
                  <DateRangePicker date={filters.dataCriacao} onDateChange={(date) => onUpdateFilter("dataCriacao", date)} />
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox checked={activeFilters.ultimaAtividade} onCheckedChange={() => onToggleActiveFilter("ultimaAtividade")} />
                  <label className="text-sm font-medium">Última Atividade</label>
                </div>
                {activeFilters.ultimaAtividade && (
                  <DateRangePicker date={filters.ultimaAtividade} onDateChange={(date) => onUpdateFilter("ultimaAtividade", date)} />
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox checked={activeFilters.servicosInteresse} onCheckedChange={() => onToggleActiveFilter("servicosInteresse")} />
                  <label className="text-sm font-medium">Serviços de Interesse</label>
                </div>
                {activeFilters.servicosInteresse && (
                  <MultiSelectServices 
                    selected={filters.servicosInteresse} 
                    onChange={(selected) => onUpdateFilter("servicosInteresse", selected)} 
                    placeholder="Selecione serviços..." 
                  />
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox checked={activeFilters.responsavel} onCheckedChange={() => onToggleActiveFilter("responsavel")} />
                  <label className="text-sm font-medium">Responsável</label>
                </div>
                {activeFilters.responsavel && (
                  <Input placeholder="Nome do responsável..." value={filters.responsavel} onChange={(e) => onUpdateFilter("responsavel", e.target.value)} />
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox checked={activeFilters.canalOrigem} onCheckedChange={() => onToggleActiveFilter("canalOrigem")} />
                  <label className="text-sm font-medium">Canal de Origem</label>
                </div>
                {activeFilters.canalOrigem && (
                  <Select value={filters.canalOrigem} onValueChange={(v) => onUpdateFilter("canalOrigem", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feira">Feira</SelectItem>
                      <SelectItem value="Indicação">Indicação</SelectItem>
                      <SelectItem value="Site">Site</SelectItem>
                      <SelectItem value="Email marketing">Email marketing</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="projetos">
            <AccordionTrigger>Projetos Associados</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox checked={activeFilters.numeroProjetos} onCheckedChange={() => onToggleActiveFilter("numeroProjetos")} />
                  <label className="text-sm font-medium">Número de Projetos</label>
                </div>
                {activeFilters.numeroProjetos && (
                  <Select value={filters.numeroProjetos} onValueChange={(v) => onUpdateFilter("numeroProjetos", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2+">2 ou mais</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox checked={activeFilters.statusProjetos} onCheckedChange={() => onToggleActiveFilter("statusProjetos")} />
                  <label className="text-sm font-medium">Status dos Projetos</label>
                </div>
                {activeFilters.statusProjetos && (
                  <MultiSelectServices selected={filters.statusProjetos} onChange={(selected) => onUpdateFilter("statusProjetos", selected)} placeholder="Selecione status..." />
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox checked={activeFilters.receita} onCheckedChange={() => onToggleActiveFilter("receita")} />
                  <label className="text-sm font-medium">Receita Total (AOA)</label>
                </div>
                {activeFilters.receita && (
                  <div className="flex gap-2">
                    <Input placeholder="Min" value={filters.receitaMin} onChange={(e) => onUpdateFilter("receitaMin", e.target.value)} />
                    <Input placeholder="Max" value={filters.receitaMax} onChange={(e) => onUpdateFilter("receitaMax", e.target.value)} />
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox checked={activeFilters.frequenciaRecorrencia} onCheckedChange={() => onToggleActiveFilter("frequenciaRecorrencia")} />
                  <label className="text-sm font-medium">Frequência de Recorrência</label>
                </div>
                {activeFilters.frequenciaRecorrencia && (
                  <Select value={filters.frequenciaRecorrencia} onValueChange={(v) => onUpdateFilter("frequenciaRecorrencia", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1x/mês">1x/mês</SelectItem>
                      <SelectItem value="2x/mês">2x/mês</SelectItem>
                      <SelectItem value="Trimestral">Trimestral</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={onClearFilters}>Limpar Filtros</Button>
          <Button onClick={onApplyFilters}>Aplicar Filtros</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientFilters;