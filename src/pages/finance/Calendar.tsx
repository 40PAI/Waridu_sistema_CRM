import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import FinancialCalendarView from "@/components/finance/FinancialCalendarView";
import type { Event } from "@/types";

interface FinanceCalendarProps {
  events: Event[];
}

export default function FinanceCalendar({ events }: FinanceCalendarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendário Financeiro</CardTitle>
        <CardDescription>Visualize eventos com impacto financeiro.</CardDescription>
      </CardHeader>
      <CardContent>
        <FinancialCalendarView events={events} />
      </CardContent>
    </Card>
  );
}