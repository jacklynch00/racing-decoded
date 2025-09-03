import { NextResponse } from 'next/server';
import { getAllInsights, insightCategories, getInsightsByCategory } from '@/lib/insights-config';

export async function GET() {
	try {
		const allInsights = getAllInsights();

		// Organize insights by category for better frontend consumption
		const insightsByCategory = Object.keys(insightCategories).reduce((acc, categoryKey) => {
			const category = categoryKey as keyof typeof insightCategories;
			acc[category] = {
				...insightCategories[category],
				insights: getInsightsByCategory(category),
			};
			return acc;
		}, {} as Record<keyof typeof insightCategories, unknown>);

		return NextResponse.json({
			categories: insightsByCategory,
			allInsights: allInsights,
			totalCount: allInsights.length,
		});
	} catch (error) {
		console.error('Error fetching insights list:', error);
		return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
	}
}