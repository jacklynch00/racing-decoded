import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const raceIdParam = searchParams.get('raceId');

		if (!raceIdParam) {
			return NextResponse.json({ error: 'raceId parameter is required' }, { status: 400 });
		}

		const raceId = parseInt(raceIdParam);
		if (isNaN(raceId)) {
			return NextResponse.json({ error: 'Invalid raceId' }, { status: 400 });
		}

		// Get all drivers who participated in this race
		const results = await prisma.result.findMany({
			where: {
				raceId: raceId,
			},
			orderBy: [
				{ grid: 'asc' }, // Order by grid position first
				{ positionOrder: 'asc' }, // Then by final position
			],
		});

		if (results.length === 0) {
			return NextResponse.json({ error: 'No drivers found for this race' }, { status: 404 });
		}

		// Get driver details for all results
		const driverIds = results.map((result) => result.driverId);
		const drivers = await prisma.driver.findMany({
			where: {
				driverId: { in: driverIds },
			},
		});

		// Create a map for quick lookup
		const driverMap = new Map(drivers.map((driver) => [driver.driverId, driver]));

		// Format the response
		const formattedDrivers = results
			.map((result) => {
				const driver = driverMap.get(result.driverId);
				if (!driver) return null;

				return {
					driverId: driver.driverId,
					name: `${driver.forename} ${driver.surname}`,
					nationality: driver.nationality,
					gridPosition: result.grid,
					finishPosition: result.position,
					points: result.points,
					laps: result.laps,
				};
			})
			.filter(Boolean);

		// Remove duplicates (though there shouldn't be any)
		const uniqueDrivers = formattedDrivers.filter((driver, index, self) => {
			if (!driver) return false;
			return index === self.findIndex((d) => d && d.driverId === driver.driverId);
		});

		return NextResponse.json(uniqueDrivers);
	} catch (error) {
		console.error('Error fetching drivers:', error);
		return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
	}
}
