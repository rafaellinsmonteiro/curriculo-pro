// ==========================================
// CurrículoPRO — Resume Versions API
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { getVersionsByResumeId } from '@/lib/services/resume-versions';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: RouteContext<'/api/resumes/[id]/versions'>
) {
  try {
    const { id } = await context.params;
    const versions = getVersionsByResumeId(id);
    return NextResponse.json(versions);
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json({ error: 'Erro ao buscar versões' }, { status: 500 });
  }
}
