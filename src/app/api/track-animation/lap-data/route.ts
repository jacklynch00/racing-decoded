import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raceIdParam = searchParams.get('raceId');
    const driverIdParam = searchParams.get('driverId');

    if (!raceIdParam || !driverIdParam) {
      return NextResponse.json(
        { error: 'raceId and driverId parameters are required' },
        { status: 400 }
      );
    }

    const raceId = parseInt(raceIdParam);
    const driverId = parseInt(driverIdParam);

    if (isNaN(raceId) || isNaN(driverId)) {
      return NextResponse.json(
        { error: 'Invalid raceId or driverId' },
        { status: 400 }
      );
    }

    // Get lap times for the specific race and driver
    const lapTimes = await prisma.lapTime.findMany({
      where: {
        raceId: raceId,
        driverId: driverId
      },
      orderBy: {
        lap: 'asc'
      },
      select: {
        lap: true,
        position: true,
        time: true,
        milliseconds: true
      }
    });

    // Get pit stops for this race and driver
    const pitStops = await prisma.pitStop.findMany({
      where: {
        raceId: raceId,
        driverId: driverId
      },
      orderBy: {
        stop: 'asc'
      },
      select: {
        stop: true,
        lap: true,
        time: true,
        duration: true,
        milliseconds: true
      }
    });

    // Get race result for context
    const raceResult = await prisma.result.findFirst({
      where: {
        raceId: raceId,
        driverId: driverId
      },
      include: {
        driver: true,
        race: {
          include: {
            circuit: true
          }
        }
      }
    });

    if (!raceResult) {
      return NextResponse.json(
        { error: 'No result found for this race and driver combination' },
        { status: 404 }
      );
    }

    // Format lap times for animation (convert milliseconds to seconds)
    const formattedLapTimes = lapTimes.map(lap => ({
      lap: lap.lap,
      position: lap.position,
      timeString: lap.time,
      timeSeconds: lap.milliseconds ? Number(lap.milliseconds) / 1000 : null
    }));

    // Format pit stops
    const formattedPitStops = pitStops.map(stop => ({
      stop: stop.stop,
      lap: stop.lap,
      timeString: stop.time,
      duration: stop.duration,
      durationMs: stop.milliseconds ? Number(stop.milliseconds) : null
    }));

    const response = {
      raceInfo: {
        raceId: raceResult.race.raceId,
        raceName: raceResult.race.name,
        year: raceResult.race.year,
        circuitName: raceResult.race.circuit.name,
        date: raceResult.race.date
      },
      driverInfo: {
        driverId: raceResult.driver.driverId,
        name: `${raceResult.driver.forename} ${raceResult.driver.surname}`,
        nationality: raceResult.driver.nationality
      },
      raceResult: {
        gridPosition: raceResult.grid,
        finishPosition: raceResult.position,
        points: raceResult.points,
        totalLaps: raceResult.laps,
        status: raceResult.positionText
      },
      lapTimes: formattedLapTimes,
      pitStops: formattedPitStops,
      animationData: {
        totalLaps: formattedLapTimes.length,
        hasLapTimes: formattedLapTimes.length > 0,
        hasPitStops: formattedPitStops.length > 0,
        averageLapTime: formattedLapTimes.length > 0 
          ? formattedLapTimes
              .filter(lap => lap.timeSeconds !== null)
              .reduce((sum, lap) => sum + (lap.timeSeconds || 0), 0) / formattedLapTimes.filter(lap => lap.timeSeconds !== null).length
          : null
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching lap data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lap data' },
      { status: 500 }
    );
  }
}