import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, CheckCircle, Calendar, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEvents } from "@/hooks/useEvents";
import { useMaterials } from "@/hooks/useMaterials";
import type { Event } from "@/types";
import { parseISO, isWithinInterval, startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

// --- Helper Functions ---
const getMaterialStatusVariant = (status: string) => {
    switch (status) {
      case 'Disponível': return 'default';
      case 'Em uso': return 'secondary';
      case 'Manutenção': return 'destructive';
      default: return 'outline';
    }
};

const getEventStatusVariant = (status: string) => {
    switch (status) {
      case 'Concluído': return 'default';
      case 'Cancelado': return 'destructive';
      default: return 'secondary';
    }
};

// --- Sub-components ---
const MaterialStatusList = ({ materials }: { materials: any[] }) => {
    const activeMaterials = useMemo(() => materials.filter(m => m.status !== 'Disponível'), [materials]);
    return (
        <div className="space-y-4">
            {activeMaterials.length > 0 ? activeMaterials.map((item) => (
                <div className="flex items-center" key={item.id}>
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="ml-auto font-medium">
                        <Badge variant={getMaterialStatusVariant(item.status)}>{item.status}</Badge>
                    </div>
                </div>
            )) : (
                <p className="text-sm text-muted-foreground text-center">Todos os materiais estão disponíveis.</p>
            )}
        </div>
    );
};

// --- Main Dashboard Component ---
const Dashboard = () => {
  const { events } = useEvents();
  const { materials: pageMaterials } = useMaterials();

  // --- Data Processing ---
  const totalItems = useMemo(() => pageMaterials.reduce((sum, item) => sum + item.quantity, 0), [pageMaterials]);
  const availableItems = useMemo(() => pageMaterials.filter(m => m.status === 'Disponível').reduce((sum, item) => sum + item.quantity, 0), [pageMaterials]);

  const now = new Date();
  const startOfThisMonth = startOfMonth(now);
  const endOfThisMonth = endOfMonth(now);
  const totalEventsThisMonth = useMemo(() => events.filter(event => {
      const eventDate = parseISO(event.startDate);
      return isWithinInterval(eventDate, { start: startOfThisMonth, end: endOfThisMonth });
  }).length, [events, startOfThisMonth, endOfThisMonth]);

  const lastFourMonths = useMemo(() => Array.from({ length: 4 }, (_, i) => subMonths(now, i)).reverse(), [now]);
  const financeData = useMemo(() => lastFourMonths.map(monthDate => {
      const monthKey = format(monthDate, 'MMM', { locale: ptBR });
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const revenueForMonth = events
          .filter(e => (e.status === 'Concluído') && isWithinInterval(parseISO(e.startDate), { start, end }))
          .reduce((sum, e) => sum + (e.revenue || 0), 0);
      
      const expensesForMonth = events
          .filter(e => (e.status === 'Concluído') && isWithinInterval(parseISO(e.startDate), { start, end }))
          .reduce((sum, e) => sum + (e.expenses?.reduce((expSum, exp) => expSum + exp.amount, 0) || 0), 0);

      return { name: monthKey, Receita: revenueForMonth, Despesa: expensesForMonth };
  }), [events, lastFourMonths]);

  const totalRevenue = useMemo(() => financeData.reduce((sum, item) => sum + item.Receita, 0), [financeData]);

  const categoryData = useMemo(() => pageMaterials.reduce((acc, item) => {
    const category = acc.find(c => c.name === item.category);
    if (category) {
      category.quantidade += item.quantity;
    } else {
      acc.push({ name: item.category, quantidade: item.quantity });
    }
    return acc;
  }, [] as { name: string; quantidade: number }[]), [pageMaterials]);

  const recentEvents = useMemo(() => events
    .sort((a, b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime())
    .slice(0, 4)
    .map(e => ({
        id: e.id,
        name: e.name,
        date: format(parseISO(e.startDate), 'dd/MM/yyyy', { locale: ptBR }),
        status: e.status
    })), [events]);

  return (
    <div className="flex-1 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Itens totais no inventário</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableItems}</div>
            <p className="text-xs text-muted-foreground">Itens prontos para uso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row<dyad-write path="src/config/roles.ts" description="Adding hasPermission and hasActionPermission functions to config/roles.ts for role-based access control.">
export type Role = 'Admin' | 'Coordenador' | 'Gestor de Material' | 'Financeiro' | 'Técnico';

export const PAGE_PERMISSIONS: Record<Role, string[]> = {
  Admin: [
    '/', '/calendar', '/create-event', '/roster-management',
    '/employees', '/roles', '/materials', '/material-requests',
    '/finance/dashboard', '/finance-profitability', '/finance-calendar', '/finance-costs', '/finance/reports',
    '/admin-settings', '/invite-member', '/admin/members', '/admin/users', '/debug', '/roles/:roleId',
    '/notifications'
  ],
  Coordenador: [
    '/', '/calendar', '/create-event', '/roster-management',
    '/employees', '/roles', '/materials', '/invite-member', '/admin/members', '/admin/users',
    '/notifications'
  ],
  'Gestor de Material': [
    '/', '/calendar', '/roster-management', '/materials', '/material-requests',
    '/notifications'
  ],
  Financeiro: [
    '/finance/dashboard', '/finance-profitability', '/finance-calendar', '/finance-costs', '/finance/reports',
    '/finance/profile', '/notifications'
  ],
  Técnico: [
    '/technician/dashboard', '/technician/calendar', '/technician/events',
    '/technician/events/:eventId', '/technician/tasks',
    '/technician/tasks-kanban', '/technician/profile', '/technician/notifications', '/notifications'
  ],
};

export const ACTION_PERMISSIONS: Record<Role, string[]> = {
  Admin: [
    'members:invite', 'members:promote', 'members:ban', 'members:delete',
    'materials:write', 'employees:write', 'employees:assign_category', 'categories:manage'
  ],
  Coordenador: [
    'members:invite', 'members:promote', 'employees:write'
  ],
  'Gestor de Material': [
    'materials:write'
  ],
  Financeiro: [
    'categories:manage'
  ],
  Técnico: []
};

export function hasPermission(role: Role | undefined, path: string): boolean {
  if (!role) return false;
  const permissions = PAGE_PERMISSIONS[role] || [];
  return permissions.some(p => {
    if (p.endsWith('/:roleId')) return path === '/roles' || path.startsWith('/roles/');
    return path === p || (p.endsWith('*') && path.startsWith(p.slice(0, -1)));
  });
}

export function hasActionPermission(role: Role | undefined, action: string): boolean {
  if (!role) return false;
  const permissions = ACTION_PERMISSIONS[role] || [];
  return permissions.includes(action);
}