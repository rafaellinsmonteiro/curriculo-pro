'use client';

import { Search, Bell, Menu } from 'lucide-react';

interface TopbarProps {
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
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

      <div className="topbar-actions">
        <button className="topbar-btn" title="Notificações">
          <Bell size={18} />
        </button>
        <div className="topbar-avatar">OP</div>
      </div>
    </header>
  );
}
