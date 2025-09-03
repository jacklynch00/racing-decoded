import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
	try {
		// Get all circuits with race counts to see which are most active
		const circuits = await prisma.circuit.findMany({
			include: {
				races: {
					select: {
						id: true,
						year: true,
						name: true
					}
				}
			},
			orderBy: {
				name: 'asc'
			}
		});

		// Process circuits to get useful stats
		const circuitsWithStats = circuits.map(circuit => ({
			id: circuit.circuitId,
			name: circuit.name,
			location: circuit.location,
			country: circuit.country,
			circuitRef: circuit.circuitRef,
			totalRaces: circuit.races.length,
			firstRace: circuit.races.length > 0 ? Math.min(...circuit.races.map(r => r.year)) : null,
			lastRace: circuit.races.length > 0 ? Math.max(...circuit.races.map(r => r.year)) : null,
			recentRaces: circuit.races.filter(r => r.year >= 2020).length
		})).filter(circuit => circuit.totalRaces > 0); // Only include circuits that have hosted races

		return NextResponse.json({
			circuits: circuitsWithStats,
			totalCircuits: circuitsWithStats.length
		});
	} catch (error) {
		console.error('Error fetching circuits:', error);
		return NextResponse.json({ error: 'Failed to fetch circuits' }, { status: 500 });
	}
}