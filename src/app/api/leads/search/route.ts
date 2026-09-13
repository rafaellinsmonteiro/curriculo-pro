// ==========================================
// CurrículoPRO — Lead Search API
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { searchLeads } from '@/lib/services/leads';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (q.length < 1) {
      return NextResponse.json([]);
    }

    const leads = searchLeads(q);
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error searching leads:', error);
    return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 });
  }
}
