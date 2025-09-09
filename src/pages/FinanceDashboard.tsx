import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const salesData = [
  { name: 'Jan', Receita: 4000, Despesa: 2400 },
  { name: 'Fev', Receita: 3000, Despesa: 1398 },
  { name: 'Mar', Receita: 2000, Despesa: 9800 },
  { name: 'Abr', Receita: 2780, Despesa: 3908 },
  { name: 'Mai', Receita: 1890, Despesa: 4800 },
  { name: 'Jun', Receita: 2390, Despesa: 3800 },
  { name: 'Jul', Receita: 3490, Despesa: 4300 },
];

const growthData = [
    { name: 'Semana 1', Crescimento: 20 },
    { name: 'Semana 2', Crescimento: 45 },
    { name: 'Semana 3', Crescimento: 30 },
    { name: 'Semana 4', Crescimento: 60 },
    { name: 'Semana 5', Crescimento: 80 },
];

const FinanceDashboard = () => {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral de Vendas</CardTitle>
          <CardDescription>Receitas e despesas nos últimos meses.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Receita" fill="#8884d8" />
              <Bar dataKey="Despesa" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Crescimento de Usuários</CardTitle>
          <CardDescription>Acompanhe o crescimento semanal de novos usuários.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Crescimento" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceDashboard;