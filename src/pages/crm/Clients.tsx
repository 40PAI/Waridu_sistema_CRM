"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClients } from "@/hooks/useClients";
import { useEvents } from "@/hooks/useEvents";
import { useCommunications } from "@/hooks/useCommunications";
import { useServices } from "@/hooks/useServices";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { MultiSelectServices } from "@/components/MultiSelectServices";
import { Checkbox } from "@/components/ui/checkbox";
import CreateClientModal from "@/components/crm/CreateClientModal";
import ClientDetailModal from "@/components/crm/ClientDetailModal";
import { useState } from "react";
import { showSuccess } from "@/utils/toast";
import { format, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

const ClientsPage = () => {
  const { clients, fetchClients } = useClients();
  const { events } = useEvents();
  const { communications } = useCommunications();
  const { services, activeServices } = useServices();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Modal state for "Ver"
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Filtros - Relacionados ao Cliente
  const [empresa, setEmpresa] = useState("");
  const [cargo, setCargo] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [nif, setNif] = useState("");

  // Relacionamento Comercial
  const [cicloVida, setCicloVida] = useState("");
  const [dataCriacao, setDataCriacao] = useState<any>(undefined);
  const [ultimaAtividade, setUltimaAtividade] = useState<any>(undefined);
  const [responsavel, setResponsavel] = useState("");
  const [canalOrigem, setCanalOrigem] = useState("");

  // Projetos Associados
  const [numeroProjetos, setNumeroProjetos] = useState("");
  const [statusProjetos, setStatusProjetos] = useState<string[]>([]);
  const [receitaMin, setReceitaMin] = useState("");
  const [receitaMax, setReceitaMax] = useState("");
  const [frequenciaRecorrencia, setFrequenciaRecorrencia] = useState("");

  // Toggles para ativar filtros
  const [activeFilters, setActiveFilters] = useState({
    empresa: false,
    cargo: false,
    localizacao: false,
    nif: false,
    cicloVida: false,
    dataCriacao: false,
    ultimaAtividade: false,
    responsavel: false,
    canalOrigem: false,
    numeroProjetos: false,
    statusProjetos: false,
    receita: false,
    frequenciaRecorrencia: false,
  });

  const [filteredClients, setFilteredClients] = useState(clients);

  const openView = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsViewOpen(true);
  };

  const closeView = () => {
    setIsViewOpen(false);
    setSelectedClientId(null);
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;
  const selectedClientEvents = selectedClientId ? events.filter((e) => e.client_id === selectedClientId) : [];
  const selectedClientCommunications = selectedClientId ? communications.filter((c) => c.client_id === selectedClientId) : [];

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setIsCreateOpen(true);
  };

  const handleCreateClient = () => {
    setEditingClient(null);
    setIsCreateOpen(true);
  };

  const handleClientCreated = (clientId: string) => {
    setCreatedClientId(clientId);
    showSuccess("Cliente criado! Quer criar um projeto para ele?");
  };

  const handleCreateProjectForClient = () => {
    if (createdClientId) {
      setIsProjectModalOpen(true);
    }
  };

  // Helper maps
  const clientEventsMap = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    events.forEach(e => {
      if (e.client_id) {
        if (!map[e.client_id]) map[e.client_id] = [];
        map[e.client_id].push(e);
      }
    });
    return map;
  }, [events]);

  const clientCommunicationsMap = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    communications.forEach(c => {
      if (c.client_id) {
        if (!map[c.client_id]) map[c.client_id] = [];
        map[c.client_id].push(c);
      }
    });
    return map;
  }, [communications]);

  const applyFilters = () => {
    const filtered = clients.filter((c) => {
      // Relacionados ao Cliente
      if (activeFilters.empresa && empresa && !(c.company || "").toLowerCase().includes(empresa.toLowerCase())) return false;
      if (activeFilters.cargo && cargo && c.persona !== cargo) return false;
      if (activeFilters.localizacao && localizacao && !(c.address || "").toLowerCase().includes(localizacao.toLowerCase())) return false;
      if (activeFilters.nif && nif && !(c.nif || "").includes(nif)) return false;

      // Relacionamento Comercial
      if (activeFilters.cicloVida && cicloVida && c.lifecycle_stage !== cicloVida) return false;
      if (activeFilters.dataCriacao && dataCriacao?.from && dataCriacao?.to && (!c.created_at || !isWithinInterval(parseISO(c.created_at), { start: dataCriacao.from, end: dataCriacao.to }))) return false;
      const clientComms = clientCommunicationsMap[c.id] || [];
      const lastActivity = clientComms.length > 0 ? clientComms[0].date : null;
      if (activeFilters.ultimaAtividade && ultimaAtividade?.from && ultimaAtividade?.to && (!lastActivity || !isWithinInterval(parseISO(lastActivity), { start: ultimaAtividade.from, end: ultimaAtividade.to }))) return false;
      if (activeFilters.responsavel && responsavel && !c.responsavel?.toLowerCase().includes(responsavel.toLowerCase())) return false; // Placeholder
      if (activeFilters.canalOrigem && canalOrigem && c.canal_origem !== canalOrigem) return false; // Placeholder

      // Projetos Associados
      const clientEvents = clientEventsMap[c.id] || [];
      const numProjetos = clientEvents.length;
      if (activeFilters.numeroProjetos && numeroProjetos) {
        if (numeroProjetos === "0" && numProjetos !== 0) return false;
        if (numeroProjetos === "1" && numProjetos !== 1) return false;
        if (numeroProjetos === "2+" && numProjetos < 2) return false;
      }
      if (activeFilters.statusProjetos && statusProjetos.length > 0 && !clientEvents.some(e => statusProjetos.includes(e.status))) return false;
      const totalRevenue = clientEvents.reduce((sum, e) => sum + (e.estimated_value || 0), 0);
      if (activeFilters.receita && ((receitaMin && totalRevenue < Number(receitaMin)) || (receitaMax && totalRevenue > Number(receitaMax)))) return false;
      if (activeFilters.frequenciaRecorrencia && frequenciaRecorrencia && c.frequencia_recorrencia !== frequenciaRecorrencia) return false; // Placeholder

      return true;
    });
    setFilteredClients(filtered);
  };

  const clearFilters = () => {
    setEmpresa("");
    setCargo("");
    setLocalizacao("");
    setNif("");
    setCicloVida("");
    setDataCriacao(undefined);
    setUltimaAtividade(undefined);
    setResponsavel("");
    setCanalOrigem("");
    setNumeroProjetos("");
    setStatusProjetos([]);
    setReceitaMin("");
    setReceitaMax("");
    setFrequenciaRecorrencia("");
    setActiveFilters({
      empresa: false,
      cargo: false,
      localizacao: false,
      nif: false,
      cicloVida: false,
      dataCriacao: false,
      ultimaAtividade: false,
      responsavel: false,
      canalOrigem: false,
      numeroProjetos: false,
      statusProjetos: false,
      receita: false,
      frequenciaRecorrencia: false,
    });
    setFilteredClients(clients);
  };

  const activeFiltersCount = Object.values(activeFilters).filter(Boolean).length;

  // Service name map for display
  const serviceNameById = React.useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach(s => (map[s.id] = s.name));
    return map;
  }, [services]);

  React.useEffect(() => {
    setFilteredClients(clients);
  }, [clients]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-sm text-muted-foreground">Gerencie clientes, histórico e ciclo de vida.</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreateClient}>+ Novo Cliente</Button>
          </div>
        </div>

        {createdClientId && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-sm text-green-800">Cliente criado com sucesso! Quer criar um projeto para ele?</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={handleCreateProjectForClient}>Criar Projeto</Button>
                <Button size="sm" variant="outline" onClick={() => setCreatedClientId(null)}>Depois</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros Avançados */}
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
                      <Checkbox checked={activeFilters.empresa} onCheckedChange={(checked) => setActiveFilters(prev => ({ ...prev, empresa: !!checked }))} />
                      <label className="text-sm font-medium">Empresa</label>
                    </div>
                    {activeFilters.empresa && (
                      <Input placeholder="Buscar empresa..." value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={activeFilters.cargo} onCheckedChange={(checked) => setActiveFilters(prev => ({ ...prev, cargo: !!checked }))} />
                      <label className="text-sm font-medium">Cargo/Departamento</label>
                    </div>
                    {activeFilters.cargo && (
                      <Select value={cargo} onValueChange={setCargo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CEO">CEO</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Produção">Produção</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={activeFilters.localizacao} onCheckedChange={(checked) => setActiveFilters(prev => ({ ...prev, localizacao: !!checked }))} />
                      <label className="text-sm font-medium">Localização</label>
                    </div>
                    {activeFilters.localizacao && (
                      <Input placeholder="Cidade/país..." value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} />
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={activeFilters.nif} onCheckedChange={(checked) => setActiveFilters(prev => ({ ...prev, nif: !!checked }))} />
                      <label className="text-sm font-medium">NIF</label>
                    </div>
                    {activeFilters.nif && (
                      <Input placeholder="Número fiscal..." value={nif} onChange={(e) => setNif(e.target.value)} />
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="relacionamento">
                <AccordionTrigger>Relacionamento Comercial</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={activeFilters.cicloVida} onCheckedChange={(checked) => setActiveFilters(prev => ({ ...prev, cicloVida: !!checked }))} />
                      <label className="text-sm font-medium">Ciclo de Vida</label>
                    </div>
                    {activeFilters.cicloVida && (
                      <Select value={cicloVida} onValueChange={setCicloVida}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Lead">Lead</SelectItem>
                          <SelectItem value="MQL">MQL</SelectItem>
                          <SelectItem value="SQL">SQL</SelectItem>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Perdido">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={activeFilters.dataCriacao} onCheckedChange={(checked) => setActiveFilters(prev => ({ ...prev, dataCriacao: !!checked }))} />
                      <label className="text-sm font-medium">Data de Criação</label>
                    </div>
                    {activeFilters.dataCriacao && (
                      <DateRangePicker date={dataCriacao} onDateChange={setDataCriacao} />
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={activeFilters.ultimaAtividade} onCheckedChange={(checked) => setActiveFilters(prev => ({ ...prev, ultimaAtividade: !!checked }))} />
                      <label className="text-sm font-medium">Última Atividade</label>
                    </div>
                    {activeFilters.ultimaAtividade && (
                      <DateRangePicker date={ultimaAtividade} onDateChange={setUltimaAtividade} />
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={activeFilters.responsavel} onCheckedChange={(checked) => setActiveFilters(prev => ({ ...prev, responsavel: !!checked }))} />
                      <label className="text-sm font-medium">Responsável</label>
                    </div>
                    {activeFilters.responsavel && (
                      <Input placeholder="Nome do responsável..." value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={activeFilters.canalOrigem} onCheckedChange={(checked) => setActiveFilters(prev => ({ ...prev, canalOrigem: !!checked }))} />
                      <label className="text-sm font-medium">Canal de Origem</label>
                    </div>
                    {activeFilters.canalOrigem && (
                      <Select value={canalOrigem} onValueChange={setCanalOrigem}>
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
                      <Checkbox checked={activeFilters.numeroProjetos} onCheckedChange={(checked) => setActiveFilters(prev => ({ ...prev, numeroProjetos: !!checked }))} />
                      <label className="text-sm font-medium">Número de Projetos</label>
                    </div>
                    {activeFilters.numeroProjetos && (
                      <Select value={numeroProjetos} onValueChange={setNumeroProjetos}>
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
                      <Checkbox checked={activeFilters.statusProjetos} onCheckedChange={(checked) => setActiveFilters(prev => ({ ...prev, statusProjetos: !!checked }))} />
                      <label className="text-sm font-medium">Status dos Projetos</label>
                    </div>
                    {activeFilters.statusProjetos && (
                      <MultiSelectServices selected={statusProjetos} onChange={setStatusProjetos} placeholder="Selecione status..." />
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={activeFilters.receita} onCheckedChange={(checked) => setActiveFilters(prev => ({ ...prev, receita: !!checked }))} />
                      <label className="text-sm font-medium">Receita Total (AOA)</label>
                    </div>
                    {activeFilters.receita && (
                      <div className="flex gap-2">
                        <Input placeholder="Min" value={receitaMin} onChange={(e) => setReceitaMin(e.target.value)} />
                        <Input placeholder="Max" value={receitaMax} onChange={(e) => setReceitaMax(e.target.value)} />
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={activeFilters.frequenciaRecorrencia} onCheckedChange={(checked) => setActiveFilters(prev => ({ ...prev, frequenciaRecorrencia: !!checked }))} />
                      <label className="text-sm font-medium">Frequência de Recorrência</label>
                    </div>
                    {activeFilters.frequenciaRecorrencia && (
                      <Select value={frequenciaRecorrencia} onValueChange={setFrequenciaRecorrencia}>
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
              <Button variant="outline" onClick={clearFilters}>Limpar Filtros</Button>
              <Button onClick={applyFilters}>Aplicar Filtros</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes ({filteredClients.length})</CardTitle>
            <CardDescription>Abrir a ficha do cliente em um modal para ver detalhes rapidamente.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>{c.sector || "—"}</TableCell>
                      <TableCell>{c.lifecycle_stage || "Lead"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(c.service_ids || []).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {serviceNameById[tag] || tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openView(c.id)}>
                            Ver
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditClient(c)}>
                            Editar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateClientModal
        open={isCreateOpen}
        onOpenChange={(v) => {
          setIsCreateOpen(v);
          if (!v) setEditingClient(null);
          if (!v) {
            fetchClients();
          }
        }}
        onCreated={handleClientCreated}
        client={editingClient}
      />

      <ClientDetailModal
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        client={selectedClient}
        communications={selectedClientCommunications}
      />
    </>
  );
};

export default ClientsPage;