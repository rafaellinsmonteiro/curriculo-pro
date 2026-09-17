'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Clock } from 'lucide-react';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface HourlyResumesChartProps {
  data: { hour: string; count: number }[];
}

export function HourlyResumesChart({ data }: HourlyResumesChartProps) {
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
    colors: ['#a855f7'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    xaxis: {
      categories: data.map(d => d.hour),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: '#9090b0', fontSize: '11px' }
      }
    },
    yaxis: {
      labels: {
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
        formatter: (val: number) => `${val} Currículos`
      }
    }
  }), [data]);

  const series = [{
    name: 'Gerados',
    data: data.map(d => d.count)
  }];

  return (
    <div className="glass-card" style={{ '--stat-color': 'var(--accent-purple)' } as any}>
      <h3 className="chart-title"><Clock size={20} color="var(--accent-purple)" /> Currículos por Hora</h3>
      <div style={{ width: '100%', height: 300 }}>
        <Chart options={options} series={series} type="area" height="100%" />
      </div>
    </div>
  );
}
