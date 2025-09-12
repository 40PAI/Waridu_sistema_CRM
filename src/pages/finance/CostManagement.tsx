import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryManager from "@/components/settings/CategoryManager";
import ExpenseManager from "@/components/finance/ExpenseManager";
import { useEvents } from "@/hooks/useEvents";

export default function CostManagement() {
  const { events, updateEventDetails, loading } = useEvents();

  return (
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
              events={events} 
              onUpdateEventDetails={updateEventDetails} 
              loading={loading} 
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}