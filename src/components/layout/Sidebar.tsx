import * as React from "react";
import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Calendar, Users, FileText, Settings, Home, Users2, Package, CalendarDays, Bell, KanbanSquare, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/config/roles";

const SidebarNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  const role = user?.profile?.role;
  const canAccess = (path: string) => hasPermission(role, path);

  const navItems = React.useMemo(() => {
    const items: { to: string; icon: React.ReactNode; label: string }[] = [];

    if (role === 'Admin' || role === 'Coordenador') {
      items.push(
        { to: "/", icon: <Home className="h-4 w-4" />, label: "Dashboard" },
        { to: "/calendar", icon: <Calendar className="h-4 w-4" />, label: "Calendário" },
        { to: "/create-event", icon: <CalendarDays className="h-4 w-4" />, label: "Criar Evento" },
        { to: "/roster-management", icon: <Users className="h-4 w-4" />, label: "Escalações" },
        { to: "/employees", icon: <Users2 className="h-4 w-4" />, label: "Funcionários" },
        { to: "/roles", icon: <Package className="h-4 w-4" />, label: "Funções" },
        { to: "/materials", icon: <Package className="h-4 w-4" />, label: "Materiais" },
        { to: "/material-requests", icon: <Package className="h-4 w-4" />, label: "Requisições" },
        { to: "/invite-member", icon: <Users2 className="h-4 w-4" />, label: "Convidar Membros" },
        { to: "/admin-settings", icon: <Settings className="h-4 w-4" />, label: "Configurações" },
        { to: "/notifications", icon: <Bell className="h-4 w-4" />, label: "Notificações" }
      );
    } else if (role === 'Gestor de Material') {
      items.push(
        { to: "/", icon: <Home className="h-4 w-4" />, label: "Dashboard" },
        { to: "/calendar", icon: <Calendar className="h-4 w-4" />, label: "Calendário" },
        { to: "/roster-management", icon: <Users className="h-4 w-4" />, label: "Escalações" },
        { to: "/materials", icon: <Package className="h-4 w-4" />, label: "Materiais" },
        { to: "/material-requests", icon: <Package className="h-4 w-4" />, label: "Requisições" },
        { to: "/notifications", icon: <Bell className="h-4 w-4" />, label: "Notificações" }
      );
    } else if (role === 'Financeiro') {
      items.push(
        { to: "/finance/dashboard", icon: <Home className="h-4 w-4" />, label: "Dashboard" },
        { to: "/finance-profitability", icon: <FileText className="h-4 w-4" />, label: "Rentabilidade" },
        { to: "/finance-calendar", icon: <Calendar className="h-4 w-4" />, label: "Calendário Financeiro" },
        { to: "/finance-costs", icon: <Settings className="h-4 w-4" />, label: "Gestão de Custos" },
        { to: "/finance/reports", icon: <FileText className="h-4 w-4" />, label: "Relatórios Detalhados" },
        { to: "/finance/profile", icon: <Users className="h-4 w-4" />, label: "Meu Perfil" },
        { to: "/notifications", icon: <Bell className="h-4 w-4" />, label: "Notificações" }
      );
    } else if (role === 'Técnico') {
      items.push(
        { to: "/technician/dashboard", icon: <Home className="h-4 w-4" />, label: "Dashboard" },
        { to: "/technician/calendar", icon: <Calendar className="h-4 w-4" />, label: "Meu Calendário" },
        { to: "/technician/events", icon: <CalendarDays className="h-4 w-4" />, label: "Meus Eventos" },
        { to: "/technician/tasks", icon: <CheckCircle className="h-4 w-4" />, label: "Minhas Tarefas" },
        { to: "/technician/tasks-kanban", icon: <KanbanSquare className="h-4 w-4" />, label: "Tarefas Kanban" },
        { to: "/technician/profile", icon: <Users className="h-4 w-4" />, label: "Meu Perfil" },
        { to: "/technician/notifications", icon: <Bell className="h-4 w-4" />, label: "Notificações" }
      );
    }

    return items.filter(item => canAccess(item.to));
  };

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
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
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
        <SidebarGroup>
          <SidebarGroupLabel>Usuário</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="p-2">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profile?.avatar_url} />
                  <AvatarFallback>{user?.profile?.first_name?.[0] || user?.email?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none">
                    {user?.profile?.first_name} {user?.profile?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default SidebarNav;