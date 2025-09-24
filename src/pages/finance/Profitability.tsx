import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { parseISO, differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EventStatus } from "@/types";
import { useEmployees } from "@/hooks/useEmployees";
import { useEvents } from "@/hooks/useEvents";
import { useTechnicianCategories } from "@/hooks/useTechnicianCategories";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-AO", { style: "currency", currency: "AOA", minimumFractionDigits: 2 });

const getStatusVariant = (status: EventStatus) =>
  status === "Concluído" ? "default" : status === "Cancelado" ? "destructive" : "secondary";

export default function Profitability() {
  const { employees, loading: employeesLoading } = useEmployees();
  const { events, loading: eventsLoading } = useEvents();
  const { categories, loading: categoriesLoading } = useTechnicianCategories();
  
  // maps
  const rateMap = React.useMemo(() => new Map(categories.map(c => [c.id, c.dailyRate])), [categories]);
  const empMap = React.useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  // filter only concluded events
  const profitData = React.useMemo(() => {
    return (events || []) // Safely access events
      .filter(e => e.status === "Concluído" && e.revenue)
      .map(e => {
        const days = differenceInDays(parseISO(e.endDate), parseISO(e.startDate)) + 1;
        let pcost = 0;
        (e.roster?.teamMembers||[]).forEach(m=>{
          const emp=empMap.get(m.id);
          if(emp?.technicianCategoryId) pcost+=(rateMap.get(emp.technicianCategoryId)||0)*days;
        });
        const oexp=e.expenses?.reduce((a,b)=>a+(b.amount || 0),0)||0;
        const cost=pcost+oexp;
        const profit=(e.revenue||0)-cost;
        return { 
          id:e.id, 
          name:e.name, 
          date:format(parseISO(e.startDate),"dd/MM/yyyy",{locale:ptBR}), 
          revenue:e.revenue||0, 
          cost, 
          profit, 
          status:e.status 
        };
      });
  },[events,empMap,rateMap]);

  if (employeesLoading || eventsLoading || categoriesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rentabilidade por Evento</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Receita</TableHead>
              <TableHead>Custo</TableHead>
              <TableHead>Lucro</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profitData.length>0 ? profitData.map(e=>(
              <TableRow key={e.id}>
                <TableCell>{e.name}</TableCell>
                <TableCell>{e.date}</TableCell>
                <TableCell>{formatCurrency(e.revenue)}</TableCell>
                <TableCell>{formatCurrency(e.cost)}</TableCell>
                <TableCell className={e.profit>=0?"text-green-600":"text-red-600"}>{formatCurrency(e.profit)}</TableCell>
                <TableCell><Badge variant={getStatusVariant(e.status)}>{e.status}</Badge></TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Nenhum evento concluído.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}