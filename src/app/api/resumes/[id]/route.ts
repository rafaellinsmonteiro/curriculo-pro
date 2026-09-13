// ==========================================
// CurrículoPRO — Resume Detail API
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { getResumeWithLead, deleteResume, renameResume, reassignResume } from '@/lib/services/resumes';
import { getVersionsByResumeId } from '@/lib/services/resume-versions';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: RouteContext<'/api/resumes/[id]'>
) {
  try {
    const { id } = await context.params;
    const resume = await getResumeWithLead(id);

    if (!resume) {
      return NextResponse.json({ error: 'Currículo não encontrado' }, { status: 404 });
    }

    const versions = await getVersionsByResumeId(id);

    return NextResponse.json({ resume, versions });
  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json({ error: 'Erro ao buscar currículo' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext<'/api/resumes/[id]'>
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (body.title) {
      await renameResume(id, body.title);
    }
    if (body.lead_id) {
      await reassignResume(id, body.lead_id);
    }

    const resume = await getResumeWithLead(id);
    return NextResponse.json(resume);
  } catch (error) {
    console.error('Error updating resume:', error);
    return NextResponse.json({ error: 'Erro ao atualizar currículo' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<'/api/resumes/[id]'>
) {
  try {
    const { id } = await context.params;
    const deleted = await deleteResume(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Currículo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json({ error: 'Erro ao excluir currículo' }, { status: 500 });
  }
}
