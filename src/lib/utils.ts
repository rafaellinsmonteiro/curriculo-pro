// ==========================================
// CurrículoPRO — Utility Functions
// ==========================================

import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique UUID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Normalizes a Brazilian phone number to international format.
 * Input: "79999999999" → Output: "5579999999999"
 * Input: "5579999999999" → Output: "5579999999999"
 * Input: "(79) 99999-9999" → Output: "5579999999999"
 */
export function normalizeWhatsApp(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Already has country code
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }

  // Add country code
  return `55${digits}`;
}

/**
 * Generates a WhatsApp link from a phone number
 */
export function getWhatsAppLink(phone: string): string {
  return `https://wa.me/${normalizeWhatsApp(phone)}`;
}

/**
 * Formats a date string to Brazilian format
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formats a date string with time
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a time string (HH:mm)
 */
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Returns relative time string (e.g., "há 5 minutos")
 */
export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays < 7) return `há ${diffDays}d`;
  return formatDate(dateStr);
}

/**
 * Sanitizes a filename for safe PDF storage
 */
export function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-zA-Z0-9_\-\s]/g, '') // Remove special chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim();
}

/**
 * Generates a PDF filename from client name
 * Example: "João da Silva" → "Curriculo_Joao_da_Silva.pdf"
 */
export function generatePdfFilename(clientName: string): string {
  return `Curriculo_${sanitizeFilename(clientName)}.pdf`;
}

/**
 * Formats a WhatsApp number for display
 * "5579999999999" → "(79) 99999-9999"
 */
export function formatWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const national = digits.startsWith('55') ? digits.slice(2) : digits;

  if (national.length === 11) {
    return `(${national.slice(0, 2)}) ${national.slice(2, 7)}-${national.slice(7)}`;
  }
  if (national.length === 10) {
    return `(${national.slice(0, 2)}) ${national.slice(2, 6)}-${national.slice(6)}`;
  }
  return phone;
}

/**
 * Checks if a date is today
 */
export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Checks if a date is within the last N days
 */
export function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}
