'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/ui/Sidebar';
import { Topbar } from '@/components/ui/Topbar';
import { ToastProvider } from '@/components/ui/Toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <ToastProvider>
      <div className="app-layout">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="main-area">
          <Topbar onMenuToggle={toggleSidebar} />
          <div className="page-content">
            {children}
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
