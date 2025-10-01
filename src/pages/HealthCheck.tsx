import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const HealthCheck = () => {
  const [loading, setLoading] = React.useState(false);
  const [sessionInfo, setSessionInfo] = React.useState<any>(null);
  const [lastError, setLastError] = React.useState<string | null>(null);

  const fetchSession = async () => {
    setLoading(true);
    setLastError(null);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setLastError(String(error));
        setSessionInfo(null);
      } else {
        setSessionInfo(data?.session ?? null);
      }
    } catch (err: any) {
      setLastError(err?.message ?? String(err));
      setSessionInfo(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>Health Check</CardTitle>
          <CardDescription>Confirmação pública se o app e o cliente Supabase estão ativos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Server status:</strong>
              <div className="mt-2">App está rodando — abra o console do navegador para ver erros de runtime.</div>
            </div>

            <div>
              <strong>Supabase session:</strong>
              <pre className="mt-2 p-2 rounded bg-slate-50 text-xs overflow-auto max-h-48">
                {sessionInfo ? JSON.stringify(sessionInfo, null, 2) : "Sem sessão ativa / não carregada."}
              </pre>
            </div>

            {lastError && (
              <div>
                <strong>Último erro ao recuperar sessão:</strong>
                <pre className="mt-2 p-2 rounded bg-red-50 text-xs overflow-auto">{lastError}</pre>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={fetchSession} disabled={loading}>
                {loading ? "Verificando..." : "Reverificar Sessão"}
              </Button>
              <Button asChild variant="outline">
                <Link to="/debug">Abrir /debug</Link>
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Se esta página carregar, o servidor de desenvolvimento está funcionando. Se abrir /debug falhar, copie o erro do console e cole aqui para eu investigar.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthCheck;