import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const driverId = parseInt(id);

    if (isNaN(driverId)) {
      return NextResponse.json(
        { error: 'Invalid driver ID' },
        { status: 400 }
      );
    }

    const timeline = await prisma.driverDnaTimeline.findMany({
      where: { driverId },
      orderBy: { season: 'asc' },
    });

    if (timeline.length === 0) {
      return NextResponse.json(
        { error: 'No timeline data found for this driver' },
        { status: 404 }
      );
    }

    // Format timeline data for charts
    const formattedTimeline = timeline.map(entry => ({
      season: entry.season,
      racesCompleted: entry.racesCompleted,
      traitScores: entry.traitScores,
    }));

    return NextResponse.json(formattedTimeline);
  } catch (error) {
    console.error('Error fetching driver timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver timeline' },
      { status: 500 }
    );
  }
}