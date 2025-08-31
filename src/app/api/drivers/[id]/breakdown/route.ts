import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;
		const driverId = parseInt(id);

		if (isNaN(driverId)) {
			return NextResponse.json({ error: 'Invalid driver ID' }, { status: 400 });
		}

		// Get DNA breakdown data for the driver
		const breakdown = await prisma.driverDnaBreakdown.findMany({
			where: {
				driverId: driverId,
			},
			select: {
				traitName: true,
				rawValue: true,
				normalizedScore: true,
				contributingStats: true,
				calculationNotes: true,
			},
		});

		if (breakdown.length === 0) {
			return NextResponse.json({ error: 'No DNA breakdown found for this driver' }, { status: 404 });
		}

		// Transform the data into a more usable format
		const transformedBreakdown = breakdown.reduce((acc, item) => {
			let contributingStats = {};
			
			// Handle contributingStats - it might be a string or already parsed object
			if (typeof item.contributingStats === 'string') {
				try {
					contributingStats = JSON.parse(item.contributingStats);
				} catch (e) {
					console.error('Error parsing contributing stats:', e);
					contributingStats = {};
				}
			} else if (item.contributingStats && typeof item.contributingStats === 'object') {
				contributingStats = item.contributingStats;
			}

			acc[item.traitName] = {
				rawValue: item.rawValue,
				normalizedScore: item.normalizedScore,
				contributingStats,
				calculationNotes: item.calculationNotes,
			};
			return acc;
		}, {} as Record<string, unknown>);

		return NextResponse.json(transformedBreakdown);
	} catch (error) {
		console.error('Error fetching driver DNA breakdown:', error);
		return NextResponse.json({ error: 'Failed to fetch driver DNA breakdown' }, { status: 500 });
	}
}
