'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface StatusChartProps {
  data: { name: string; value: number }[];
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function StatusChart({ data }: StatusChartProps) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Status dos Currículos</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
