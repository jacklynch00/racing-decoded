import { getAllRankings } from '@/lib/rankings-config';
import { getAllInsights } from '@/lib/insights-config';
import { prisma } from '@/lib/db';
import { MetadataRoute } from 'next';

async function getAllDriverIds(): Promise<number[]> {
	try {
		const drivers = await prisma.driver.findMany({
			where: {
				dnaProfile: {
					isNot: null,
				},
			},
			select: {
				id: true,
			},
		});
		return drivers.map((driver) => driver.id);
	} catch {
		return [];
	}
}

async function getAllRankingSlugs(): Promise<string[]> {
	try {
		const allRankings = getAllRankings();
		return allRankings.map((ranking) => ranking.slug);
	} catch {
		return [];
	}
}

async function getAllInsightSlugs(): Promise<string[]> {
	try {
		const allInsights = getAllInsights();
		return allInsights.map((insight) => insight.slug);
	} catch {
		return [];
	}
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.racingdecoded.com';
	const currentDate = new Date();

	// Get dynamic data
	const driverIds = await getAllDriverIds();
	const rankingSlugs = await getAllRankingSlugs();
	const insightSlugs = await getAllInsightSlugs();

	// Static pages
	const staticPages: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: currentDate,
			changeFrequency: 'daily',
			priority: 1.0,
		},
		{
			url: `${baseUrl}/rankings`,
			lastModified: currentDate,
			changeFrequency: 'weekly',
			priority: 0.9,
		},
		{
			url: `${baseUrl}/insights`,
			lastModified: currentDate,
			changeFrequency: 'weekly',
			priority: 0.9,
		},
		{
			url: `${baseUrl}/rankings/circuits`,
			lastModified: currentDate,
			changeFrequency: 'weekly',
			priority: 0.8,
		},
		{
			url: `${baseUrl}/track-animation`,
			lastModified: currentDate,
			changeFrequency: 'monthly',
			priority: 0.7,
		},
	];

	// Driver pages
	const driverPages: MetadataRoute.Sitemap = driverIds.map((id) => ({
		url: `${baseUrl}/driver/${id}`,
		lastModified: currentDate,
		changeFrequency: 'weekly' as const,
		priority: 0.8,
	}));

	// Ranking pages
	const rankingPages: MetadataRoute.Sitemap = rankingSlugs.map((slug) => ({
		url: `${baseUrl}/rankings/${slug}`,
		lastModified: currentDate,
		changeFrequency: 'weekly' as const,
		priority: 0.7,
	}));

	// Insight pages
	const insightPages: MetadataRoute.Sitemap = insightSlugs.map((slug) => ({
		url: `${baseUrl}/insights/${slug}`,
		lastModified: currentDate,
		changeFrequency: 'weekly' as const,
		priority: 0.8,
	}));

	return [...staticPages, ...driverPages, ...rankingPages, ...insightPages];
}
