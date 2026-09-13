// ==========================================
// CurrículoPRO — Leads API
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createLead, getLeads } from '@/lib/services/leads';
import type { LeadStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as LeadStatus) || undefined;

    const leads = await getLeads({ search, status });
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.whatsapp) {
      return NextResponse.json(
        { error: 'Nome e WhatsApp são obrigatórios' },
        { status: 400 }
      );
    }

    const lead = await createLead({
      name: body.name.trim(),
      whatsapp: body.whatsapp.trim(),
      notes: body.notes?.trim() || undefined,
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Erro ao criar lead' }, { status: 500 });
  }
}
