"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Mail, RefreshCw } from "lucide-react";

const GmailIntegration = () => {
  const { user } = useAuth();
  const [syncing, setSyncing] = React.useState(false);

  const handleSyncEmails = async () => {
    if (!user) return;

    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showError("Faça login com Google primeiro.");
        return;
      }

      const { error } = await supabase.functions.invoke("gmail-integration", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      showSuccess("Emails sincronizados com sucesso!");
    } catch (err: any) {
      console.error("Sync error:", err);
      showError("Erro ao sincronizar emails: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Integração Gmail
        </CardTitle>
        <CardDescription>
          Sincronize emails corporativos automaticamente para registrar comunicações com clientes/projetos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleSyncEmails} disabled={syncing}>
          {syncing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Sincronizar Emails
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Últimos 24h de emails serão processados e associados a clientes/projetos automaticamente.
        </p>
      </CardContent>
    </Card>
  );
};

export default GmailIntegration;