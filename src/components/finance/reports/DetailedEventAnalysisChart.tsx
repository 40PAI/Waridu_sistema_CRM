import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

interface EventAnalysisData {
  id: number;
  name: string;
  revenue: number;
  costs: number;
}

interface DetailedEventAnalysisChartProps {
  data: EventAnalysisData[];
}

export const DetailedEventAnalysisChart: React.FC<DetailedEventAnalysisChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise Detalhada de Eventos</CardTitle>
        <CardDescription>Comparação visual de receita vs. custos para os eventos filtrados (top 15).</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `AOA ${value/1000}k`} 
              />
              <Tooltip 
                formatter={(value: number) => [`AOA ${value.toLocaleString("pt-AO")}`, ""]} 
                labelFormatter={(label) => `Evento: ${label}`}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Receita" />
              <Bar dataKey="costs" fill="#82ca9d" name="Custos" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p>Nenhum evento encontrado para análise detalhada.</p>
              <p className="text-sm mt-2">Ajuste os filtros para ver dados.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};