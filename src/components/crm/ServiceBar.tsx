"use client";

import * as React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface ServiceStat {
  name: string;
  value: number;
  percentage?: string;
}

interface Props {
  data: ServiceStat[];
}

const ServiceBar: React.FC<Props> = ({ data }) => {
  const hasValues = data.length > 0 && data.some(d => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Serviços Mais Solicitados</CardTitle>
        <CardDescription>Projetos por tipo de serviço.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasValues ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`${value} projetos`, "Quantidade"]} />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <div>
              <p>Nenhum serviço solicitado ainda.</p>
              <p className="text-sm mt-2">Adicione serviços aos projetos.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceBar;