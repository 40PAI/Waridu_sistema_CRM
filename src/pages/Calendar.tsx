import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const CalendarPage = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendário de Eventos</CardTitle>
        <CardDescription>
          Visualize todos os eventos registrados em um formato de calendário.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Componente de Calendário será implementado aqui.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarPage;