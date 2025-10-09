import { NextResponse } from 'next/server';
import { ServiceContainer } from '../../services/service-container';

export async function GET() {
  try {
    const container = ServiceContainer.getInstance();
    const kpiService = await container.getKpiService();
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