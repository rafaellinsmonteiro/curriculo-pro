// ==========================================
// CurrículoPRO — Dashboard API
// ==========================================

import { NextResponse } from 'next/server';
import { getLeadStats, getDashboardChartsData } from '@/lib/services/leads';
import { getRecentActivities } from '@/lib/services/activities';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as 'today' | '7days' | '30days' | 'all') || '30days';

    const stats = await getLeadStats(period);
    const recentActivities = await getRecentActivities(10);
    const chartsData = await getDashboardChartsData(period);

    return NextResponse.json({
      stats,
      recentActivities,
      chartsData,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dashboard' },
      { status: 500 }
    );
  }
}
