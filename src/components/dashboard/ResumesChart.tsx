'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ResumesChartProps {
  data: { date: string; count: number }[];
}

export function ResumesChart({ data }: ResumesChartProps) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Currículos Criados (30 dias)</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--accent-primary)' }}
              formatter={(value: any) => [value, 'Currículos']}
              labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="var(--accent-primary)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCount)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
