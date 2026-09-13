'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/curriculos', label: 'Currículos', icon: FileText },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {isOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 99 }}
          onClick={onClose}
        />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">CP</div>
          <h1>CurrículoPRO</h1>
          <button
            className="mobile-menu-btn"
            onClick={onClose}
            style={{ marginLeft: 'auto' }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={onClose}
            >
              <item.icon />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            CurrículoPRO v1.0
          </div>
        </div>
      </aside>
    </>
  );
}
