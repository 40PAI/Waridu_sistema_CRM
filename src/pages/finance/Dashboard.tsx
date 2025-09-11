import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { DateRange } from "react-day-picker";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { parseISO, startOfMonth, endOfMonth, differenceInDays, isWithinInterval, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Download, DollarSign, Wallet, TrendingUp, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { showError } from "@/utils/toast";
import type { Event, EventStatus } from "@/types";
import type { TechnicianCategory } from "@/hooks/useTechnicianCategories";

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-AO", { style: "currency", currency: "AOA", minimumFractionDigits: 2 });

const getStatusVariant = (status: EventStatus) =>
  status === "Concluído" ? "default" : status === "Cancelado" ? "destructive" : "secondary";

interface FinanceDashboardProps {
  events: Event[];
  employees: { id: string; technicianCategoryId?: string }[];
  categories: TechnicianCategory[];
}

export default function FinanceDashboard({ events, employees, categories }: FinanceDashboardProps) {
  const [range, setRange] = React.useState<DateRange>();
  const [statusFilter, setStatusFilter] = React.useState<EventStatus | "all">("all");
  const { user } = useAuth();

  // maps for quick lookup
  const rateMap = React.useMemo(() => new Map(categories.map(c => [c.id, c.dailyRate])), [categories]);
  const empMap = React.useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  // filter events
  const filtered = React.useMemo(() => {
    return events.filter(e => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (range?.from) {
        const start = parseISO(e.startDate), end = parseISO(e.endDate);
        const to = range.to || start;
        return isWithinInterval(start, { start: range.from, end: to })
            || isWithinInterval(end, { start: range.from, end: to })
            || (start < range.from && end > to);
      }
      return true;
    });
  }, [events, range, statusFilter]);

  // KPI calculations
  const now = new Date();
  const startM = startOfMonth(now), endM = endOfMonth(now);
  const thisMonthRevenue = filtered
    .filter(e => isWithinInterval(parseISO(e.startDate), { start: startM, end: endM }) && e.revenue)
    .reduce((s, e) => s + (e.revenue||0), 0);
  const thisMonthCost = filtered
    .filter(e => isWithinInterval(parseISO(e.startDate), { start: startM, end: endM }))
    .reduce((sum, e) => {
      const days = differenceInDays(parseISO(e.endDate), parseISO(e.startDate)) + 1;
      let pcost = 0;
      (e.roster?.teamMembers||[]).forEach(m => {
        const emp = empMap.get(m.id);
        if (emp?.technicianCategoryId) {
          const rate = rateMap.get(emp.technicianCategoryId) || 0;
          pcost += rate * days;
        }
      });
      const oexp = e.expenses?.reduce((a,b)=>a+b.amount,0)||0;
      return sum + pcost + oexp;
    }, 0);
  const thisMonthProfit = thisMonthRevenue - thisMonthCost;
  const margin = thisMonthRevenue>0 ? (thisMonthProfit/thisMonthRevenue)*100 : 0;

  // prepare monthly performance over last 6 months
  const perf = React.useMemo(() => {
    const data: Record<string,{Receita:number;Despesa:number;Lucro:number}> = {};
    filtered.forEach(e => {
      if (e.status!=="Concluído"||!e.revenue) return;
      const mkey = format(parseISO(e.startDate),"MMM yyyy",{locale:ptBR});
      if (!data[mkey]) data[mkey]={Receita:0,Despesa:0,Lucro:0};
      data[mkey].Receita+=e.revenue||0;
      // calculate cost like above
      const days = differenceInDays(parseISO(e.endDate), parseISO(e.startDate))+1;
      let pc=0;
      (e.roster?.teamMembers||[]).forEach(m=>{
        const emp=empMap.get(m.id);
        if(emp?.technicianCategoryId){
          pc+= (rateMap.get(emp.technicianCategoryId)||0)*days;
        }
      });
      const oe = e.expenses?.reduce((a,b)=>a+b.amount,0)||0;
      const totalCost = pc+oe;
      data[mkey].Despesa+=totalCost;
      data[mkey].Lucro+= (e.revenue||0) - totalCost;
    });
    return Object.entries(data).map(([month,v])=>({month,...v}));
  },[filtered,empMap,rateMap]);

  const csvExport = () => {
    if (!filtered.length) { showError("Não há dados para exportar"); return; }
    const hdr=["Evento","Data","Receita","Custo","Lucro","Status"];
    const rows=filtered.map(e=>{
      const d=format(parseISO(e.startDate),"dd/MM/yyyy",{locale:ptBR});
      const rev=e.revenue||0;
      // reuse cost calc:
      const days=differenceInDays(parseISO(e.endDate),parseISO(e.startDate))+1;
      let pc=0; (e.roster?.teamMembers||[]).forEach(m=>{
        const emp=empMap.get(m.id);
        if(emp?.technicianCategoryId) pc+=(rateMap.get(emp.technicianCategoryId)||0)*days;
      });
      const oe=e.expenses?.reduce((a,b)=>a+b.amount,0)||0;
      const cost=pc+oe; const profit=rev-cost;
      return [`"${e.name}"`,d,rev,cost,profit,e.status];
    });
    const csv=[hdr.join(","),...rows.map(r=>r.join(","))].join("\n");
    const blob=new Blob([csv],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url;
    a.download=`finance_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
        <div className="flex gap-2">
          <DateRangePicker date={range} onDateChange={setRange} />
          <select
            className="px-3 py-1 border rounded"
            value={statusFilter}
            onChange={e=>setStatusFilter(e.target.value as any)}
          >
            <option value="all">Todos Status</option>
            <option value="Planejado">Planejado</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Concluído">Concluído</option>
            <option value="Cancelado">Cancelado</option>
          </select>
          <Button variant="outline" onClick={csvExport}>
            <Download className="mr-1 h-4 w-4"/>Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm">Receita Mês</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(thisMonthRevenue)}</p>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm">Custos Mês</CardTitle><Wallet className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(thisMonthCost)}</p>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm">Lucro Mês</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(thisMonthProfit)}</p>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm">Margem Média</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{margin.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">Margem no período</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={perf}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="month"/>
              <YAxis tickFormatter={v=>formatCurrency(v)}/>
              <Tooltip formatter={v=>formatCurrency(v as number)}/>
              <Legend/>
              <Bar dataKey="Receita" fill="#8884d8"/>
              <Bar dataKey="Despesa" fill="#82ca9d"/>
              <Bar dataKey="Lucro" fill="#ffc658"/>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}