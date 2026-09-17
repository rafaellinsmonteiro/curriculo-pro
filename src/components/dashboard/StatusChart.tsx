'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { CheckCircle } from 'lucide-react';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface StatusChartProps {
  data: { name: string; value: number }[];
}

export function StatusChart({ data }: StatusChartProps) {
  // Map our data names to colors
  const STATUS_COLORS: Record<string, string> = {
    'Finalizado': '#a855f7',
    'Pendente': '#f0b429',
    'Cancelado': '#ef4444',
  };

  const options = useMemo<any>(() => ({
    chart: {
      type: 'donut',
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
    labels: data.map(d => d.name),
    colors: data.map(d => STATUS_COLORS[d.name] || '#3b82f6'),
    stroke: {
      show: true,
      colors: ['#16162a'],
      width: 2
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: {
              color: '#9090b0',
              fontSize: '14px',
            },
            value: {
              color: '#e8e8f0',
              fontSize: '24px',
              fontWeight: 700,
            },
            total: {
              show: true,
              label: 'Total',
              color: '#9090b0',
              formatter: function (w: any) {
                return w.globals.seriesTotals.reduce((a: number, b: number) => {
                  return a + b
                }, 0)
              }
            }
          }
        }
      }
    },
    legend: {
      position: 'bottom',
      labels: {
        colors: '#e8e8f0'
      },
      markers: {
        radius: 12
      }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val: number) => `${val} Currículos`
      }
    }
  }), [data]);

  const series = data.map(d => d.value);

  return (
    <div className="glass-card" style={{ '--stat-color': 'var(--accent-yellow)' } as any}>
      <h3 className="chart-title"><CheckCircle size={20} color="var(--accent-yellow)" /> Status dos Currículos</h3>
      <div style={{ width: '100%', height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Chart options={options} series={series} type="donut" height="100%" width="100%" />
      </div>
    </div>
  );
}
