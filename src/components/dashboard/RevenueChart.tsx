'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface RevenueChartProps {
  data: { date: string; revenue: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const options = useMemo<any>(() => ({
    chart: {
      type: 'area',
      toolbar: { show: false },
      background: 'transparent',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    theme: {
      mode: 'dark',
    },
    colors: ['#00d68f'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    xaxis: {
      categories: data.map(d => d.date),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: '#9090b0', fontSize: '12px' }
      }
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `R$ ${val}`,
        style: { colors: '#9090b0', fontSize: '12px' }
      }
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.05)',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`
      }
    }
  }), [data]);

  const series = [{
    name: 'Faturamento',
    data: data.map(d => d.revenue)
  }];

  return (
    <div className="glass-card" style={{ '--stat-color': 'var(--accent-green)' } as any}>
      <h3 className="chart-title"><TrendingUp size={20} color="var(--accent-green)" /> Faturamento</h3>
      <div style={{ width: '100%', height: 300 }}>
        <Chart options={options} series={series} type="area" height="100%" />
      </div>
    </div>
  );
}
