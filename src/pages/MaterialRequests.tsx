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
import { Event, MaterialRequest } from "@/App";
import { showError, showSuccess } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { hasActionPermission } from "@/config/roles";
import { Eye } from "lucide-react";

type ApproveResult = { ok: true } | { ok: false; shortages: { materialId: string; needed: number; available: number }[] };

interface MaterialRequestsPageProps {
  requests: MaterialRequest[];
  events: Event[];
  materialNameMap: Record<string, string>;
  onApproveRequest: (requestId: string) => ApproveResult;
  onRejectRequest: (requestId: string, reason: string) => void;
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
  const { user } = useAuth();
  const canManage = !!user && hasActionPermission(user.role, "materials:write");

  const [statusFilter, setStatusFilter] = React.useState<MaterialRequest["status"] | "all">("all");
  const [eventFilter, setEventFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectId, setRejectId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [processingId, setProcessingId] = React.useState<string | null>(null);

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

  const handleApprove = (id: string) => {
    if (processingId) return;
    setProcessingId(id);
    const res = onApproveRequest(id);
    if (res.ok) {
      showSuccess("Requisição aprovada e estoque atualizado.");
    } else {
      const names = res.shortages
        .map((s) => `${materialNameMap[s.materialId] || s.materialId} (precisa ${s.needed}, tem ${s.available})`)
        .join("; ");
      showError(`Estoque insuficiente: ${names}`);
    }
    setProcessingId(null);
  };

  const openReject = (id: string) => {
    if (processingId) return;
    setRejectId(id);
    setRejectReason("");
    setRejectOpen(true);
  };

  const confirmReject = () => {
    if (!rejectId) return;
    if (!rejectReason.trim()) {
      showError("Informe o motivo da rejeição.");
      return;
    }
    setProcessingId(rejectId);
    onRejectRequest(rejectId, rejectReason.trim());
    showSuccess("Requisição rejeitada.");
    setRejectOpen(false);
    setRejectId(null);
    setProcessingId(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <CardTitle>Requisições de Materiais</CardTitle>
            <CardDescription>Gerencie pedidos de materiais para eventos.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input
              placeholder="Buscar por evento, solicitante ou item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:w-[300px]"
            />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aprovada">Aprovada</SelectItem>
                <SelectItem value="Rejeitada">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Eventos</SelectItem>
                {events.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.id}</TableCell>
                    <TableCell>{eventsMap[r.eventId] || r.eventId}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{r.requestedBy.name}</div>
                        <div className="text-muted-foreground">{r.requestedBy.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleString("pt-AO")}</TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            <Eye className="h-4 w-4 mr-2" />
                            {r.items.length} item(s)
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64">
                          <div className="space-y-2">
                            {r.items.map((it) => (
                              <div key={it.materialId} className="text-sm">
                                <span className="font-medium">{materialNameMap[it.materialId] || it.materialId}</span>: {it.quantity}
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(r.status) as any}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "Pendente" && canManage ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openReject(r.id)} disabled={!!processingId}>
                            Rejeitar
                          </Button>
                          <Button size="sm" onClick={() => handleApprove(r.id)} disabled={processingId === r.id}>
                            {processingId === r.id ? "Aprovando..." : "Aprovar"}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
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

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Requisição</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm">Motivo</label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Descreva o motivo da rejeição..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={!!processingId}>
              Cancelar
            </Button>
            <Button onClick={confirmReject} disabled={!rejectReason.trim() || !!processingId}>
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MaterialRequestsPage;