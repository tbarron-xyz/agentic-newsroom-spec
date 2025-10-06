import { NextResponse } from 'next/server';
import { KpiService } from '../../services/kpi.service';

export async function GET() {
  try {
    const kpiService = new KpiService();
    const kpiData = await kpiService.getAllKpis();

    return NextResponse.json(kpiData);
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPI data' },
      { status: 500 }
    );
  }
}