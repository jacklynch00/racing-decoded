import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRankingConfig, type RankingConfig } from '@/lib/rankings-config';
import type { Driver, DriverDnaProfile, DriverRacingStats, Result, Race } from '@prisma/client';

type DriverWithIncludes = Driver & {
	dnaProfile: DriverDnaProfile | null;
	racingStats: DriverRacingStats | null;
	results?: (Result & { race: Race })[];
};

// Helper function to handle circuit-specific rankings
async function handleCircuitRanking(rankingConfig: RankingConfig) {
	const circuitRef = rankingConfig.filters?.circuitRef;

	// Query for circuit-specific wins
	const circuitWins = await prisma.result.groupBy({
		by: ['driverId'],
		where: {
			position: 1, // Only wins (1st place)
			race: {
				circuit: {
					circuitRef: circuitRef as string,
				},
			},
		},
		_count: {
			resultId: true,
		},
		orderBy: {
			_count: {
				resultId: 'desc',
			},
		},
		take: 20,
	});

	// Get driver details for the top drivers
	const driverIds = circuitWins.map((w) => w.driverId);
	const drivers = await prisma.driver.findMany({
		where: {
			driverId: {
				in: driverIds,
			},
		},
		include: {
			dnaProfile: true,
			racingStats: true,
		},
	});

	// Create a map for quick lookup
	const driversMap = new Map(drivers.map((d) => [d.driverId, d]));
	const winsMap = new Map(circuitWins.map((w) => [w.driverId, w._count?.resultId || 0]));

	// Build the ranking response
	const rankedDrivers = circuitWins
		.map((win, index) => {
			const driver = driversMap.get(win.driverId);
			if (!driver) return null;

			const age = driver.dob ? Math.floor((Date.now() - driver.dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
			const wins = winsMap.get(driver.driverId) || 0;

			return {
				id: driver.driverId,
				name: `${driver.forename} ${driver.surname}`,
				nationality: driver.nationality,
				age,
				dob: driver.dob,
				position: index + 1,
				rankingValue: wins,
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
		})
		.filter(Boolean);

	return NextResponse.json({
		ranking: rankingConfig,
		drivers: rankedDrivers,
		count: rankedDrivers.length,
	});
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
	try {
		const { slug } = await params;
		const rankingConfig = getRankingConfig(slug);

		if (!rankingConfig) {
			return NextResponse.json({ error: 'Ranking not found' }, { status: 404 });
		}

		// Handle circuit-specific rankings with custom queries
		if (rankingConfig.customQuery && rankingConfig.category === 'circuit' && rankingConfig.filters?.circuitRef) {
			return await handleCircuitRanking(rankingConfig);
		}

		// We'll sort in JavaScript after filtering to handle nullable fields properly

		// Query drivers with appropriate includes - get all drivers and sort in JS to handle nullable fields
		const drivers = (await prisma.driver.findMany({
			include: {
				dnaProfile: true,
				racingStats: true,
			},
			where: {
				// Only include drivers with DNA profiles for DNA rankings
				...(rankingConfig.category === 'dna' && {
					dnaProfile: { isNot: null },
				}),
				// Only include drivers with racing stats for career rankings
				...(rankingConfig.category === 'career' && {
					racingStats: { isNot: null },
				}),
			},
			// Remove orderBy from Prisma query - we'll sort in JS after filtering
		})) as DriverWithIncludes[];

		// Filter out drivers without required data and format
		const driversWithData = drivers
			.filter((driver) => {
				// For DNA rankings, require DNA profile and the specific score
				if (rankingConfig.category === 'dna') {
					if (!driver.dnaProfile) return false;
					const score = driver.dnaProfile[rankingConfig.sortField as keyof DriverDnaProfile];
					return score !== null && score !== undefined;
				}
				// For career rankings, require racing stats and the specific stat
				if (rankingConfig.category === 'career') {
					if (!driver.racingStats) return false;
					const stat = driver.racingStats[rankingConfig.sortField as keyof DriverRacingStats];
					return stat !== null && stat !== undefined;
				}
				return true;
			})
			.map((driver, index) => {
				// Calculate age if DOB is available
				const age = driver.dob ? Math.floor((Date.now() - driver.dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

				// Get the ranking value
				let rankingValue: number | null = null;
				if (rankingConfig.category === 'dna' && driver.dnaProfile) {
					rankingValue = driver.dnaProfile[rankingConfig.sortField as keyof DriverDnaProfile] as number;
				} else if (rankingConfig.category === 'career' && driver.racingStats) {
					rankingValue = driver.racingStats[rankingConfig.sortField as keyof DriverRacingStats] as number;
				}

				return {
					id: driver.driverId,
					name: `${driver.forename} ${driver.surname}`,
					nationality: driver.nationality,
					age,
					dob: driver.dob,
					position: index + 1,
					rankingValue,
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

		// Apply custom sorting with nulls last (similar to main drivers API)
		driversWithData.sort((a, b) => {
			const aValue = a.rankingValue;
			const bValue = b.rankingValue;

			// Handle null/undefined values - always put them at the end
			if (aValue == null && bValue == null) return 0;
			if (aValue == null) return 1; // a goes to end
			if (bValue == null) return -1; // b goes to end

			// Normal comparison
			if (aValue < bValue) return rankingConfig.sortOrder === 'asc' ? -1 : 1;
			if (aValue > bValue) return rankingConfig.sortOrder === 'asc' ? 1 : -1;
			return 0;
		});

		// Take only top 20 and update positions after sorting
		const top20Drivers = driversWithData.slice(0, 20);
		top20Drivers.forEach((driver, index) => {
			driver.position = index + 1;
		});

		return NextResponse.json({
			ranking: rankingConfig,
			drivers: top20Drivers,
			count: top20Drivers.length,
		});
	} catch (error) {
		console.error('Error fetching ranking data:', error);
		return NextResponse.json({ error: 'Failed to fetch ranking data' }, { status: 500 });
	}
}
