import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

interface ForestChartProps {
  type: 'volume' | 'species' | 'diversity';
}

export default function ForestChart({ type }: ForestChartProps) {
  // Sample data - in production, this would come from the project data
  const volumeData = [
    { name: 'Parcela 1', volume: 145 },
    { name: 'Parcela 2', volume: 168 },
    { name: 'Parcela 3', volume: 132 },
    { name: 'Parcela 4', volume: 155 },
    { name: 'Parcela 5', volume: 148 },
    { name: 'Parcela 6', volume: 172 },
  ];

  const speciesData = [
    { name: 'Ipê', value: 25, color: '#0B3D2E' },
    { name: 'Jatobá', value: 20, color: '#16A34A' },
    { name: 'Cedro', value: 15, color: '#10B981' },
    { name: 'Mogno', value: 18, color: '#34D399' },
    { name: 'Outras', value: 22, color: '#6EE7B7' },
  ];

  const diversityData = [
    { name: 'Jan', shannon: 3.2, simpson: 0.85 },
    { name: 'Fev', shannon: 3.4, simpson: 0.87 },
    { name: 'Mar', shannon: 3.3, simpson: 0.86 },
    { name: 'Abr', shannon: 3.5, simpson: 0.88 },
    { name: 'Mai', shannon: 3.6, simpson: 0.89 },
    { name: 'Jun', shannon: 3.4, simpson: 0.87 },
  ];

  if (type === 'volume') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Volume por Parcela</CardTitle>
          <CardDescription>Distribuição volumétrica (m³/ha)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="volume" fill="#16A34A" name="Volume (m³/ha)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  if (type === 'species') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Espécies</CardTitle>
          <CardDescription>Porcentagem por espécie</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={speciesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {speciesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Índices de Diversidade</CardTitle>
        <CardDescription>Evolução temporal</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={diversityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="shannon" fill="#0B3D2E" name="Shannon" />
            <Bar dataKey="simpson" fill="#10B981" name="Simpson" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
