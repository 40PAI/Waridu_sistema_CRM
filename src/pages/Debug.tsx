import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";

const DebugPage = () => {
  const { session, user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [requests, setRequests] = React.useState<any[]>([]);
  const [items, setItems] = React.useState<any[]>([]);
  const [lastResult, setLastResult] = React.useState<any>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setLastResult(null);
    const { data, error } = await supabase
      .from("material_requests")
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
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchRequests error:", error);
      setLastResult(error);
      showError("Erro ao buscar requisições (veja console)");
    } else {
      setRequests(data || []);
      setLastResult(data || []);
      showSuccess("Requisições carregadas");
    }
    setLoading(false);
  };

  const fetchItems = async () => {
    setLoading(true);
    setLastResult(null);
    const { data, error } = await supabase.from("material_request_items").select("*").order("id", { ascending: false });
    if (error) {
      console.error("fetchItems error:", error);
      setLastResult(error);
      showError("Erro ao buscar itens (veja console)");
    } else {
      setItems(data || []);
      setLastResult(data || []);
      showSuccess("Itens carregados");
    }
    setLoading(false);
  };

  const testInsert = async () => {
    setLoading(true);
    setLastResult(null);

    const header = {
      event_id: 1,
      requested_by_details: {
        name: user?.profile?.first_name || user?.email || "debug",
        email: user?.email || "debug@example.com",
        role: user?.profile?.role || "Unknown",
      },
      status: "Pendente",
      created_at: new Date().toISOString(),
    };

    const { data: headerData, error: headerError } = await supabase
      .from("material_requests")
      .insert(header)
      .select()
      .single();

    if (headerError) {
      console.error("Insert header error:", headerError);
      setLastResult(headerError);
      showError(`Falha ao inserir requisição: ${headerError.message || headerError.details || JSON.stringify(headerError)}`);
      setLoading(false);
      return;
    }

    const requestId = headerData.id;

    const itemsToInsert = [
      {
        request_id: requestId,
        material_id: "MAT001",
        quantity: 1,
      },
    ];

    const { error: itemsError } = await supabase.from("material_request_items").insert(itemsToInsert);

    if (itemsError) {
      console.error("Insert items error:", itemsError);
      setLastResult(itemsError);
      showError(`Falha ao inserir itens: ${itemsError.message || itemsError.details || JSON.stringify(itemsError)}`);
      setLoading(false);
      return;
    }

    setLastResult({ header: headerData, itemsInserted: itemsToInsert });
    showSuccess(`Inserção de teste criada (id: ${String(requestId).substring(0, 8)})`);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Debug Supabase</h1>

      <Card>
        <CardHeader>
          <CardTitle>Sessão & Usuário</CardTitle>
          <CardDescription>Informações da sessão atual e profile (útil para verificar RLS/identidade).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <div>
              <strong>Session:</strong>
              <pre className="mt-2 p-2 rounded bg-slate-50 text-xs overflow-auto max-h-40">{JSON.stringify(session, null, 2)}</pre>
            </div>
            <div>
              <strong>User / Profile:</strong>
              <pre className="mt-2 p-2 rounded bg-slate-50 text-xs overflow-auto max-h-40">{JSON.stringify(user, null, 2)}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consultas & Testes</CardTitle>
          <CardDescription>Buscar requisições, itens e tentar um INSERT de teste para ver erros RLS / validation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap mb-4">
            <Button onClick={fetchRequests} disabled={loading}>Buscar Requisições</Button>
            <Button onClick={fetchItems} disabled={loading}>Buscar Itens</Button>
            <Button onClick={testInsert} disabled={loading}>Inserir Requisição de Teste</Button>
          </div>

          <div>
            <strong>Último resultado:</strong>
            <pre className="mt-2 p-2 rounded bg-slate-50 text-xs overflow-auto max-h-60">{lastResult ? JSON.stringify(lastResult, null, 2) : "— nenhum resultado ainda —"}</pre>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <strong>Requisições (preview):</strong>
              <pre className="mt-2 p-2 rounded bg-slate-50 text-xs overflow-auto max-h-40">{requests.length ? JSON.stringify(requests, null, 2) : "Nenhuma requisição carregada."}</pre>
            </div>
            <div>
              <strong>Itens (preview):</strong>
              <pre className="mt-2 p-2 rounded bg-slate-50 text-xs overflow-auto max-h-40">{items.length ? JSON.stringify(items, null, 2) : "Nenhum item carregado."}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <p className="text-sm text-muted-foreground">
          Use este painel para reproduzir o problema. Se a inserção de teste falhar, copie a mensagem de erro completa (ou o conteúdo de "Último resultado") e cole aqui — isso geralmente revela se é uma política RLS, problema de sessão, ou outro erro.
        </p>
      </div>
    </div>
  );
};

export default DebugPage;