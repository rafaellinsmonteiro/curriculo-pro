// ==========================================
// CurrículoPRO — Dashboard API
// ==========================================

import { NextResponse } from 'next/server';
import { getLeadStats } from '@/lib/services/leads';
import { getRecentActivities } from '@/lib/services/activities';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getLeadStats();
    const recentActivities = await getRecentActivities(10);

    return NextResponse.json({
      stats,
      recentActivities,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dashboard' },
      { status: 500 }
    );
  }
}
