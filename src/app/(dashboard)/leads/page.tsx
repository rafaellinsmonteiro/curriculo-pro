'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Plus, Search, Users, MessageCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatWhatsApp, getWhatsAppLink } from '@/lib/utils';
import {
  LEAD_STATUS_LABELS, LEAD_STATUS_COLORS,
  type LeadWithResumeCount, type LeadStatus,
} from '@/lib/types';

const STATUS_OPTIONS: LeadStatus[] = ['novo', 'em_producao', 'curriculo_pronto', 'alteracao_solicitada', 'finalizado'];

function LeadsContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [leads, setLeads] = useState<LeadWithResumeCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [showNewLead, setShowNewLead] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowNewLead(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter]);

  async function fetchLeads() {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeads(data);
      } else {
        setLeads([]);
        showToast(data.error || 'Erro ao carregar leads', 'error');
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), whatsapp: whatsapp.trim(), notes: notes.trim() || undefined }),
      });

      if (!res.ok) throw new Error('Erro ao criar lead');

      showToast('Lead cadastrado com sucesso!', 'success');
      setShowNewLead(false);
      setName('');
      setWhatsapp('');
      setNotes('');
      fetchLeads();
    } catch {
      showToast('Erro ao cadastrar lead. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Leads</h1>
          <p className="page-header-subtitle">{leads.length} clientes cadastrados</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowNewLead(true)}>
            <Plus size={18} />
            Novo Lead
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-search">
            <Search />
            <input
              type="text"
              placeholder="Buscar por nome ou WhatsApp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="table-filters">
            <button
              className={`filter-btn ${statusFilter === '' ? 'active' : ''}`}
              onClick={() => setStatusFilter('')}
            >
              Todos
            </button>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                className={`filter-btn ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              >
                {LEAD_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner fullPage message="Carregando leads..." />
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>Nenhum lead encontrado</h3>
            <p>Cadastre seu primeiro lead para começar a criar currículos.</p>
            <button className="btn btn-primary" onClick={() => setShowNewLead(true)}>
              <Plus size={18} /> Cadastrar Lead
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>WhatsApp</th>
                <th>Currículos</th>
                <th>Cadastrado</th>
                <th>Atualizado</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <Link href={`/leads/${lead.id}`} className="table-name">
                      {lead.name}
                    </Link>
                    <div className="text-xs text-muted">{lead.lead_code}</div>
                  </td>
                  <td>
                    <a
                      href={getWhatsAppLink(lead.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whatsapp-link text-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <MessageCircle size={14} />
                      {formatWhatsApp(lead.whatsapp)}
                    </a>
                  </td>
                  <td>{lead.resume_count}</td>
                  <td className="text-sm text-secondary">{formatDate(lead.created_at)}</td>
                  <td className="text-sm text-secondary">{formatDate(lead.updated_at)}</td>
                  <td>
                    <span className={`badge badge-dot ${LEAD_STATUS_COLORS[lead.status]}`}>
                      {LEAD_STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link href={`/leads/${lead.id}`} className="btn btn-ghost btn-sm">
                        Ver
                      </Link>
                      <Link href={`/curriculos/novo?lead=${lead.id}`} className="btn btn-ghost btn-sm">
                        <Plus size={14} /> Currículo
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Lead Modal */}
      <Modal
        isOpen={showNewLead}
        onClose={() => setShowNewLead(false)}
        title="Cadastrar Novo Lead"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowNewLead(false)} disabled={saving}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleCreateLead} disabled={saving || !name.trim() || !whatsapp.trim()}>
              {saving ? 'Salvando...' : 'Salvar Lead'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateLead}>
          <div className="form-group">
            <label className="form-label">
              Nome do cliente <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: João da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Número de WhatsApp <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: 79999999999"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
            />
            <span className="form-hint">O número será automaticamente formatado para o padrão internacional</span>
          </div>
          <div className="form-group">
            <label className="form-label">Observações</label>
            <textarea
              className="form-textarea"
              placeholder="Anotações sobre o cliente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Carregando..." />}>
      <LeadsContent />
    </Suspense>
  );
}
