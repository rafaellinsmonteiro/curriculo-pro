// ==========================================
// CurrículoPRO — Lead Detail API
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { getLeadById, updateLead, deleteLead } from '@/lib/services/leads';
import { getResumesByLeadId } from '@/lib/services/resumes';
import { getActivitiesByLeadId } from '@/lib/services/activities';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: RouteContext<'/api/leads/[id]'>
) {
  try {
    const { id } = await context.params;
    const lead = getLeadById(id);

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    const resumes = getResumesByLeadId(id);
    const activities = getActivitiesByLeadId(id);

    return NextResponse.json({ lead, resumes, activities });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json({ error: 'Erro ao buscar lead' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext<'/api/leads/[id]'>
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const lead = updateLead(id, body);
    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Erro ao atualizar lead' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<'/api/leads/[id]'>
) {
  try {
    const { id } = await context.params;
    const deleted = deleteLead(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Erro ao excluir lead' }, { status: 500 });
  }
}
