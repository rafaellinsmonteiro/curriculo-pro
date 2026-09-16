'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, MessageCircle, Plus, Eye, Download, Edit3,
  RefreshCw, Clock, Users, FileText,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatDateTime, formatWhatsApp, getWhatsAppLink, getRelativeTime } from '@/lib/utils';
import {
  LEAD_STATUS_LABELS, LEAD_STATUS_COLORS,
  RESUME_STATUS_LABELS, RESUME_STATUS_COLORS,
  PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
  type Lead, type ResumeWithLead, type Activity,
} from '@/lib/types';

export default function LeadDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const { showToast } = useToast();

  const [lead, setLead] = useState<Lead | null>(null);
  const [resumes, setResumes] = useState<ResumeWithLead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLead();
  }, [id]);

  async function fetchLead() {
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLead(data.lead);
      setResumes(data.resumes);
      setActivities(data.activities);
    } catch {
      showToast('Erro ao carregar lead', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner fullPage message="Carregando lead..." />;
  if (!lead) return <div className="empty-state"><h3>Lead não encontrado</h3></div>;

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
      {/* Back navigation */}
      <Link href="/leads" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-lg)' }}>
        <ArrowLeft size={18} />
        Voltar para Leads
      </Link>

      <div className="page-header">
        <div>
          <h1>{lead.name}</h1>
          <p className="page-header-subtitle">{lead.lead_code}</p>
        </div>
        <div className="page-header-actions">
          <a
            href={getWhatsAppLink(lead.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp"
          >
            <MessageCircle size={18} />
            Abrir conversa no WhatsApp
          </a>
          <Link href={`/curriculos/novo?lead=${lead.id}`} className="btn btn-primary">
            <Plus size={18} />
            Criar novo currículo
          </Link>
        </div>
      </div>

      {/* Lead Info */}
      <div className="card mb-lg">
        <h3 className="card-title" style={{ marginBottom: 'var(--space-md)' }}>Informações do Cliente</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-item-label">Nome</span>
            <span className="info-item-value">{lead.name}</span>
          </div>
          <div className="info-item">
            <span className="info-item-label">WhatsApp</span>
            <span className="info-item-value">
              <a
                href={getWhatsAppLink(lead.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-link"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <MessageCircle size={14} />
                {formatWhatsApp(lead.whatsapp)}
              </a>
            </span>
          </div>
          <div className="info-item">
            <span className="info-item-label">Data de Cadastro</span>
            <span className="info-item-value">{formatDateTime(lead.created_at)}</span>
          </div>
          <div className="info-item">
            <span className="info-item-label">Status</span>
            <span className="info-item-value">
              <span className={`badge badge-dot ${LEAD_STATUS_COLORS[lead.status]}`}>
                {LEAD_STATUS_LABELS[lead.status]}
              </span>
            </span>
          </div>
        </div>
        {lead.notes && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            <span className="info-item-label" style={{ display: 'block', marginBottom: '4px' }}>Observações</span>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{lead.notes}</p>
          </div>
        )}
      </div>

      {/* Resumes */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Currículos deste cliente ({resumes.length})</h3>
          <Link href={`/curriculos/novo?lead=${lead.id}`} className="btn btn-primary btn-sm">
            <Plus size={16} /> Novo currículo
          </Link>
        </div>

        {resumes.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <FileText size={48} />
              <h3>Nenhum currículo</h3>
              <p>Crie o primeiro currículo para este cliente.</p>
              <Link href={`/curriculos/novo?lead=${lead.id}`} className="btn btn-primary">
                <Plus size={18} /> Criar currículo
              </Link>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Currículo</th>
                  <th>Versão</th>
                  <th>Valor</th>
                  <th>Pagamento</th>
                  <th>Criado em</th>
                  <th>Modificado</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((resume) => (
                  <tr key={resume.id}>
                    <td className="font-bold">{resume.title}</td>
                    <td>V{resume.current_version}</td>
                    <td className="font-bold">R$ {Number(resume.price || 0).toFixed(2).replace('.', ',')}</td>
                    <td>
                      <span className={`badge badge-dot ${PAYMENT_STATUS_COLORS[resume.payment_status]}`}>
                        {PAYMENT_STATUS_LABELS[resume.payment_status]}
                      </span>
                    </td>
                    <td className="text-sm text-secondary">{formatDate(resume.created_at)}</td>
                    <td className="text-sm text-secondary">{formatDate(resume.updated_at)}</td>
                    <td>
                      <span className={`badge badge-dot ${RESUME_STATUS_COLORS[resume.status]}`}>
                        {RESUME_STATUS_LABELS[resume.status]}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {resume.pdf_url && (
                          <>
                            <a href={`/api/resumes/${resume.id}/download?inline=true`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" title="Visualizar">
                              <Eye size={15} />
                            </a>
                            <a href={`/api/resumes/${resume.id}/download`} className="btn btn-ghost btn-sm" title="Download">
                              <Download size={15} />
                            </a>
                          </>
                        )}
                        <Link href={`/curriculos?edit=${resume.id}`} className="btn btn-ghost btn-sm" title="Editar">
                          <Edit3 size={15} />
                        </Link>
                        <Link href={`/curriculos?redo=${resume.id}`} className="btn btn-ghost btn-sm" title="Refazer">
                          <RefreshCw size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Histórico de Atividades</h3>
        </div>
        <div className="card">
          {activities.length === 0 ? (
            <div className="empty-state">
              <Clock size={48} />
              <p>Nenhuma atividade registrada</p>
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
                    <div className="timeline-desc">{activity.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
