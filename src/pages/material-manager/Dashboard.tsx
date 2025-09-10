import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Archive, ClipboardList, Bell, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type MaterialRow = { status: string | null; category: string | null };

const MaterialManagerDashboard = () => {
  const { user } = useAuth();
  const displayName = user?.profile?.first_name || user?.email || "Gestor de Material";

  const [loading, setLoading] = React.useState(true);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [stats, setStats] = React.useState({
    totalItems: 0,
    maintenanceItems: 0,
    pendingRequests: 0,
    totalRequests: 0,
  });

  React.useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      // Materiais
      const { data: materials, error: materialsError } = await supabase
        .from("materials")
        .select("status, category");
      if (materialsError) throw materialsError;

      const mats = (materials || []) as MaterialRow[];
      const totalItems = mats.length;
      const maintenanceItems = mats.filter((m) => m.status === "Manutenção").length;

      // Requisições
      const { data: requests, error: requestsError } = await supabase
        .from("material_requests")
        .select("status");
      if (requestsError) throw requestsError;
      const allReqs = requests || [];
      const pendingRequests = allReqs.filter((r: any) => r.status === "Pendente").length;

      // Notificações (não lidas)
      const { data: notifications, error: notifError } = await supabase
        .from("notifications")
        .select("read")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (notifError) throw notifError;

      setStats({
        totalItems,
        maintenanceItems,
        pendingRequests,
        totalRequests: allReqs.length,
      });
      setUnreadCount((notifications || []).filter((n: any) => !n.read).length);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Bem-vindo, {displayName}!</h1>
          <p className="text-muted-foreground">Visão geral de inventário e requisições.</p>
        </div>
        <Button variant="outline" size="icon" asChild>
          <Link to="/material-manager/notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs">
                {unreadCount}
              </Badge>
            )}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Itens cadastrados no inventário</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maintenanceItems}</div>
            <p className="text-xs text-muted-foreground">Precisam de atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Requisições Pendentes</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Requisições</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">No sistema</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acesso Rápido</CardTitle>
          <CardDescription>Links úteis para o dia a dia.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Link to="/material-manager/calendar">
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Calendário Geral
            </Button>
          </Link>
          <Link to="/material-manager/requests">
            <Button variant="outline" className="w-full justify-start">
              <ClipboardList className="mr-2 h-4 w-4" />
              Requisições de Materiais
            </Button>
          </Link>
          <Link to="/material-manager/inventory">
            <Button variant="outline" className="w-full justify-start">
              <Archive className="mr-2 h-4 w-4" />
              Gerenciar Inventário
            </Button>
          </Link>
          <Link to="/material-manager/profile">
            <Button variant="outline" className="w-full justify-start">
              <Archive className="mr-2 h-4 w-4" />
              Meu Perfil
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialManagerDashboard;