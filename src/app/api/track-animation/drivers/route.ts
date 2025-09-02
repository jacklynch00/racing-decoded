import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raceIdParam = searchParams.get('raceId');

    if (!raceIdParam) {
      return NextResponse.json(
        { error: 'raceId parameter is required' },
        { status: 400 }
      );
    }

    const raceId = parseInt(raceIdParam);
    if (isNaN(raceId)) {
      return NextResponse.json(
        { error: 'Invalid raceId' },
        { status: 400 }
      );
    }

    // Get all drivers who participated in this race
    const results = await prisma.result.findMany({
      where: {
        raceId: raceId
      },
      include: {
        driver: true
      },
      orderBy: [
        { grid: 'asc' }, // Order by grid position first
        { positionOrder: 'asc' } // Then by final position
      ]
    });

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'No drivers found for this race' },
        { status: 404 }
      );
    }

    // Format the response
    const drivers = results.map(result => ({
      driverId: result.driver.driverId,
      name: `${result.driver.forename} ${result.driver.surname}`,
      nationality: result.driver.nationality,
      gridPosition: result.grid,
      finishPosition: result.position,
      points: result.points,
      laps: result.laps
    }));

    // Remove duplicates (though there shouldn't be any)
    const uniqueDrivers = drivers.filter((driver, index, self) =>
      index === self.findIndex(d => d.driverId === driver.driverId)
    );

    return NextResponse.json(uniqueDrivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}