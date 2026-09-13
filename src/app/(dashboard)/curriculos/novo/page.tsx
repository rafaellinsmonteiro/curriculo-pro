'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Sparkles, Paperclip, X
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { ImageCropper } from '@/components/ui/ImageCropper';
import { Camera } from 'lucide-react';

function NovoCurriculoContent() {
  const router = useRouter();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  }

  function handleProfilePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          setCropImageUrl(reader.result?.toString() || null);
        });
        reader.readAsDataURL(file);
      } else {
        showToast('Por favor, selecione uma imagem válida', 'error');
      }
      e.target.value = ''; // Reset input
    }
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate() {
    if (!prompt.trim() && files.length === 0) {
      showToast('Forneça instruções ou anexe pelo menos um arquivo ou imagem.', 'error');
      return;
    }

    setGenerating(true);
    try {
      const formData = new FormData();
      if (title.trim()) formData.append('title', title.trim());
      if (prompt.trim()) formData.append('prompt', prompt.trim());
      if (profilePhoto) formData.append('foto_perfil', profilePhoto);
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const res = await fetch('/api/resumes', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao gerar currículo');
      }

      showToast('Currículo criado com sucesso!', 'success');
      router.push('/curriculos');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao gerar currículo. Tente novamente.', 'error');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <Link href="/curriculos" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-lg)' }}>
        <ArrowLeft size={18} />
        Voltar para Currículos
      </Link>

      <div className="page-header">
        <div>
          <h1>Criar Currículo</h1>
          <p className="page-header-subtitle">
            Informe os dados ou anexe um arquivo para criar o currículo. O cliente será vinculado ou criado automaticamente.
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '900px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>
          Informações do Currículo
        </h3>

        <div className="form-group">
          <label className="form-label">
            Título do Currículo (Opcional)
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: Currículo de João da Silva"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={generating}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Foto de Perfil (Opcional)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {profilePhoto ? (
              <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                <img src={profilePhoto} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--accent-primary)' }} />
                <button 
                  type="button"
                  onClick={() => setProfilePhoto(null)}
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
                  disabled={generating}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
              </div>
            )}
            <div className="text-sm text-muted">
              {profilePhoto ? 'Foto selecionada' : 'Clique para adicionar uma foto de perfil'}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Anexos (PDF, Imagens ou Áudios)
          </label>
          <div style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-lg)',
            textAlign: 'center',
            cursor: generating ? 'not-allowed' : 'pointer',
            position: 'relative',
            backgroundColor: 'var(--bg-input)'
          }}>
            <input 
              type="file" 
              multiple 
              accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp,image/jpg,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.m4a,.aac"
              onChange={handleFileChange}
              disabled={generating}
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
          
          {files.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {files.map((file, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                    <Paperclip size={16} color="var(--accent-primary)" />
                    {file.name}
                  </div>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={() => removeFile(idx)}
                    disabled={generating}
                    style={{ padding: '4px', color: 'var(--accent-red)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">
            Instruções Adicionais / Prompt
          </label>
          <textarea
            className="form-textarea form-textarea-large"
            placeholder={files.length > 0 ? "Adicione instruções extras sobre como a IA deve organizar os dados do anexo (opcional)..." : `Cole aqui todas as informações do cliente:

• Endereço, E-mail, etc.
• Experiências profissionais
• Objetivo profissional
• Habilidades`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
          />
        </div>

        {generating && (
          <div className="loading-overlay">
            <LoadingSpinner size={40} />
            <p>Processando arquivos e gerando currículo com IA...</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
          <Link href="/curriculos" className="btn btn-secondary">
            Cancelar
          </Link>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleGenerate}
            disabled={generating || (!prompt.trim() && files.length === 0)}
          >
            <Sparkles size={20} />
            {generating ? 'Gerando currículo...' : 'Gerar Currículo'}
          </button>
        </div>
      </div>
      {cropImageUrl && (
        <ImageCropper 
          imageUrl={cropImageUrl}
          onCropComplete={(base64) => {
            setProfilePhoto(base64);
            setCropImageUrl(null);
          }}
          onCancel={() => setCropImageUrl(null)}
        />
      )}
    </>
  );
}

export default function NovoCurriculo() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NovoCurriculoContent />
    </Suspense>
  );
}
