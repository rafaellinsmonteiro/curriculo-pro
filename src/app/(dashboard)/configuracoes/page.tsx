'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Brain } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ConfiguracoesPage() {
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setApiConfigured(data.openai?.configured || false);
      })
      .catch(() => {
        setApiConfigured(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullPage message="Carregando configurações..." />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Configurações</h1>
          <p className="page-header-subtitle">Gerencie as configurações do sistema</p>
        </div>
      </div>

      {/* AI Settings */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={20} />
            Inteligência Artificial
          </h3>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: apiConfigured ? 'var(--accent-green-soft)' : 'var(--accent-red-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {apiConfigured ? (
                  <CheckCircle size={24} style={{ color: 'var(--accent-green)' }} />
                ) : (
                  <XCircle size={24} style={{ color: 'var(--accent-red)' }} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>API OpenAI</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {apiConfigured ? 'Configurada e pronta para uso' : 'Não configurada'}
                </div>
              </div>
            </div>

            <span className={`badge ${apiConfigured ? 'badge-green' : 'badge-red'} badge-dot`}>
              {apiConfigured ? 'Configurada' : 'Não configurada'}
            </span>
          </div>

          {!apiConfigured && (
            <div style={{
              marginTop: 'var(--space-lg)',
              padding: 'var(--space-md)',
              background: 'var(--accent-yellow-soft)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-yellow)',
              fontSize: '0.85rem',
            }}>
              <strong>Atenção:</strong> Configure a variável <code>OPENAI_API_KEY</code> no arquivo <code>.env.local</code> para habilitar a geração de currículos.
            </div>
          )}

          <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-light)' }}>
            <p className="text-sm text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} />
              A chave da API é armazenada exclusivamente no servidor e nunca é exposta ao navegador.
            </p>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Informações do Sistema</h3>
        </div>
        <div className="card">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-item-label">Versão</span>
              <span className="info-item-value">1.0.0</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Framework</span>
              <span className="info-item-value">Next.js 16</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Banco de Dados</span>
              <span className="info-item-value">SQLite</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Modelo IA</span>
              <span className="info-item-value">GPT-4o-mini</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
