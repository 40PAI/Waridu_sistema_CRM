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
import type { Event, MaterialRequest } from "@/types";
import { showError, showSuccess } from "@/utils/toast";
import { Eye } from "lucide-react";

type ApproveResult = { ok: true } | { ok: false; shortages: { materialId: string; needed: number; available: number }[] };

interface MaterialRequestsPageProps {
  requests: MaterialRequest[];
  events: Event[];
  materialNameMap: Record<string, string>;
  onApproveRequest: (requestId: string) => ApproveResult | Promise<ApproveResult>;
  onRejectRequest: (requestId: string, reason: string) => void | Promise<void>;
}

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

const MaterialRequestsPage = ({ requests, events, materialNameMap, onApproveRequest, onRejectRequest }: MaterialRequestsPageProps) => {
  const [statusFilter, setStatusFilter] = React.useState<MaterialRequest["status"] | "all">("all");
  const [eventFilter, setEventFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectId, setRejectId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");

  const eventsMap = React.useMemo(() => {
    const map: Record<number, string> = {};
    events.forEach((e) => (map[e.id] = e.name));
    return map;
  }, [events]);

  const filtered = React.useMemo(() => {
    return requests.filter((r) => {
      const byStatus = statusFilter === "all" || r.status === statusFilter;
      const byEvent = eventFilter === "all" || String(r.eventId) === eventFilter;
      const term = search.trim().toLowerCase();
      const bySearch =
        term.length === 0 ||
        r.requestedBy.name.toLowerCase().includes(term) ||
        r.requestedBy.email.toLowerCase().includes(term) ||
        (eventsMap[r.eventId] || "").toLowerCase().includes(term) ||
        r.items.some((it) => (materialNameMap[it.materialId] || it.materialId).toLowerCase().includes(term));
      return byStatus && byEvent && bySearch;
    });
  }, [requests, statusFilter, eventFilter, search, eventsMap, materialNameMap]);

  const handleApprove = async (id: string) => {
    if (processingId) return;
    setProcessingId(id);
    const res = await onApproveRequest(id);
    if (res.ok) {
      showSuccess("Requisição aprovada e estoque atualizado.");
    } else {
      const shortages = "shortages" in res ? res.shortages : [];
      const names = shortages
        .map((s) => `${materialNameMap[s.materialId] || s.materialId} (precisa ${s.needed}, tem ${s.available})`)
        .join("; ");
      showError(names ? `Estoque insuficiente: ${names}` : "Estoque insuficiente para alguns itens.");
    }
    setProcessingId(null);
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
    await onRejectRequest(rejectId, rejectReason.trim());
    showSuccess("Requisição rejeitada.");
    setRejectOpen(false);
    setRejectId(null);
    setProcessingId(null);
  };

  const approveAllFilteredPending = async () => {
    const pendentes = filtered.filter((r) => r.status === "Pendente");
    if (pendentes.length === 0) {
      showError("Nenhuma requisição pendente nos filtros atuais.");
      return;
    }
    let okCount = 0;
    for (const req of pendentes) {
      const res = await onApproveRequest(req.id);
      if (res.ok) okCount++;
    }
    if (okCount > 0) showSuccess(`${okCount} requisição(ões) aprovada(s).`);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Requisições de Materiais</CardTitle>
          <CardDescription>Gerencie aprovações e histórico de requisições.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input placeholder="Buscar por evento, solicitante ou material..." value={search} onChange={(e) => setSearch(e.target.value)} className="md:col-span-2" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aprovada">Aprovada</SelectItem>
                <SelectItem value="Rejeitada">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventFilter} onValueChange={(v) => setEventFilter(v)}>
              <SelectTrigger><SelectValue placeholder="Evento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Eventos</SelectItem>
                {events.map((ev) => <SelectItem key={ev.id} value={String(ev.id)}>{ev.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={approveAllFilteredPending}>Aprovar todos os pendentes filtrados</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length ? filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{eventsMap[r.eventId] || `Evento ${r.eventId}`}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{r.requestedBy.name}</div>
                      <div className="text-muted-foreground">{r.requestedBy.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" /> Ver itens ({r.items.length})
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Itens Solicitados</h4>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {r.items.map((it, idx) => (
                              <li key={idx}>
                                {materialNameMap[it.materialId] || it.materialId}: {it.quantity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleApprove(r.id)} disabled={processingId === r.id || r.status !== "Pendente"}>
                      Aprovar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openReject(r.id)} disabled={processingId === r.id || r.status !== "Pendente"}>
                      Rejeitar
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">Nenhuma requisição encontrada.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Requisição</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <label className="text-sm">Motivo</label>
            <Textarea placeholder="Descreva o motivo..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button onClick={confirmReject} disabled={!rejectId}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MaterialRequestsPage;