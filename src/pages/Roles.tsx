import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Role, Event } from "@/types";
import { Employee } from "@/components/employees/EmployeeDialog";
import { Link } from "react-router-dom";

interface RolesPageProps {
  roles: Role[];
  employees: Employee[];
  events: Event[];
}

const RolesPage = ({ roles, employees, events }: RolesPageProps) => {
  const roleStats = React.useMemo(() => {
    return roles.map((role) => {
      const employeesCount = employees.filter((e) => e.role === role.name).length;
      const eventsCount = events.filter((ev) =>
        ev.roster?.teamMembers?.some((m) => m.role === role.name)
      ).length;
      return {
        role,
        employeesCount,
        eventsCount,
      };
    });
  }, [roles, employees, events]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Funções</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral das funções e seus times.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roleStats.map(({ role, employeesCount, eventsCount }) => (
          <Card key={role.id}>
            <CardHeader>
              <CardTitle>{role.name}</CardTitle>
              <CardDescription>Gestão desta função</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <div>Funcionários: <span className="font-medium text-foreground">{employeesCount}</span></div>
                <div>Eventos: <span className="font-medium text-foreground">{eventsCount}</span></div>
              </div>
              <Link to={`/roles/${role.id}`}>
                <Button variant="outline">Ver detalhes</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      {roles.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma função cadastrada. Adicione funções em Configurações do Admin.
        </p>
      )}
    </div>
  );
};

export default RolesPage;