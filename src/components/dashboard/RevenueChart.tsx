'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RevenueChartProps {
  data: { date: string; revenue: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Faturamento (30 dias)</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              tickFormatter={(value) => `R$${value}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--accent-green)' }}
              formatter={(value: any) => [`R$ ${Number(value).toFixed(2).replace('.', ',')}`, 'Faturamento']}
              labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="var(--accent-green)" 
              strokeWidth={3}
              dot={{ r: 4, fill: 'var(--accent-green)', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: 'var(--accent-green)', stroke: 'var(--bg-primary)', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
