import { NextRequest, NextResponse } from 'next/server';
import { getInsightConfig } from '@/lib/insights-config';
import { prisma } from '@/lib/db';

interface RouteParams {
	slug: string;
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<RouteParams> }
) {
	try {
		const { slug } = await params;
		const config = getInsightConfig(slug);

		if (!config) {
			return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
		}

		// For now, return the config with placeholder data
		// This will be expanded to include actual data analysis
		const insightData = await getInsightData(slug);

		return NextResponse.json({
			config,
			data: insightData,
		});
	} catch (error) {
		console.error('Error fetching insight:', error);
		return NextResponse.json({ error: 'Failed to fetch insight data' }, { status: 500 });
	}
}

async function getInsightData(slug: string) {
	// This function will contain the actual data analysis logic
	// For now, we'll return placeholder structures based on the insight type
	
	switch (slug) {
		case 'aggression-paradox':
			return await getAggressionParadoxData();
		case 'consistency-trap':
			return await getConsistencyTrapData();
		case 'era-evolution':
			return await getEraEvolutionData();
		case 'circuit-dna':
			return await getCircuitDnaData();
		default:
			return { placeholder: true };
	}
}

async function getAggressionParadoxData() {
	try {
		// Get drivers with DNA profiles and their win counts
		const driversData = await prisma.driver.findMany({
			where: {
				dnaProfile: {
					isNot: null,
				},
			},
			select: {
				driverId: true,
				forename: true,
				surname: true,
				dnaProfile: {
					select: {
						aggressionScore: true,
						racesAnalyzed: true,
						careerSpan: true,
					},
				},
				racingStats: {
					select: {
						wins: true,
					},
				},
			},
		});

		// Filter out drivers without complete data
		const validDrivers = driversData.filter(
			(driver) => driver.dnaProfile && driver.dnaProfile.aggressionScore !== null
		);

		// Calculate statistics
		const scatterData = validDrivers.map((driver) => ({
			driverId: driver.driverId,
			driverName: `${driver.forename} ${driver.surname}`,
			aggressionScore: driver.dnaProfile!.aggressionScore,
			wins: driver.racingStats?.wins || 0,
			careerSpan: driver.dnaProfile!.careerSpan || '',
		}));

		// Group by win ranges for additional analysis
		const winRanges = [
			{ min: 0, max: 0, label: 'No Wins' },
			{ min: 1, max: 5, label: '1-5 Wins' },
			{ min: 6, max: 15, label: '6-15 Wins' },
			{ min: 16, max: 30, label: '16-30 Wins' },
			{ min: 31, max: 100, label: '31+ Wins' },
		];

		const aggByWinRange = winRanges.map((range) => {
			const driversInRange = scatterData.filter(
				(d) => d.wins >= range.min && d.wins <= range.max
			);
			const avgAggression = driversInRange.length > 0
				? driversInRange.reduce((sum, d) => sum + (d.aggressionScore || 0), 0) / driversInRange.length
				: 0;

			return {
				...range,
				count: driversInRange.length,
				avgAggression: Number(avgAggression.toFixed(1)),
			};
		});

		// Calculate era-based averages for line chart
		const eraAverages = calculateEraAverages(scatterData);

		return {
			scatterData: scatterData.sort((a, b) => (b.wins || 0) - (a.wins || 0)),
			aggByWinRange,
			eraAverages,
			totalDrivers: validDrivers.length,
			insights: {
				highWinLowAgg: scatterData.filter((d) => (d.wins || 0) > 15 && (d.aggressionScore || 0) < 55),
				lowWinHighAgg: scatterData.filter((d) => (d.wins || 0) < 5 && (d.aggressionScore || 0) > 70),
			},
		};
	} catch (error) {
		console.error('Error fetching aggression paradox data:', error);
		return { error: 'Failed to fetch data' };
	}
}

async function getConsistencyTrapData() {
	try {
		// Similar structure for consistency analysis
		const driversData = await prisma.driver.findMany({
			where: {
				dnaProfile: {
					isNot: null,
				},
			},
			select: {
				driverId: true,
				forename: true,
				surname: true,
				dnaProfile: {
					select: {
						consistencyScore: true,
						racesAnalyzed: true,
					},
				},
				racingStats: {
					select: {
						wins: true,
					},
				},
			},
		});

		const validDrivers = driversData.filter(
			(driver) => driver.dnaProfile && driver.dnaProfile.consistencyScore !== null
		);

		const scatterData = validDrivers.map((driver) => ({
			driverId: driver.driverId,
			driverName: `${driver.forename} ${driver.surname}`,
			consistencyScore: driver.dnaProfile!.consistencyScore,
			wins: driver.racingStats?.wins || 0,
			winRate: driver.dnaProfile!.racesAnalyzed 
				? ((driver.racingStats?.wins || 0) / driver.dnaProfile!.racesAnalyzed) * 100 
				: 0,
		}));

		return {
			scatterData: scatterData.sort((a, b) => (b.consistencyScore || 0) - (a.consistencyScore || 0)),
			totalDrivers: validDrivers.length,
		};
	} catch (error) {
		console.error('Error fetching consistency trap data:', error);
		return { error: 'Failed to fetch data' };
	}
}

async function getEraEvolutionData() {
	try {
		// Get all drivers with DNA profiles for era analysis
		const driversData = await prisma.driver.findMany({
			where: {
				dnaProfile: {
					isNot: null,
				},
			},
			select: {
				driverId: true,
				forename: true,
				surname: true,
				dnaProfile: {
					select: {
						aggressionScore: true,
						consistencyScore: true,
						racecraftScore: true,
						pressurePerformanceScore: true,
						raceStartScore: true,
						careerSpan: true,
					},
				},
			},
		});

		// Calculate multi-trait averages by era
		const eraTraitAverages = calculateMultiTraitEraAverages(driversData);
		
		// Create heatmap data
		const heatmapData = createTraitEraHeatmap(eraTraitAverages as Array<{ era: string; [key: string]: number | null | string }>);

		return {
			eraTraitAverages,
			heatmapData,
			totalDrivers: driversData.length,
		};
	} catch (error) {
		console.error('Error fetching era evolution data:', error);
		return { error: 'Failed to fetch data' };
	}
}

