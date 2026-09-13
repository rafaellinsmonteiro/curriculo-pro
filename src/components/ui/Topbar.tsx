'use client';

import { Search, Bell, Menu, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TopbarProps {
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <button className="mobile-menu-btn" onClick={onMenuToggle}>
          <Menu size={24} />
        </button>
        <div className="topbar-search">
          <Search />
          <input type="text" placeholder="Buscar leads, currículos..." />
        </div>
      </div>

      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <button className="topbar-btn" title="Notificações">
          <Bell size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="topbar-avatar" title="Rafael Lins Monteiro (Admin)">
            RL
          </div>
          <button
            onClick={handleLogout}
            className="topbar-btn"
            title="Sair da Conta"
            style={{ color: '#ef4444' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
