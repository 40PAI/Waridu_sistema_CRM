import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryManager from "@/components/settings/CategoryManager";
import ExpenseManager from "@/components/finance/ExpenseManager";
import { useEvents } from "@/hooks/useEvents";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function CostManagement() {
  const { events, updateEventDetails, loading } = useEvents();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Custos</h1>
          <p className="text-muted-foreground">Gerencie custos de técnicos e despesas de eventos.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/finance/reports">
            <FileText className="mr-2 h-4 w-4" />
            Ver Relatórios Detalhados
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="technician-costs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="technician-costs">Custos de Técnicos</TabsTrigger>
          <TabsTrigger value="event-expenses">Despesas de Eventos</TabsTrigger>
        </TabsList>
        <TabsContent value="technician-costs">
          <CategoryManager />
        </TabsContent>
        <TabsContent value="event-expenses">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Despesas de Eventos</CardTitle>
              <CardDescription>Adicione e gerencie despesas gerais para cada evento.</CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseManager 
                events={events || []} // Safely access events
                onUpdateEventDetails={updateEventDetails} 
                loading={loading} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}