async function getCircuitDnaData() {
	try {
		// For now, create example data showing theoretical circuit preferences
		// In a full implementation, this would analyze actual race results by circuit
		
		const circuitTraitCorrelations = [
			// Monaco - Precision circuits favor racecraft
			{ row: 'Monaco', column: 'Aggression', value: 45, displayValue: '45%' },
			{ row: 'Monaco', column: 'Consistency', value: 65, displayValue: '65%' },
			{ row: 'Monaco', column: 'Racecraft', value: 85, displayValue: '85%' },
			{ row: 'Monaco', column: 'Pressure', value: 75, displayValue: '75%' },
			{ row: 'Monaco', column: 'Race Start', value: 90, displayValue: '90%' },

			// Monza - Power tracks favor aggression
			{ row: 'Monza', column: 'Aggression', value: 75, displayValue: '75%' },
			{ row: 'Monza', column: 'Consistency', value: 55, displayValue: '55%' },
			{ row: 'Monza', column: 'Racecraft', value: 60, displayValue: '60%' },
			{ row: 'Monza', column: 'Pressure', value: 50, displayValue: '50%' },
			{ row: 'Monza', column: 'Race Start', value: 70, displayValue: '70%' },

			// Silverstone - Balanced circuit
			{ row: 'Silverstone', column: 'Aggression', value: 60, displayValue: '60%' },
			{ row: 'Silverstone', column: 'Consistency', value: 70, displayValue: '70%' },
			{ row: 'Silverstone', column: 'Racecraft', value: 65, displayValue: '65%' },
			{ row: 'Silverstone', column: 'Pressure', value: 60, displayValue: '60%' },
			{ row: 'Silverstone', column: 'Race Start', value: 55, displayValue: '55%' },

			// Spa - High-speed precision
			{ row: 'Spa', column: 'Aggression', value: 70, displayValue: '70%' },
			{ row: 'Spa', column: 'Consistency', value: 50, displayValue: '50%' },
			{ row: 'Spa', column: 'Racecraft', value: 80, displayValue: '80%' },
			{ row: 'Spa', column: 'Pressure', value: 65, displayValue: '65%' },
			{ row: 'Spa', column: 'Race Start', value: 60, displayValue: '60%' },

			// Interlagos - Wet weather specialists
			{ row: 'Interlagos', column: 'Aggression', value: 65, displayValue: '65%' },
			{ row: 'Interlagos', column: 'Consistency', value: 45, displayValue: '45%' },
			{ row: 'Interlagos', column: 'Racecraft', value: 90, displayValue: '90%' },
			{ row: 'Interlagos', column: 'Pressure', value: 85, displayValue: '85%' },
			{ row: 'Interlagos', column: 'Race Start', value: 50, displayValue: '50%' },
		];

		// Example scatter data for Monaco racecraft correlation
		const monacoRacecraftData = [
			{ driverId: 1, driverName: 'Ayrton Senna', racecraftScore: 94.2, monacoSuccessRate: 85 },
			{ driverId: 44, driverName: 'Lewis Hamilton', racecraftScore: 91.2, monacoSuccessRate: 70 },
			{ driverId: 102, driverName: 'Alain Prost', racecraftScore: 89.5, monacoSuccessRate: 65 },
			{ driverId: 30, driverName: 'Michael Schumacher', racecraftScore: 87.8, monacoSuccessRate: 60 },
			{ driverId: 20, driverName: 'Sebastian Vettel', racecraftScore: 85.1, monacoSuccessRate: 55 },
			// Add more example data
			...Array.from({ length: 20 }, (_, i) => ({
				driverId: 100 + i,
				driverName: `Driver ${i + 1}`,
				racecraftScore: 50 + Math.random() * 40,
				monacoSuccessRate: 20 + Math.random() * 60,
			}))
		];

		return {
			circuitTraitCorrelations,
			monacoRacecraftData,
			note: 'Circuit DNA data based on theoretical correlations. Full implementation would require race results analysis by circuit.',
		};
	} catch (error) {
		console.error('Error generating circuit DNA data:', error);
		return { error: 'Failed to generate circuit data' };
	}
}

function calculateEraAverages(scatterData: Array<{ careerSpan?: string; aggressionScore?: number | null; [key: string]: unknown }>) {
	// Group drivers by era based on their career span
	const eraGroups: Record<string, number[]> = {
		'1950s': [],
		'1960s': [],
		'1970s': [],
		'1980s': [],
		'1990s': [],
		'2000s': [],
		'2010s': [],
		'2020s': [],
	};

	scatterData.forEach((driver) => {
		if (!driver.careerSpan || !driver.aggressionScore) return;
		
		// Extract years from career span (e.g., "2007-2024")
		const years = driver.careerSpan.match(/\d{4}/g);
		if (!years || years.length === 0) return;
		
		const startYear = parseInt(years[0]);
		const endYear = years.length > 1 ? parseInt(years[1]) : startYear;
		const midYear = Math.floor((startYear + endYear) / 2);
		
		// Assign to primary era based on mid-career year
		if (midYear < 1960) eraGroups['1950s'].push(driver.aggressionScore);
		else if (midYear < 1970) eraGroups['1960s'].push(driver.aggressionScore);
		else if (midYear < 1980) eraGroups['1970s'].push(driver.aggressionScore);
		else if (midYear < 1990) eraGroups['1980s'].push(driver.aggressionScore);
		else if (midYear < 2000) eraGroups['1990s'].push(driver.aggressionScore);
		else if (midYear < 2010) eraGroups['2000s'].push(driver.aggressionScore);
		else if (midYear < 2020) eraGroups['2010s'].push(driver.aggressionScore);
		else eraGroups['2020s'].push(driver.aggressionScore);
	});

	// Calculate averages for each era
	return Object.entries(eraGroups)
		.filter(([, scores]) => scores.length > 0)
		.map(([era, scores]) => ({
			era,
			avgAggression: Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)),
			driverCount: scores.length,
		}))
		.sort((a, b) => (a.era as string).localeCompare(b.era as string));
}

