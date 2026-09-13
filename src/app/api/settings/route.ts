// ==========================================
// CurrículoPRO — Settings API
// ==========================================

import { NextResponse } from 'next/server';
import { isApiKeyConfigured } from '@/lib/services/openai';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({
      openai: {
        configured: isApiKeyConfigured(),
      },
    });
  } catch (error) {
    console.error('Error checking settings:', error);
    return NextResponse.json({ error: 'Erro ao verificar configurações' }, { status: 500 });
  }
}
