'use client';

// ==========================================
// CurrículoPRO — Login Page
// ==========================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao realizar login');
      }

      router.push('/curriculos');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <FileText size={28} />
          </div>
          <h1 className="login-title">CurrículoPRO</h1>
          <p className="login-subtitle">Acesso ao Painel Administrativo</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="login-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>E-mail Administrativo</label>
            <div className="login-input-wrapper">
              <Mail className="login-input-icon" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label>Senha de Acesso</label>
            <div className="login-input-wrapper">
              <Lock className="login-input-icon" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '8px' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                Entrando...
              </>
            ) : (
              <>
                Entrar no Sistema
                <ArrowRight size={18} style={{ marginLeft: '8px' }} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          🔒 Acesso restrito a administradores autorizados.
        </div>
      </div>
    </div>
  );
}