function calculateMultiTraitEraAverages(driversData: Array<{ dnaProfile?: { careerSpan?: string; [key: string]: unknown } | null; [key: string]: unknown }>) {
	// Group drivers by era based on their career span
	const eraGroups: Record<string, Array<{ [key: string]: unknown }>> = {
		'1950s': [],
		'1960s': [],
		'1970s': [],
		'1980s': [],
		'1990s': [],
		'2000s': [],
		'2010s': [],
		'2020s': [],
	};

	driversData.forEach((driver) => {
		if (!driver.dnaProfile?.careerSpan) return;
		
		// Extract years from career span (e.g., "2007-2024")
		const years = driver.dnaProfile.careerSpan.match(/\d{4}/g);
		if (!years || years.length === 0) return;
		
		const startYear = parseInt(years[0]);
		const endYear = years.length > 1 ? parseInt(years[1]) : startYear;
		const midYear = Math.floor((startYear + endYear) / 2);
		
		// Assign to primary era based on mid-career year
		if (midYear < 1960) eraGroups['1950s'].push(driver.dnaProfile);
		else if (midYear < 1970) eraGroups['1960s'].push(driver.dnaProfile);
		else if (midYear < 1980) eraGroups['1970s'].push(driver.dnaProfile);
		else if (midYear < 1990) eraGroups['1980s'].push(driver.dnaProfile);
		else if (midYear < 2000) eraGroups['1990s'].push(driver.dnaProfile);
		else if (midYear < 2010) eraGroups['2000s'].push(driver.dnaProfile);
		else if (midYear < 2020) eraGroups['2010s'].push(driver.dnaProfile);
		else eraGroups['2020s'].push(driver.dnaProfile);
	});

	// Calculate averages for each trait by era
	const traits = ['aggressionScore', 'consistencyScore', 'racecraftScore', 'pressurePerformanceScore', 'raceStartScore'];
	
	return Object.entries(eraGroups)
		.filter(([, profiles]) => profiles.length > 0)
		.map(([era, profiles]) => {
			const result: Record<string, number | null | string> = { era, driverCount: profiles.length };
			
			traits.forEach(trait => {
				const values = profiles
					.map(p => typeof p[trait] === 'number' ? p[trait] as number : null)
					.filter((v): v is number => v !== null);
				
				if (values.length > 0) {
					result[trait] = Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1));
				} else {
					result[trait] = null;
				}
			});
			
			return result;
		})
		.sort((a, b) => (a.era as string).localeCompare(b.era as string));
}

function createTraitEraHeatmap(eraTraitAverages: Array<{ era: string; [key: string]: number | null | string }>) {
	const traits = [
		{ key: 'aggressionScore', name: 'Aggression' },
		{ key: 'consistencyScore', name: 'Consistency' },
		{ key: 'racecraftScore', name: 'Racecraft' },
		{ key: 'pressurePerformanceScore', name: 'Pressure' },
		{ key: 'raceStartScore', name: 'Race Start' }
	];

	const heatmapData: Array<{ row: string; column: string; value: number; displayValue: string }> = [];
	
	eraTraitAverages.forEach(era => {
		traits.forEach(trait => {
			const value = era[trait.key];
			if (typeof value === 'number' && value !== null) {
				heatmapData.push({
					row: era.era as string,
					column: trait.name,
					value: value,
					displayValue: value.toFixed(1)
				});
			}
		});
	});

	return heatmapData;
}