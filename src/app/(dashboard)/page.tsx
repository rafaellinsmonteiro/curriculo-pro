'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, FileText, Clock, Edit3, AlertCircle, CheckCircle,
  Plus, TrendingUp, DollarSign, Wallet
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDateTime, getRelativeTime } from '@/lib/utils';
import type { DashboardStats, Activity } from '@/lib/types';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ResumesChart } from '@/components/dashboard/ResumesChart';
import { StatusChart } from '@/components/dashboard/StatusChart';

import { HourlyResumesChart } from '@/components/dashboard/HourlyResumesChart';

export default function DashboardPage() {
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'all'>('30days');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<(Activity & { lead_name: string })[]>([]);
  const [chartsData, setChartsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?period=${period}`);
      const data = await res.json();
      setStats(data.stats);
      setActivities(data.recentActivities || []);
      setChartsData(data.chartsData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !stats) {
    return <LoadingSpinner fullPage message="Carregando dashboard..." />;
  }

  const statCards = [
    { label: 'Total de Leads', value: stats?.total_leads || 0, icon: Users, color: 'var(--accent-blue)', bg: 'var(--accent-blue-soft)' },
    { label: 'Currículos Criados', value: stats?.total_resumes || 0, icon: FileText, color: 'var(--accent-primary)', bg: 'var(--accent-primary-soft)' },
    { label: 'Faturamento Total', value: `R$ ${(stats?.total_revenue || 0).toFixed(2).replace('.', ',')}`, icon: DollarSign, color: 'var(--accent-green)', bg: 'var(--accent-green-soft)' },
    { label: 'A Receber', value: `R$ ${(stats?.pending_revenue || 0).toFixed(2).replace('.', ',')}`, icon: Wallet, color: 'var(--accent-orange)', bg: 'var(--accent-orange-soft)' },
    { label: 'Finalizados', value: stats?.resumes_finished || 0, icon: CheckCircle, color: 'var(--accent-purple)', bg: 'var(--accent-purple-soft)' },
    { label: 'Pendentes', value: stats?.resumes_pending || 0, icon: AlertCircle, color: 'var(--accent-yellow)', bg: 'var(--accent-yellow-soft)' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead_criado': return <Users size={14} />;
      case 'curriculo_criado': return <FileText size={14} />;
      case 'curriculo_editado': return <Edit3 size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Dashboard</h1>
          <p className="page-header-subtitle">Visão geral do CurrículoPRO</p>
        </div>
        <div>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value as any)}
            className="form-select"
            style={{ minWidth: '150px' }}
          >
            <option value="today">Hoje</option>
            <option value="7days">Últimos 7 dias</option>
            <option value="30days">Últimos 30 dias</option>
            <option value="all">Todo o período</option>
          </select>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link href="/leads?new=true" className="quick-action-btn">
          <Plus size={20} />
          <span>Novo Lead</span>
        </Link>
        <Link href="/curriculos/novo" className="quick-action-btn">
          <Plus size={20} />
          <span>Criar Currículo</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card glass-card" style={{ '--stat-color': card.color } as React.CSSProperties}>
            <div className="stat-card-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={26} />
            </div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      {chartsData && (
        <>
          <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px', marginBottom: '32px' }}>
            <RevenueChart data={chartsData.revenueChart} />
            <ResumesChart data={chartsData.resumesChart} />
          </div>
          <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px', marginBottom: '40px' }}>
            <HourlyResumesChart data={chartsData.hourlyChart} />
            <StatusChart data={chartsData.statusChart} />
          </div>
        </>
      )}

      {/* Recent Activity */}
      <div className="card glass-card">
        <div className="card-header">
          <h3 className="card-title">Atividade Recente</h3>
        </div>
        {activities.length === 0 ? (
          <div className="empty-state">
            <Clock size={48} />
            <h3>Nenhuma atividade</h3>
            <p>As atividades aparecerão aqui conforme você utilizar o sistema.</p>
          </div>
        ) : (
          <div className="timeline">
            {activities.map((activity) => (
              <div key={activity.id} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-time" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getActivityIcon(activity.activity_type)}
                    {getRelativeTime(activity.created_at)} — {formatDateTime(activity.created_at)}
                  </div>
                  <div className="timeline-desc">
                    <strong>{activity.lead_name}</strong> — {activity.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
