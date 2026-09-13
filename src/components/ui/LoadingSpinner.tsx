'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({ size = 24, message, fullPage = false }: LoadingSpinnerProps) {
  if (fullPage) {
    return (
      <div className="loading-overlay">
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
        {message && <p>{message}</p>}
      </div>
    );
  }

  return (
    <span className="loading-spinner">
      <Loader2 size={size} style={{ color: 'var(--accent-primary)' }} />
      {message && <span style={{ marginLeft: 8, fontSize: '0.85rem' }}>{message}</span>}
    </span>
  );
}
