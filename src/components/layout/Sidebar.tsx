import * as React from "react";
import { useLocation, Link } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Calendar, Users, FileText, Settings, Home, Users2, Package, CalendarDays, Bell, KanbanSquare, CheckCircle, LayoutGrid } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/config/roles";

const SidebarNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  const role = user?.profile?.role;
  const canAccess = (path: string) => hasPermission(role, path);

  // Build nav items
  const mainItems: { to: string; icon: React.ReactNode; label: string }[] = [];
  const crmItems: { to: string; icon: React.ReactNode; label: string }[] = [];
  const financeItems: { to: string; icon: React.ReactNode; label: string }[] = [];
  const technicianItems: { to: string; icon: React.ReactNode; label: string }[] = [];
  const adminItems: { to: string; icon: React.ReactNode; label: string }[] = [];

  if (role === 'Admin' || role === 'Coordenador') {
    mainItems.push(
      { to: "/", icon: <Home className="h-4 w-4" />, label: "Dashboard" },
      { to: "/calendar", icon: <Calendar className="h-4 w-4" />, label: "Calendário" },
      { to: "/create-event", icon: <CalendarDays className="h-4 w-4" />, label: "Criar Evento" },
      { to: "/roster-management", icon: <Users className="h-4 w-4" />, label: "Escalações" },
      { to: "/employees", icon: <Users2 className="h-4 w-4" />, label: "Funcionários" },
      { to: "/roles", icon: <Package className="h-4 w-4" />, label: "Funções" },
      { to: "/materials", icon: <Package className="h-4 w-4" />, label: "Materiais" },
      { to: "/material-requests", icon: <Package className="h-4 w-4" />, label: "Requisições" }
    );
  }

  if (role === 'Admin' || role === 'Comercial') {
    crmItems.push(
      { to: "/crm/dashboard", icon: <LayoutGrid className="h-4 w-4" />, label: "Dashboard CRM" },
      { to: "/crm/pipeline", icon: <KanbanSquare className="h-4 w-4" />, label: "Pipeline" },
      { to: "/crm/clients", icon: <Users className="h-4 w-4" />, label: "Clientes" }
    );
  }
  
  if (role === 'Admin' || role === 'Financeiro') {
    financeItems.push(
      { to: "/finance/dashboard", icon: <Home className="h-4 w-4" />, label: "Dashboard Fin." },
      { to: "/finance-profitability", icon: <FileText className="h-4 w-4" />, label: "Rentabilidade" },
      { to: "/finance-calendar", icon: <CalendarDays className="h-4 w-4" />, label: "Calendário Fin." },
      { to: "/finance-costs", icon: <Settings className="h-4 w-4" />, label: "Gestão de Custos" },
      { to: "/finance/reports", icon: <FileText className="h-4 w-4" />, label: "Relatórios" }
    );
  }

  if (role === 'Técnico') {
    technicianItems.push(
      { to: "/technician/dashboard", icon: <Home className="h-4 w-4" />, label: "Dashboard" },
      { to: "/technician/calendar", icon: <Calendar className="h-4 w-4" />, label: "Meu Calendário" },
      { to: "/technician/events", icon: <CalendarDays className="h-4 w-4" />, label: "Meus Eventos" },
      { to: "/technician/tasks", icon: <CheckCircle className="h-4 w-4" />, label: "Minhas Tarefas" },
      { to: "/technician/tasks-kanban", icon: <KanbanSquare className="h-4 w-4" />, label: "Tarefas Kanban" }
    );
  }

  if (role === 'Admin') {
    adminItems.push(
      { to: "/invite-member", icon: <Users2 className="h-4 w-4" />, label: "Convidar Membros" },
      { to: "/admin-settings", icon: <Settings className="h-4 w-4" />, label: "Configurações" },
      { to: "/admin/tasks", icon: <CheckCircle className="h-4 w-4" />, label: "Gerenciar Tarefas" }
    );
  }

  const profileLink = role === 'Admin' ? '/admin/profile' :
                      role === 'Financeiro' ? '/finance/profile' :
                      role === 'Gestor de Material' ? '/material-manager/profile' :
                      role === 'Técnico' ? '/technician/profile' :
                      '/';

  const navItems = [
    ...mainItems,
    ...crmItems,
    ...financeItems,
    ...technicianItems,
    ...adminItems,
    { to: "/notifications", icon: <Bell className="h-4 w-4" />, label: "Notificações" },
    { to: profileLink, icon: <Users className="h-4 w-4" />, label: "Meu Perfil" }
  ].filter(item => canAccess(item.to));

  // Group items for display
  const mainGroup = navItems.filter(item => mainItems.some(i => i.to === item.to));
  const crmGroup = navItems.filter(item => crmItems.some(i => i.to === item.to));
  const financeGroup = navItems.filter(item => financeItems.some(i => i.to === item.to));
  const technicianGroup = navItems.filter(item => technicianItems.some(i => i.to === item.to));
  const adminGroup = navItems.filter(item => adminItems.some(i => i.to === item.to));
  const generalGroup = navItems.filter(item => !mainGroup.includes(item) && !crmGroup.includes(item) && !financeGroup.includes(item) && !technicianGroup.includes(item) && !adminGroup.includes(item));

  return (
    <Sidebar>
      <SidebarContent className="flex flex-col">
        <div className="p-2">
          <Button variant="ghost" size="icon" className="w-full justify-start" asChild>
            <Link to="/">
              <Home className="h-5 w-5 mr-2" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>
          </Button>
        </div>

        {mainGroup.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Operacional</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainGroup.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild>
                      <Link to={item.to} className={location.pathname === item.to ? "bg-accent text-accent-foreground" : ""}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {crmGroup.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>CRM</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {crmGroup.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild>
                      <Link to={item.to} className={location.pathname === item.to ? "bg-accent text-accent-foreground" : ""}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {financeGroup.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Financeiro</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {financeGroup.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild>
                      <Link to={item.to} className={location.pathname === item.to ? "bg-accent text-accent-foreground" : ""}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {technicianGroup.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Técnico</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {technicianGroup.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild>
                      <Link to={item.to} className={location.pathname === item.to ? "bg-accent text-accent-foreground" : ""}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {adminGroup.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminGroup.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild>
                      <Link to={item.to} className={location.pathname === item.to ? "bg-accent text-accent-foreground" : ""}>
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Geral</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {generalGroup.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild>
                    <Link to={item.to} className={location.pathname === item.to ? "bg-accent text-accent-foreground" : ""}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default SidebarNav;