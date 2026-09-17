'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface HourlyResumesChartProps {
  data: { hour: string; count: number }[];
}

export function HourlyResumesChart({ data }: HourlyResumesChartProps) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Currículos Gerados por Hora</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
            <XAxis 
              dataKey="hour" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              dy={10}
              interval={1}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip 
              cursor={{ fill: 'var(--border-color)' }}
              contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--accent-purple)' }}
              formatter={(value: any) => [value, 'Currículos']}
              labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
              labelFormatter={(label) => `Hora: ${label}`}
            />
            <Bar dataKey="count" fill="var(--accent-purple)" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.count > 0 ? 'var(--accent-purple)' : 'var(--border-color)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
