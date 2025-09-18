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

  // Filtros - Relacionamento Comercial
  const [cicloVida, setCicloVida] = useState("");
  const [dataCriacao, setDataCriacao] = useState<any>(undefined);
  const [ultimaAtividade, setUltimaAtividade] = useState<any>(undefined);
  const [responsavel, setResponsavel] = useState("");
  const [canalOrigem, setCanalOrigem] = useState("");

  // Filtros - Projetos Associados
  const [numeroProjetos, setNumeroProjetos] = useState("");
  const [statusProjetos, setStatusProjetos] = useState<string[]>([]);
  const [receitaMin, setReceitaMin] = useState("");
  const [receitaMax, setReceitaMax] = useState("");
  const [frequenciaRecorrencia, setFrequenciaRecorrencia] = useState("");

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

  // Filtered clients
  const filteredClients = React.useMemo(() => {
    return clients.filter((c) => {
      // Relacionados ao Cliente
      const matchesEmpresa = !empresa || (c.company || "").toLowerCase().includes(empresa.toLowerCase());
      const matchesCargo = !cargo || c.persona === cargo;
      const matchesLocalizacao = !localizacao || (c.address || "").toLowerCase().includes(localizacao.toLowerCase());
      const matchesNif = !nif || (c.nif || "").includes(nif);

      // Relacionamento Comercial
      const matchesCiclo = !cicloVida || c.lifecycle_stage === cicloVida;
      const matchesDataCriacao = !dataCriacao?.from || !dataCriacao?.to || (c.created_at && isWithinInterval(parseISO(c.created_at), { start: dataCriacao.from, end: dataCriacao.to }));
      const clientComms = clientCommunicationsMap[c.id] || [];
      const lastActivity = clientComms.length > 0 ? clientComms[0].date : null;
      const matchesUltimaAtividade = !ultimaAtividade?.from || !ultimaAtividade?.to || (lastActivity && isWithinInterval(parseISO(lastActivity), { start: ultimaAtividade.from, end: ultimaAtividade.to }));
      const matchesResponsavel = !responsavel; // Placeholder - assume no field
      const matchesCanal = !canalOrigem; // Placeholder - assume no field

      // Projetos Associados
      const clientEvents = clientEventsMap[c.id] || [];
      const numProjetos = clientEvents.length;
      const matchesNumero = !numeroProjetos || (numeroProjetos === "0" && numProjetos === 0) || (numeroProjetos === "1" && numProjetos === 1) || (numeroProjetos === "2+" && numProjetos >= 2);
      const matchesStatus = statusProjetos.length === 0 || clientEvents.some(e => statusProjetos.includes(e.status));
      const totalRevenue = clientEvents.reduce((sum, e) => sum + (e.estimated_value || 0), 0);
      const matchesReceita = (!receitaMin || totalRevenue >= Number(receitaMin)) && (!receitaMax || totalRevenue <= Number(receitaMax));
      const matchesFrequencia = !frequenciaRecorrencia; // Placeholder - assume no field

      return matchesEmpresa && matchesCargo && matchesLocalizacao && matchesNif &&
             matchesCiclo && matchesDataCriacao && matchesUltimaAtividade && matchesResponsavel && matchesCanal &&
             matchesNumero && matchesStatus && matchesReceita && matchesFrequencia;
    });
  }, [clients, empresa, cargo, localizacao, nif, cicloVida, dataCriacao, ultimaAtividade, responsavel, canalOrigem, numeroProjetos, statusProjetos, receitaMin, receitaMax, frequenciaRecorrencia, clientEventsMap, clientCommunicationsMap]);

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
  };

  const activeFiltersCount = [
    empresa, cargo, localizacao, nif, cicloVida, dataCriacao, ultimaAtividade, responsavel, canalOrigem, numeroProjetos, statusProjetos.length, receitaMin, receitaMax, frequenciaRecorrencia
  ].filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length;

  // Service name map for display
  const serviceNameById = React.useMemo(() => {
    const map: Record<string, string> = {};
    services.forEach(s => (map[s.id] = s.name));
    return map;
  }, [services]);

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
            <CardDescription>Refine a lista de clientes por critérios específicos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={["cliente", "relacionamento", "projetos"]} className="w-full">
              <AccordionItem value="cliente">
                <AccordionTrigger>Relacionados ao Cliente</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Empresa</label>
                      <Input placeholder="Buscar empresa..." value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cargo/Departamento</label>
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
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Localização</label>
                      <Input placeholder="Cidade/país..." value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">NIF</label>
                      <Input placeholder="Número fiscal..." value={nif} onChange={(e) => setNif(e.target.value)} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="relacionamento">
                <AccordionTrigger>Relacionamento Comercial</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ciclo de Vida</label>
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
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data de Criação</label>
                      <DateRangePicker date={dataCriacao} onDateChange={setDataCriacao} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Última Atividade</label>
                      <DateRangePicker date={ultimaAtividade} onDateChange={setUltimaAtividade} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Responsável</label>
                      <Input placeholder="Nome do responsável..." value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Canal de Origem</label>
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
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="projetos">
                <AccordionTrigger>Projetos Associados</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Número de Projetos</label>
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
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status dos Projetos</label>
                      <MultiSelectServices selected={statusProjetos} onChange={setStatusProjetos} placeholder="Selecione status..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Receita Total (AOA)</label>
                      <div className="flex gap-2">
                        <Input placeholder="Min" value={receitaMin} onChange={(e) => setReceitaMin(e.target.value)} />
                        <Input placeholder="Max" value={receitaMax} onChange={(e) => setReceitaMax(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Frequência de Recorrência</label>
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
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={clearFilters}>Limpar Filtros</Button>
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