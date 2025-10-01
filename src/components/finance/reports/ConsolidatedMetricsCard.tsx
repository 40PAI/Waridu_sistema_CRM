import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

interface ConsolidatedMetricsCardProps {
  revenue: number;
  costs: number;
  profit: number;
  eventsCount: number;
}

export const ConsolidatedMetricsCard: React.FC<ConsolidatedMetricsCardProps> = ({
  revenue,
  costs,
  profit,
  eventsCount,
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">AOA {revenue.toLocaleString("pt-AO")}</div>
          <p className="text-xs text-muted-foreground">{eventsCount} eventos analisados</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Custos Totais</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">AOA {costs.toLocaleString("pt-AO")}</div>
          <p className="text-xs text-muted-foreground">Equipe + Despesas</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
            AOA {profit.toLocaleString("pt-AO")}
          </div>
          <p className="text-xs text-muted-foreground">Receita - Custos</p>
        </CardContent>
      </Card>
    </div>
  );
};