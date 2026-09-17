'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { FileText } from 'lucide-react';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ResumesChartProps {
  data: { date: string; count: number }[];
}

export function ResumesChart({ data }: ResumesChartProps) {
  const options = useMemo<any>(() => ({
    chart: {
      type: 'bar',
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
    colors: ['#6c5ce7'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '40%',
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: ['#a855f7'],
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100]
      }
    },
    dataLabels: {
      enabled: false
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
    name: 'Criados',
    data: data.map(d => d.count)
  }];

  return (
    <div className="glass-card" style={{ '--stat-color': 'var(--accent-primary)' } as any}>
      <h3 className="chart-title"><FileText size={20} color="var(--accent-primary)" /> Currículos Criados</h3>
      <div style={{ width: '100%', height: 300 }}>
        <Chart options={options} series={series} type="bar" height="100%" />
      </div>
    </div>
  );
}
