import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Eye, Search, Filter } from "lucide-react";
import type { Event, MaterialRequest } from "@/types";
import { showError, showSuccess } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type ApproveResult = { ok: true } | { ok: false; shortages: { materialId: string; needed: number; available: number }[] };

const statusVariant = (status: MaterialRequest["status"]) => {
  switch (status) {
    case "Pendente":
      return "secondary";
    case "Aprovada":
      return "default";
    case "Rejeitada":
      return "destructive";
    default:
      return "secondary";
  }
};

const priorityVariant = (priority: string) => {
  switch (priority) {
    case "Alta":
      return "destructive";
    case "Média":
      return "default";
    case "Baixa":
      return "secondary";
    default:
      return "secondary";
  }
};

const MaterialManagerRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = React.useState<MaterialRequest[]>([]);
  const [events, setEvents] = React.useState<Event[]>([]);
  const [materialNameMap, setMaterialNameMap] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  
  const [statusFilter, setStatusFilter] = React.useState<MaterialRequest["status"] | "all">("all");
  const [eventFilter, setEventFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");
  
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectId, setRejectId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = React.useState<MaterialRequest | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = React.useState(false);

  const eventsMap = React.useMemo(() => {
    const map: Record<number, string> = {};
    events.forEach((e) => (map[e.id] = e.name));
    return map;
  }, [events]);

  // Load data from Supabase
  React.useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch requests
        const { data: requestsData, error: requestsError } = await supabase
          .from('material_requests')
          .select(`
            id, 
            event_id, 
            requested_by_id,
            requested_by_details, 
            status, 
            reason, 
            created_at, 
            decided_at,
            material_request_items(material_id, quantity)
          `)
          .order('created_at', { ascending: false });

        if (requestsError) throw requestsError;

        const formattedRequests: MaterialRequest[] = (requestsData || []).map((req: any) => ({
          id: req.id,
          eventId: req.event_id,
          requestedBy: req.requested_by_details || { name: 'Desconhecido', email: '', role: '' },
          status: req.status as MaterialRequest["status"],
          reason: req.reason,
          createdAt: req.created_at,
          decidedAt: req.decided_at,
          items: (req.material_request_items || []).map((item: any) => ({
            materialId: item.material_id,
            quantity: item.quantity
          }))
        }));

        setRequests(formattedRequests);
        
        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .order('start_date', { ascending: true });

        if (eventsError) throw eventsError;

        const formattedEvents: Event[] = (eventsData || []).map((event: any) => ({
          id: event.id,
          name: event.name,
          startDate: event.start_date,
          endDate: event.end_date,
          location: event.location,
          startTime: event.start_time,
          endTime: event.end_time,
          revenue: event.revenue,
          status: event.status,
          description: event.description
        }));

        setEvents(formattedEvents);
        
        // Fetch materials for name mapping
        const { data: materialsData, error: materialsError } = await supabase
          .from('materials')
          .select('id, name');

        if (materialsError) throw materialsError;

        const nameMap: Record<string, string> = {};
        materialsData?.forEach((material: any) => {
          nameMap[material.id] = material.name;
        });
        setMaterialNameMap(nameMap);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        showError("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filtered = React.useMemo(() => {
    return requests.filter((r) => {
      const byStatus = statusFilter === "all" || r.status === statusFilter;
      const byEvent = eventFilter === "all" || String(r.eventId) === eventFilter;
      const byPriority = priorityFilter === "all" || 
        (priorityFilter === "Alta" && r.status === "Pendente") || 
        (priorityFilter === "Média" && r.status === "Pendente") || 
        (priorityFilter === "Baixa" && r.status === "Pendente");
      
      const term = search.trim().toLowerCase();
      const bySearch =
        term.length === 0 ||
        r.requestedBy.name.toLowerCase().includes(term) ||
        r.requestedBy.email.toLowerCase().includes(term) ||
        (eventsMap[r.eventId] || "").toLowerCase().includes(term) ||
        r.items.some((it) => (materialNameMap[it.materialId] || it.materialId).toLowerCase().includes(term));
      return byStatus && byEvent && bySearch && byPriority;
    });
  }, [requests, statusFilter, eventFilter, search, priorityFilter, eventsMap, materialNameMap]);

  const handleApprove = async (id: string) => {
    if (processingId) return;
    setProcessingId(id);
    
    try {
      const { error } = await supabase
        .from('material_requests')
        .update({ 
          status: 'Aprovada', 
          decided_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "Aprovada", decidedAt: new Date().toISOString() } : r))
      );

      showSuccess("Requisição aprovada com sucesso!");
    } catch (error) {
      console.error("Error approving request:", error);
      showError("Falha ao aprovar requisição.");
    } finally {
      setProcessingId(null);
    }
  };

  const openReject = (id: string) => {
    if (processingId) return;
    setRejectId(id);
    setRejectReason("");
    setRejectOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectId) return;
    if (!rejectReason.trim()) {
      showError("Informe o motivo da rejeição.");
      return;
    }
    setProcessingId(rejectId);
    
    try {
      const { error } = await supabase
        .from('material_requests')
        .update({ 
          status: 'Rejeitada', 
          reason: rejectReason.trim(), 
          decided_at: new Date().toISOString() 
        })
        .eq('id', rejectId);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) =>
          r.id === rejectId ? { ...r, status: "Rejeitada", reason: rejectReason.trim(), decidedAt: new Date().toISOString() } : r
        )
      );
      showSuccess("Requisição rejeitada.");
      setRejectOpen(false);
      setRejectId(null);
    } catch (error) {
      console.error("Error rejecting request:", error);
      showError("Falha ao rejeitar requisição.");
    } finally {
      setProcessingId(null);
    }
  };

  const viewRequestDetails = (request: MaterialRequest) => {
    setSelectedRequest(request);
    setViewDetailsOpen(true);
  };

  const handleBulkApprove = async () => {
    const pendingRequests = filtered.filter(r => r.status === "Pendente");
    if (pendingRequests.length === 0) {
      showError("Nenhuma requisição pendente selecionada.");
      return;
    }
    
    try {
      setProcessingId("bulk");
      
      // Update all pending requests
      const requestIds = pendingRequests.map(r => r.id);
      const { error } = await supabase
        .from('material_requests')
        .update({ 
          status: 'Aprovada', 
          decided_at: new Date().toISOString() 
        })
        .in('id', requestIds);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) => (requestIds.includes(r.id) ? { ...r, status: "Aprovada", decidedAt: new Date().toISOString() } : r))
      );

      showSuccess(`${pendingRequests.length} requisições aprovadas com sucesso!`);
    } catch (error) {
      console.error("Error bulk approving requests:", error);
      showError("Falha ao aprovar requisições em lote.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando requisições...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Requisições de Materiais</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as requisições de materiais enviadas pelos administradores e coordenadores.
          </p>
        </div>
        <Button 
          onClick={handleBulkApprove} 
          disabled={filtered.filter(r => r.status === "Pendente").length === 0 || !!processingId}
        >
          {processingId === "bulk" ? "Aprovando..." : "Aprovar Selecionadas"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre as requisições por status, evento ou prioridade</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Pesquisar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Pesquisar por evento, solicitante..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as MaterialRequest["status"] | "all")}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aprovada">Aprovada</SelectItem>
                <SelectItem value="Rejeitada">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="event-filter">Evento</Label>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger id="event-filter">
                <SelectValue placeholder="Filtrar por evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Eventos</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={String(event.id)}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority-filter">Prioridade</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger id="priority-filter">
                <SelectValue placeholder="Filtrar por prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button variant="outline" className="w-full">
              <Filter className="mr-2 h-4 w-4" />
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Requisições</CardTitle>
          <CardDescription>
            {filtered.length} requisições encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {eventsMap[request.eventId] || `Evento #${request.eventId}`}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.requestedBy.name}</p>
                        <p className="text-sm text-muted-foreground">{request.requestedBy.role}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(parseISO(request.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {request.items.length} item(s)
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(request.status)}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant("Alta")}>
                        Alta
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => viewRequestDetails(request)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      {request.status === "Pendente" && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleApprove(request.id)}
                            disabled={!!processingId}
                          >
                            {processingId === request.id ? "Aprovando..." : "Aprovar"}
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => openReject(request.id)}
                            disabled={!!processingId}
                          >
                            Rejeitar
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    Nenhuma requisição encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Requisição</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reject-reason" className="text-right">
                Motivo
              </Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="col-span-3"
                placeholder="Informe o motivo da rejeição..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={!rejectReason.trim()}>Rejeitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Requisição</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Evento</Label>
                  <p className="text-sm">{eventsMap[selectedRequest.eventId] || `Evento #${selectedRequest.eventId}`}</p>
                </div>
                <div>
                  <Label>Data da Requisição</Label>
                  <p className="text-sm">{format(parseISO(selectedRequest.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
                <div>
                  <Label>Solicitante</Label>
                  <p className="text-sm">{selectedRequest<dyad-write path="src/pages/material-manager/TransferHistory.tsx" description="Creating Material Movement Tracking Page">
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Calendar, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { showError } from "@/utils/toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TransferRecord {
  id: string;
  material_id: string;
  material_name: string;
  from_location_id: string;
  from_location_name: string;
  to_location_id: string;
  to_location_name: string;
  quantity: number;
  transferred_by: string;
  transferred_by_name: string;
  transferred_at: string;
  notes?: string;
}

const MaterialManagerTransferHistory = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = React.useState<TransferRecord[]>([]);
  const [filteredTransfers, setFilteredTransfers] = React.useState<TransferRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [materialFilter, setMaterialFilter] = React.useState("all");
  const [locationFilter, setLocationFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("all");
  
  const materials = React.useMemo(() => {
    const uniqueMaterials = Array.from(
      new Set(transfers.map(t => t.material_id))
    ).map(id => {
      const transfer = transfers.find(t => t.material_id === id);
      return { id, name: transfer?.material_name || '' };
    });
    return uniqueMaterials;
  }, [transfers]);
  
  const locations = React.useMemo(() => {
    const allLocations = [
      ...transfers.map(t => ({ id: t.from_location_id, name: t.from_location_name })),
      ...transfers.map(t => ({ id: t.to_location_id, name: t.to_location_name }))
    ];
    const uniqueLocations = Array.from(
      new Set(allLocations.map(l => l.id))
    ).map(id => {
      const location = allLocations.find(l => l.id === id);
      return { id, name: location?.name || '' };
    });
    return uniqueLocations;
  }, [transfers]);

  // Load transfer history from Supabase
  React.useEffect(() => {
    const fetchTransfers = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // In a real implementation, you would have a transfers table
        // For now, we'll simulate some transfer data
        const mockTransfers: TransferRecord[] = [
          {
            id: "1",
            material_id: "MAT001",
            material_name: "Câmera Sony A7S III",
            from_location_id: "LOC001",
            from_location_name: "Armazém Central",
            to_location_id: "LOC002",
            to_location_name: "Estúdio A",
            quantity: 2,
            transferred_by: "user1",
            transferred_by_name: "Carlos Silva",
            transferred_at: "2024-08-15T10:30:00Z",
            notes: "Para evento de amanhã"
          },
          {
            id: "2",
            material_id: "MAT002",
            material_name: "Lente Canon 24-70mm",
            from_location_id: "LOC002",
            from_location_name: "Estúdio A",
            to_location_id: "LOC001",
            to_location_name: "Armazém Central",
            quantity: 3,
            transferred_by: "user2",
            transferred_by_name: "Ana Costa",
            transferred_at: "2024-08-14T16:45:00Z",
            notes: "Devolução pós-evento"
          },
          {
            id: "3",
            material_id: "MAT003",
            material_name: "Kit de Luz Aputure 300D",
            from_location_id: "LOC001",
            from_location_name: "Armazém Central",
            to_location_id: "LOC003",
            to_location_name: "Estúdio B",
            quantity: 1,
            transferred_by: "user1",
            transferred_by_name: "Carlos Silva",
            transferred_at: "2024-08-13T09:15:00Z"
          },
          {
            id: "4",
            material_id: "MAT004",
            material_name: "Microfone Rode NTG5",
            from_location_id: "LOC003",
            from_location_name: "Estúdio B",
            to_location_id: "LOC001",
            to_location_name: "Armazém Central",
            quantity: 5,
            transferred_by: "user3",
            transferred_by_name: "Beatriz Oliveira",
            transferred_at: "2024-08-12T14:20:00Z"
          }
        ];
        
        setTransfers(mockTransfers);
        setFilteredTransfers(mockTransfers);
      } catch (error) {
        console.error("Error fetching transfers:", error);
        showError("Erro ao carregar histórico de transferências.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, [user]);

  // Apply filters
  React.useEffect(() => {
    let result = [...transfers];
    
    // Search filter
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(t => 
        t.material_name.toLowerCase().includes(term) ||
        t.from_location_name.toLowerCase().includes(term) ||
        t.to_location_name.toLowerCase().includes(term) ||
        t.transferred_by_name.toLowerCase().includes(term)
      );
    }
    
    // Material filter
    if (materialFilter !== "all") {
      result = result.filter(t => t.material_id === materialFilter);
    }
    
    // Location filter (from or to)
    if (locationFilter !== "all") {
      result = result.filter(t => 
        t.from_location_id === locationFilter || 
        t.to_location_id === locationFilter
      );
    }
    
    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      result = result.filter(t => {
        const transferDate = parseISO(t.transferred_at);
        switch (dateFilter) {
          case "today":
            return transferDate.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return transferDate >= weekAgo;
          case "month":
            return transferDate.getMonth() === now.getMonth() && 
                   transferDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }
    
    setFilteredTransfers(result);
  }, [search, materialFilter, locationFilter, dateFilter, transfers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando histórico de transferências...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Histórico de Transferências</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe todas as movimentações de materiais entre localizações.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre as transferências por material, localização ou data</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label htmlFor="search" className="text-sm font-medium">Pesquisar</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Pesquisar por material, localização..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="material-filter" className="text-sm font-medium">Material</label>
            <Select value={materialFilter} onValueChange={setMaterialFilter}>
              <SelectTrigger id="material-filter">
                <SelectValue placeholder="Filtrar por material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Materiais</SelectItem>
                {materials.map((material) => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="location-filter" className="text-sm font-medium">Localização</label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger id="location-filter">
                <SelectValue placeholder="Filtrar por localização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Localizações</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="date-filter" className="text-sm font-medium">Período</label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger id="date-filter">
                <SelectValue placeholder="Filtrar por data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o Período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button variant="outline" className="w-full" onClick={() => {
              setSearch("");
              setMaterialFilter("all");
              setLocationFilter("all");
              setDateFilter("all");
            }}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transferências Recentes</CardTitle>
          <CardDescription>
            {filteredTransfers.length} transferências encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Movimentação</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransfers.length > 0 ? (
                filteredTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium">
                      {transfer.material_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{transfer.from_location_name}</Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge>{transfer.to_location_name}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{transfer.quantity}</Badge>
                    </TableCell>
                    <TableCell>
                      {transfer.transferred_by_name}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(transfer.transferred_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {transfer.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    Nenhuma transferência encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialManagerTransferHistory;