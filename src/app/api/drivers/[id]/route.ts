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

    const driver = await prisma.driver.findUnique({
      where: { driverId },
      include: {
        dnaProfile: true,
        dnaBreakdowns: true,
        racingStats: true,
      },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    // If racing stats don't exist, we'll show zeros/nulls
    const racingStats = driver.racingStats;

    return NextResponse.json({
      id: driver.driverId,
      name: `${driver.forename} ${driver.surname}`,
      nationality: driver.nationality,
      dob: driver.dob,
      url: driver.url,
      dnaProfile: {
        ...driver.dnaProfile,
        // Add racing statistics from the dedicated table
        wins: racingStats?.wins || 0,
        secondPlaces: racingStats?.secondPlaces || 0,
        thirdPlaces: racingStats?.thirdPlaces || 0,
        podiums: racingStats?.podiums || 0,
        avgFinishPosition: racingStats?.avgFinishPosition || null,
        bestChampionshipFinish: racingStats?.bestChampionshipFinish || null,
        avgChampionshipFinish: racingStats?.avgChampionshipFinish || null,
      },
      dnaBreakdowns: driver.dnaBreakdowns,
    });
  } catch (error) {
    console.error('Error fetching driver:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver' },
      { status: 500 }
    );
  }
}