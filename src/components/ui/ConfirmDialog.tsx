'use client';

import { Modal } from './Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'warning' | 'danger';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  variant = 'warning',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processando...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className={`confirm-icon ${variant}`}>
        {variant === 'danger' ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
      </div>
      <p className="confirm-text">{message}</p>
    </Modal>
  );
}
