import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('trackId');

    if (!trackId) {
      return NextResponse.json(
        { error: 'trackId parameter is required' },
        { status: 400 }
      );
    }

    // Map track IDs to circuit references
    const circuitMapping: Record<string, string> = {
      'monaco': 'monaco',
      'silverstone': 'silverstone',
      'spa': 'spa'
    };

    const circuitRef = circuitMapping[trackId];
    if (!circuitRef) {
      return NextResponse.json(
        { error: 'Track not supported' },
        { status: 400 }
      );
    }

    // Get races for the specific circuit, ordered by most recent first
    const races = await prisma.race.findMany({
      where: {
        circuit: {
          circuitRef: circuitRef
        }
      },
      include: {
        circuit: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 20 // Limit to last 20 races
    });

    // Format the response
    const formattedRaces = races.map(race => ({
      raceId: race.raceId,
      name: race.name,
      year: race.year,
      date: race.date.toISOString(),
      circuitId: race.circuitId,
      circuit: {
        name: race.circuit.name,
        location: race.circuit.location,
        country: race.circuit.country
      }
    }));

    return NextResponse.json(formattedRaces);
  } catch (error) {
    console.error('Error fetching races:', error);
    return NextResponse.json(
      { error: 'Failed to fetch races' },
      { status: 500 }
    );
  }
}