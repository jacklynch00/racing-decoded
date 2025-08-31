import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        dnaProfile: true,
      },
      orderBy: {
        dnaProfile: {
          racesAnalyzed: 'desc',
        },
      },
    });

    // Filter out drivers without DNA profiles and format the data
    const driversWithDNA = drivers
      .filter(driver => driver.dnaProfile)
      .map(driver => ({
        id: driver.driverId,
        name: `${driver.forename} ${driver.surname}`,
        nationality: driver.nationality,
        dnaProfile: driver.dnaProfile,
      }));

    return NextResponse.json(driversWithDNA);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}