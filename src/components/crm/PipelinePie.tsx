"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PieChart as PieIcon } from "lucide-react";

interface Item {
  name: string;
  value: number;
  percentage?: string;
}

interface Props {
  data: Item[];
  colors?: string[];
}

const PipelinePie: React.FC<Props> = ({ data, colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'] }) => {
  const hasValues = data.some(d => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição do Pipeline</CardTitle>
        <CardDescription>Status atual dos projetos no pipeline.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasValues ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage ?? ""}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value} projetos`, "Quantidade"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <PieIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <div>
              <p>Nenhum projeto no pipeline ainda.</p>
              <p className="text-sm mt-2">Comece criando seu primeiro projeto!</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PipelinePie;