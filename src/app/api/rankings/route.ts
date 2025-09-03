import { NextResponse } from 'next/server';
import { getAllRankings, rankingCategories, getRankingsByCategory } from '@/lib/rankings-config';

export async function GET() {
	try {
		const allRankings = getAllRankings();

		// Organize rankings by category for better frontend consumption
		const rankingsByCategory = Object.keys(rankingCategories).reduce((acc, categoryKey) => {
			const category = categoryKey as keyof typeof rankingCategories;
			acc[category] = {
				...rankingCategories[category],
				rankings: getRankingsByCategory(category),
			};
			return acc;
		}, {} as Record<keyof typeof rankingCategories, unknown>);

		return NextResponse.json({
			categories: rankingsByCategory,
			allRankings: allRankings,
			totalCount: allRankings.length,
		});
	} catch (error) {
		console.error('Error fetching rankings list:', error);
		return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
	}
}
