'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Eye, Download, Edit3, RefreshCw, MoreVertical,
  MessageCircle, FileText, History, Trash2, Type, Link2, Paperclip, X, Camera, DollarSign
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { ImageCropper } from '@/components/ui/ImageCropper';
import { formatDate, formatWhatsApp, getWhatsAppLink, formatDateTime } from '@/lib/utils';
import {
  RESUME_STATUS_LABELS, RESUME_STATUS_COLORS,
  PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
  type ResumeWithLead, type ResumeStatus, type ResumeVersion, type PaymentStatus
} from '@/lib/types';

type PeriodFilter = '' | 'today' | '7days' | '30days';

export default function CurriculosPage() {
  const { showToast } = useToast();

  const [resumes, setResumes] = useState<ResumeWithLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ResumeStatus | ''>('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Edit modal
  const [editResumeId, setEditResumeId] = useState<string | null>(null);
  const [editResume, setEditResume] = useState<ResumeWithLead | null>(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editProfilePhoto, setEditProfilePhoto] = useState<string | null>(null);
  const [editCropImageUrl, setEditCropImageUrl] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Redo confirm
  const [redoResumeId, setRedoResumeId] = useState<string | null>(null);
  const [redoLoading, setRedoLoading] = useState(false);

  // Delete confirm
  const [deleteResumeId, setDeleteResumeId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Payment edit
  const [paymentResumeId, setPaymentResumeId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pendente');
  const [paymentPrice, setPaymentPrice] = useState<number>(10);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Version history
  const [versionResumeId, setVersionResumeId] = useState<string | null>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // View modal
  const [viewResume, setViewResume] = useState<ResumeWithLead | null>(null);

  const fetchResumes = useCallback(async (pageToFetch = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (periodFilter) params.set('period', periodFilter);
      params.set('page', pageToFetch.toString());
      params.set('limit', '20'); // Limite padrão

      const res = await fetch(`/api/resumes?${params}`);
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        setResumes(data.data);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
        setCurrentPage(data.page || 1);
      } else if (Array.isArray(data)) {
        // Fallback in case backend is not updated yet
        setResumes(data);
        setTotalPages(1);
        setTotalItems(data.length);
        setCurrentPage(1);
      } else {
        setResumes([]);
        showToast(data.error || 'Erro ao carregar currículos', 'error');
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, periodFilter]);

  // Handle filter changes (reset to page 1)
  useEffect(() => {
    fetchResumes(1);
  }, [search, statusFilter, periodFilter]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = () => setOpenDropdown(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // --- Actions ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEditFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeFile = (index: number) => {
    setEditFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProfilePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          setEditCropImageUrl(reader.result?.toString() || null);
        });
        reader.readAsDataURL(file);
      } else {
        showToast('Por favor, selecione uma imagem válida', 'error');
      }
      e.target.value = '';
    }
  };

  async function handleEdit() {
    if (!editResumeId || (!editInstruction.trim() && editFiles.length === 0 && !editProfilePhoto)) return;
    setEditLoading(true);
    try {
      const formData = new FormData();
      formData.append('edit_instruction', editInstruction.trim());
      if (editProfilePhoto) formData.append('foto_perfil', editProfilePhoto);
      editFiles.forEach(f => formData.append('files', f));

      const res = await fetch(`/api/resumes/${editResumeId}/edit`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro');
      }
      const data = await res.json();
      showToast(`Nova versão V${data.version} criada com sucesso!`, 'success');
      setEditResumeId(null);
      setEditResume(null);
      setEditInstruction('');
      setEditFiles([]);
      fetchResumes();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao editar currículo', 'error');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleRedo() {
    if (!redoResumeId) return;
    setRedoLoading(true);
    try {
      const res = await fetch(`/api/resumes/${redoResumeId}/redo`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro');
      }
      const data = await res.json();
      showToast(`Currículo refeito! Nova versão V${data.version}`, 'success');
      setRedoResumeId(null);
      fetchResumes();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao refazer currículo', 'error');
    } finally {
      setRedoLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteResumeId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/resumes/${deleteResumeId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Currículo excluído', 'success');
      setDeleteResumeId(null);
      fetchResumes();
    } catch {
      showToast('Erro ao excluir currículo', 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function openVersionHistory(resumeId: string) {
    setVersionResumeId(resumeId);
    setVersionsLoading(true);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/versions`);
      const data = await res.json();
      setVersions(data);
    } catch {
      showToast('Erro ao carregar versões', 'error');
    } finally {
      setVersionsLoading(false);
    }
  }

  async function handleRestore(resumeId: string, versionId: string) {
    try {
      const res = await fetch(`/api/resumes/${resumeId}/versions/${versionId}/restore`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      showToast(`Versão restaurada como V${data.version}`, 'success');
      setVersionResumeId(null);
      fetchResumes();
    } catch {
      showToast('Erro ao restaurar versão', 'error');
    }
  }

  function openEditModal(resume: ResumeWithLead) {
    setEditResumeId(resume.id);
    setEditResume(resume);
    setEditInstruction('');
    setEditFiles([]);
  }

  function openPaymentModal(resume: ResumeWithLead) {
    setPaymentResumeId(resume.id);
    setPaymentStatus(resume.payment_status);
    setPaymentPrice(resume.price || 10);
  }

  async function handlePaymentUpdate() {
    if (!paymentResumeId) return;
    setPaymentLoading(true);
    try {
      const res = await fetch(`/api/resumes/${paymentResumeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: paymentStatus, price: paymentPrice }),
      });
      if (!res.ok) throw new Error();
      showToast('Pagamento atualizado com sucesso', 'success');
      setPaymentResumeId(null);
      fetchResumes();
    } catch {
      showToast('Erro ao atualizar pagamento', 'error');
    } finally {
      setPaymentLoading(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Currículos</h1>
          <p className="page-header-subtitle">{resumes.length} currículos no sistema</p>
        </div>
        <div className="page-header-actions">
          <Link href="/curriculos/novo" className="btn btn-primary">
            <Plus size={18} />
            Criar Currículo
          </Link>
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
            <button className={`filter-btn ${!statusFilter && !periodFilter ? 'active' : ''}`} onClick={() => { setStatusFilter(''); setPeriodFilter(''); }}>Todos</button>
            <button className={`filter-btn ${periodFilter === 'today' ? 'active' : ''}`} onClick={() => { setPeriodFilter(periodFilter === 'today' ? '' : 'today'); setStatusFilter(''); }}>Hoje</button>
            <button className={`filter-btn ${periodFilter === '7days' ? 'active' : ''}`} onClick={() => { setPeriodFilter(periodFilter === '7days' ? '' : '7days'); setStatusFilter(''); }}>7 dias</button>
            <button className={`filter-btn ${periodFilter === '30days' ? 'active' : ''}`} onClick={() => { setPeriodFilter(periodFilter === '30days' ? '' : '30days'); setStatusFilter(''); }}>30 dias</button>
            <button className={`filter-btn ${statusFilter === 'em_producao' ? 'active' : ''}`} onClick={() => { setStatusFilter(statusFilter === 'em_producao' ? '' : 'em_producao'); setPeriodFilter(''); }}>Em produção</button>
            <button className={`filter-btn ${statusFilter === 'pronto' ? 'active' : ''}`} onClick={() => { setStatusFilter(statusFilter === 'pronto' ? '' : 'pronto'); setPeriodFilter(''); }}>Prontos</button>
            <button className={`filter-btn ${statusFilter === 'finalizado' ? 'active' : ''}`} onClick={() => { setStatusFilter(statusFilter === 'finalizado' ? '' : 'finalizado'); setPeriodFilter(''); }}>Finalizados</button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner fullPage message="Carregando currículos..." />
        ) : resumes.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>Nenhum currículo encontrado</h3>
            <p>Crie seu primeiro currículo profissional com inteligência artificial.</p>
            <Link href="/curriculos/novo" className="btn btn-primary">
              <Plus size={18} /> Criar Currículo
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table>
              <thead>
              <tr>
                <th>Cliente</th>
                <th style={{ width: '150px' }}>WhatsApp</th>
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
                  <td>
                    <Link href={`/leads/${resume.lead_id}`} className="table-name">
                      {resume.lead_name}
                    </Link>
                    <div className="text-xs text-muted">{resume.lead_code}</div>
                  </td>
                  <td>
                    <a
                      href={getWhatsAppLink(resume.lead_whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whatsapp-link text-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <MessageCircle size={14} />
                      {formatWhatsApp(resume.lead_whatsapp)}
                    </a>
                  </td>
                  <td>
                    <span className="badge badge-blue">V{resume.current_version}</span>
                  </td>
                  <td className="font-bold cursor-pointer hover:text-green-500 transition-colors" onClick={() => openPaymentModal(resume)} title="Clique para editar valor">
                    R$ {Number(resume.price || 0).toFixed(2).replace('.', ',')}
                  </td>
                  <td>
                    <span 
                      className={`badge badge-dot cursor-pointer hover:opacity-80 transition-opacity ${PAYMENT_STATUS_COLORS[resume.payment_status]}`}
                      onClick={() => openPaymentModal(resume)}
                      title="Clique para editar status"
                    >
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
                      {/* Quick actions — always visible */}
                      {resume.pdf_url && (
                        <>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Visualizar"
                            onClick={() => setViewResume(resume)}
                          >
                            <Eye size={15} />
                          </button>
                          <a
                            href={`/api/resumes/${resume.id}/download`}
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Download"
                          >
                            <Download size={15} />
                          </a>
                        </>
                      )}
                      <button
                        className="btn btn-ghost btn-icon btn-sm text-green-500 hover:bg-green-500/10"
                        title="Pagamento"
                        onClick={() => openPaymentModal(resume)}
                      >
                        <DollarSign size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Editar"
                        onClick={() => openEditModal(resume)}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Refazer"
                        onClick={() => setRedoResumeId(resume.id)}
                      >
                        <RefreshCw size={15} />
                      </button>

                      {/* More options dropdown */}
                      <div className="dropdown-wrapper">
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Mais opções"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === resume.id ? null : resume.id);
                          }}
                        >
                          <MoreVertical size={15} />
                        </button>
                        {openDropdown === resume.id && (
                          <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="dropdown-item"
                              onClick={() => { openVersionHistory(resume.id); setOpenDropdown(null); }}
                            >
                              <History size={16} /> Histórico de versões
                            </button>
                            <button className="dropdown-item" onClick={() => setOpenDropdown(null)}>
                              <Type size={16} /> Renomear
                            </button>
                            <button className="dropdown-item" onClick={() => setOpenDropdown(null)}>
                              <Link2 size={16} /> Vincular a outro Lead
                            </button>
                            <div className="dropdown-divider" />
                            <button
                              className="dropdown-item danger"
                              onClick={() => { setDeleteResumeId(resume.id); setOpenDropdown(null); }}
                            >
                              <Trash2 size={16} /> Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-white/5 bg-white/5 mt-4 rounded-lg">
                <div className="text-sm text-secondary">
                  Mostrando página {currentPage} de {totalPages} ({totalItems} currículos no total)
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={currentPage === 1}
                    onClick={() => fetchResumes(currentPage - 1)}
                  >
                    Anterior
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={currentPage === totalPages}
                    onClick={() => fetchResumes(currentPage + 1)}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal
        isOpen={!!viewResume}
        onClose={() => setViewResume(null)}
        title={viewResume ? `${viewResume.lead_name} — V${viewResume.current_version}` : ''}
        size="xl"
        footer={
          viewResume && (
            <>
              <a href={`/api/resumes/${viewResume.id}/download`} className="btn btn-secondary">
                <Download size={16} /> Download
              </a>
              <button className="btn btn-secondary" onClick={() => { openEditModal(viewResume); setViewResume(null); }}>
                <Edit3 size={16} /> Editar
              </button>
              <button className="btn btn-primary" onClick={() => { setRedoResumeId(viewResume.id); setViewResume(null); }}>
                <RefreshCw size={16} /> Refazer
              </button>
            </>
          )
        }
      >
        {viewResume?.pdf_url && (
          <div className="pdf-viewer-frame" style={{ height: '70vh' }}>
            <iframe
              src={`/api/resumes/${viewResume.id}/download?inline=true`}
              title="Visualizador de PDF"
            />
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editResumeId}
        onClose={() => { setEditResumeId(null); setEditResume(null); }}
        title={editResume ? `Editar — ${editResume.lead_name}` : 'Editar Currículo'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setEditResumeId(null); setEditResume(null); }} disabled={editLoading}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleEdit} disabled={editLoading || (!editInstruction.trim() && editFiles.length === 0 && !editProfilePhoto)}>
              {editLoading ? <LoadingSpinner size={16} message="Aplicando alterações..." /> : 'Aplicar alterações'}
            </button>
          </>
        }
      >
        {editResume?.pdf_url && (
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="pdf-viewer-frame" style={{ height: '40vh', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <iframe src={`/api/resumes/${editResume.id}/download?inline=true`} title="Currículo atual" />
            </div>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Foto de Perfil (Opcional)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 'var(--space-md)' }}>
            {editProfilePhoto ? (
              <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                <img src={editProfilePhoto} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--accent-primary)' }} />
                <button 
                  type="button"
                  onClick={() => setEditProfilePhoto(null)}
                  style={{ position: 'absolute', top: -5, right: -5, background: 'var(--danger-color)', color: '#fff', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div style={{
                position: 'relative', width: '80px', height: '80px', borderRadius: '50%', 
                backgroundColor: 'var(--bg-input)', border: '2px dashed var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden'
              }}>
                <Camera size={24} color="var(--text-muted)" />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleProfilePhotoSelect}
                  disabled={editLoading}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
              </div>
            )}
            <div className="text-sm text-muted">
              {editProfilePhoto ? 'Foto selecionada para substituição' : 'Clique para substituir/adicionar foto de perfil'}
            </div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Anexar documentos (opcional)</label>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <div style={{ 
              border: '2px dashed var(--border-color)', 
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-md)',
              textAlign: 'center',
              cursor: editLoading ? 'not-allowed' : 'pointer',
              position: 'relative',
              backgroundColor: 'var(--bg-input)'
            }}>
              <input 
                type="file" 
                multiple 
                accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp,image/jpg,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.m4a,.aac"
                onChange={handleFileChange}
                disabled={editLoading}
                style={{
                  position: 'absolute',
                  top: 0, left: 0, width: '100%', height: '100%',
                  opacity: 0, cursor: 'pointer'
                }}
              />
              <Paperclip size={24} style={{ marginBottom: '8px', color: 'var(--text-muted)' }} />
              <p className="text-sm">Clique ou arraste arquivos PDF, Word, Imagens ou Áudios aqui</p>
              <p className="text-xs text-muted">A IA lerá o conteúdo dos documentos/imagens e transcreverá os áudios automaticamente</p>
            </div>
            
            {editFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {editFiles.map((file, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <FileText size={16} style={{ color: 'var(--accent-color)' }} />
                      <span className="text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {file.name}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeFile(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', padding: '4px' }}
                      title="Remover"
                      disabled={editLoading}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <label className="form-label">O que você deseja alterar?</label>
          <textarea
            className="form-textarea form-textarea-large"
            placeholder="Exemplo: altere o endereço para Rua X, remova a experiência na empresa Y, adicione CNH AB e mantenha todo o restante exatamente igual. Ou apenas deixe em branco se quiser extrair as informações do PDF em anexo."
            value={editInstruction}
            onChange={(e) => setEditInstruction(e.target.value)}
            disabled={editLoading}
          />
        </div>
        {editLoading && (
          <div className="loading-overlay" style={{ padding: 'var(--space-md)' }}>
            <LoadingSpinner size={32} />
            <p>Aplicando alterações via IA... Isso pode levar alguns segundos.</p>
          </div>
        )}
      </Modal>

      {/* Redo Confirm */}
      <ConfirmDialog
        isOpen={!!redoResumeId}
        onClose={() => setRedoResumeId(null)}
        onConfirm={handleRedo}
        title="Refazer Currículo"
        message="Gerar novamente este currículo utilizando as mesmas informações?"
        confirmLabel="Refazer currículo"
        loading={redoLoading}
      />

      {/* Payment Modal */}
      <Modal
        isOpen={!!paymentResumeId}
        onClose={() => setPaymentResumeId(null)}
        title="Editar Pagamento"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setPaymentResumeId(null)} disabled={paymentLoading}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handlePaymentUpdate} disabled={paymentLoading}>
              {paymentLoading ? <LoadingSpinner size={16} /> : 'Salvar Pagamento'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Valor (R$)</label>
          <input
            type="number"
            className="form-input"
            step="0.01"
            value={paymentPrice}
            onChange={(e) => setPaymentPrice(parseFloat(e.target.value))}
            disabled={paymentLoading}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Status do Pagamento</label>
          <select
            className="form-select"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
            disabled={paymentLoading}
          >
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
          </select>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteResumeId}
        onClose={() => setDeleteResumeId(null)}
        onConfirm={handleDelete}
        title="Excluir Currículo"
        message="Tem certeza que deseja excluir este currículo? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
      />

      {/* Version History Modal */}
      <Modal
        isOpen={!!versionResumeId}
        onClose={() => setVersionResumeId(null)}
        title="Histórico de Versões"
        size="lg"
      >
        {versionsLoading ? (
          <LoadingSpinner fullPage message="Carregando versões..." />
        ) : versions.length === 0 ? (
          <div className="empty-state">
            <History size={48} />
            <p>Nenhuma versão encontrada</p>
          </div>
        ) : (
          <div className="version-list">
            {versions.map((version, idx) => (
              <div key={version.id} className={`version-item ${idx === 0 ? 'current' : ''}`}>
                <div className="version-info">
                  <div className="version-number">
                    V{version.version_number}
                    {idx === 0 && <span className="badge badge-green" style={{ marginLeft: '8px' }}>Atual</span>}
                  </div>
                  <div className="version-date">{formatDateTime(version.created_at)}</div>
                  {version.edit_instruction && (
                    <div className="version-instruction">&quot;{version.edit_instruction}&quot;</div>
                  )}
                  {!version.edit_instruction && (
                    <div className="version-instruction">Currículo criado</div>
                  )}
                </div>
                <div className="version-actions">
                  {version.pdf_url && (
                    <>
                      <a href={`/api/resumes/${versionResumeId}/download?version=${version.version_number}&inline=true`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" title="Visualizar">
                        <Eye size={14} />
                      </a>
                      <a href={`/api/resumes/${versionResumeId}/download?version=${version.version_number}`} className="btn btn-ghost btn-sm" title="Download">
                        <Download size={14} />
                      </a>
                    </>
                  )}
                  {idx !== 0 && versionResumeId && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRestore(versionResumeId, version.id)}
                    >
                      Restaurar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {editCropImageUrl && (
        <ImageCropper 
          imageUrl={editCropImageUrl}
          onCropComplete={(base64) => {
            setEditProfilePhoto(base64);
            setEditCropImageUrl(null);
          }}
          onCancel={() => setEditCropImageUrl(null)}
        />
      )}
    </>
  );
}
