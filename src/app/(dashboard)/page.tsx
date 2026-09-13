'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, FileText, Clock, Edit3, AlertCircle, CheckCircle,
  Plus, TrendingUp,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDateTime, getRelativeTime } from '@/lib/utils';
import type { DashboardStats, Activity } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<(Activity & { lead_name: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setStats(data.stats);
      setActivities(data.recentActivities || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner fullPage message="Carregando dashboard..." />;
  }

  const statCards = [
    { label: 'Total de Leads', value: stats?.total_leads || 0, icon: Users, color: 'var(--accent-blue)', bg: 'var(--accent-blue-soft)' },
    { label: 'Currículos Criados', value: stats?.total_resumes || 0, icon: FileText, color: 'var(--accent-primary)', bg: 'var(--accent-primary-soft)' },
    { label: 'Criados Hoje', value: stats?.resumes_today || 0, icon: TrendingUp, color: 'var(--accent-green)', bg: 'var(--accent-green-soft)' },
    { label: 'Editados', value: stats?.resumes_edited || 0, icon: Edit3, color: 'var(--accent-orange)', bg: 'var(--accent-orange-soft)' },
    { label: 'Pendentes', value: stats?.resumes_pending || 0, icon: AlertCircle, color: 'var(--accent-yellow)', bg: 'var(--accent-yellow-soft)' },
    { label: 'Finalizados', value: stats?.resumes_finished || 0, icon: CheckCircle, color: 'var(--accent-purple)', bg: 'var(--accent-purple-soft)' },
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
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-header-subtitle">Visão geral do CurrículoPRO</p>
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
          <div key={card.label} className="stat-card" style={{ '--stat-color': card.color } as React.CSSProperties}>
            <div className="stat-card-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={22} />
            </div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card">
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
