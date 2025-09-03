/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Driver, DriverDnaProfile, DriverRacingStats, Result, Race } from '@prisma/client';

type DriverWithIncludes = Driver & {
	dnaProfile: DriverDnaProfile | null;
	racingStats: DriverRacingStats | null;
	results?: (Result & { race: Race })[];
};

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);

		// Parse filter parameters
		const minAggression = searchParams.get('minAggression');
		const maxAggression = searchParams.get('maxAggression');
		const minConsistency = searchParams.get('minConsistency');
		const maxConsistency = searchParams.get('maxConsistency');
		const minRacecraft = searchParams.get('minRacecraft');
		const maxRacecraft = searchParams.get('maxRacecraft');
		const minPressure = searchParams.get('minPressure');
		const maxPressure = searchParams.get('maxPressure');
		const minRaceStart = searchParams.get('minRaceStart');
		const maxRaceStart = searchParams.get('maxRaceStart');
		const minClutch = searchParams.get('minClutch');
		const maxClutch = searchParams.get('maxClutch');

		const minRaces = searchParams.get('minRaces');
		const maxRaces = searchParams.get('maxRaces');

		const minYear = searchParams.get('minYear');
		const maxYear = searchParams.get('maxYear');

		// Parse sorting parameters
		const sortBy = searchParams.get('sortBy') || 'racesAnalyzed';
		const sortOrder = searchParams.get('sortOrder') || 'desc';

		// Build where clause for DNA profile filters
		const dnaProfileWhere: any = {};

		if (minAggression || maxAggression) {
			dnaProfileWhere.aggressionScore = {
				...(minAggression && { gte: parseFloat(minAggression) }),
				...(maxAggression && { lte: parseFloat(maxAggression) }),
			};
		}

		if (minConsistency || maxConsistency) {
			dnaProfileWhere.consistencyScore = {
				...(minConsistency && { gte: parseFloat(minConsistency) }),
				...(maxConsistency && { lte: parseFloat(maxConsistency) }),
			};
		}

		if (minRacecraft || maxRacecraft) {
			dnaProfileWhere.racecraftScore = {
				...(minRacecraft && { gte: parseFloat(minRacecraft) }),
				...(maxRacecraft && { lte: parseFloat(maxRacecraft) }),
			};
		}

		if (minPressure || maxPressure) {
			dnaProfileWhere.pressurePerformanceScore = {
				...(minPressure && { gte: parseFloat(minPressure) }),
				...(maxPressure && { lte: parseFloat(maxPressure) }),
			};
		}

		if (minRaceStart || maxRaceStart) {
			dnaProfileWhere.raceStartScore = {
				...(minRaceStart && { gte: parseFloat(minRaceStart) }),
				...(maxRaceStart && { lte: parseFloat(maxRaceStart) }),
			};
		}

		if (minClutch || maxClutch) {
			dnaProfileWhere.clutchFactorScore = {
				...(minClutch && { gte: parseFloat(minClutch) }),
				...(maxClutch && { lte: parseFloat(maxClutch) }),
			};
		}

		if (minRaces || maxRaces) {
			dnaProfileWhere.racesAnalyzed = {
				...(minRaces && { gte: parseInt(minRaces) }),
				...(maxRaces && { lte: parseInt(maxRaces) }),
			};
		}

		// Build order by clause
		let orderBy: any = {};

		if (['aggressionScore', 'consistencyScore', 'racecraftScore', 'pressurePerformanceScore', 'raceStartScore', 'clutchFactorScore', 'racesAnalyzed'].includes(sortBy)) {
			orderBy = {
				dnaProfile: {
					[sortBy]: sortOrder,
				},
			};
		} else if (sortBy === 'name') {
			orderBy = [{ forename: sortOrder }, { surname: sortOrder }];
		} else if (sortBy === 'nationality') {
			orderBy = { nationality: sortOrder };
		} else if (sortBy === 'age') {
			orderBy = { dob: sortOrder === 'asc' ? 'desc' : 'asc' }; // Reverse for age
		} else if (sortBy === 'wins') {
			orderBy = {
				racingStats: {
					wins: sortOrder,
				},
			};
		}

		// Separate queries based on whether we need results with race data
		const drivers = (
			minYear || maxYear
				? await prisma.driver.findMany({
						include: {
							dnaProfile: true,
							racingStats: true,
							results: {
								// @ts-expect-error - Prisma type inference issue with nested includes
								include: {
									race: true,
								},
							},
						},
						where: {
							dnaProfile: Object.keys(dnaProfileWhere).length > 0 ? dnaProfileWhere : { isNot: null },
						},
						orderBy,
				  })
				: await prisma.driver.findMany({
						include: {
							dnaProfile: true,
							racingStats: true,
						},
						where: {
							dnaProfile: Object.keys(dnaProfileWhere).length > 0 ? dnaProfileWhere : { isNot: null },
						},
						orderBy,
				  })
		) as DriverWithIncludes[];

		// Filter by year range if specified
		let filteredDrivers = drivers;
		if (minYear || maxYear) {
			const minYearNum = minYear ? parseInt(minYear) : null;
			const maxYearNum = maxYear ? parseInt(maxYear) : null;

			filteredDrivers = drivers.filter((driver) => {
				if (!driver.results || driver.results.length === 0) return false;

				const driverYears = driver.results.map((result) => result.race?.year).filter(Boolean);
				const minDriverYear = Math.min(...(driverYears as number[]));
				const maxDriverYear = Math.max(...(driverYears as number[]));

				let matchesYearRange = true;
				if (minYearNum && maxDriverYear < minYearNum) matchesYearRange = false;
				if (maxYearNum && minDriverYear > maxYearNum) matchesYearRange = false;

				return matchesYearRange;
			});
		}

		// Filter out drivers without DNA profiles and format the data
		const driversWithDNA = filteredDrivers
			.filter((driver) => driver.dnaProfile)
			.map((driver) => {
				// Calculate age if DOB is available
				const age = driver.dob ? Math.floor((Date.now() - driver.dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

				return {
					id: driver.driverId,
					name: `${driver.forename} ${driver.surname}`,
					nationality: driver.nationality,
					age,
					dob: driver.dob,
					dnaProfile: {
						...driver.dnaProfile,
						wins: driver.racingStats?.wins || 0,
						secondPlaces: driver.racingStats?.secondPlaces || 0,
						thirdPlaces: driver.racingStats?.thirdPlaces || 0,
						podiums: driver.racingStats?.podiums || 0,
						avgFinishPosition: driver.racingStats?.avgFinishPosition,
						bestChampionshipFinish: driver.racingStats?.bestChampionshipFinish,
						avgChampionshipFinish: driver.racingStats?.avgChampionshipFinish,
					},
				};
			});

		// Apply custom sorting with nulls last
		driversWithDNA.sort((a, b) => {
			let aValue: any;
			let bValue: any;

			// Get the values to compare based on sortBy
			if (['aggressionScore', 'consistencyScore', 'racecraftScore', 'pressurePerformanceScore', 'raceStartScore', 'clutchFactorScore', 'racesAnalyzed'].includes(sortBy)) {
				aValue = a.dnaProfile?.[sortBy as keyof typeof a.dnaProfile];
				bValue = b.dnaProfile?.[sortBy as keyof typeof b.dnaProfile];
			} else if (sortBy === 'name') {
				aValue = a.name;
				bValue = b.name;
			} else if (sortBy === 'nationality') {
				aValue = a.nationality;
				bValue = b.nationality;
			} else if (sortBy === 'age') {
				aValue = a.age;
				bValue = b.age;
			} else if (sortBy === 'wins') {
				aValue = a.dnaProfile?.wins || 0;
				bValue = b.dnaProfile?.wins || 0;
			}

			// Handle null/undefined values - always put them at the end
			if (aValue == null && bValue == null) return 0;
			if (aValue == null) return 1; // a goes to end
			if (bValue == null) return -1; // b goes to end

			// Normal comparison
			if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
			if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
			return 0;
		});

		return NextResponse.json(driversWithDNA);
	} catch (error) {
		console.error('Error fetching drivers:', error);
		return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
	}
}
