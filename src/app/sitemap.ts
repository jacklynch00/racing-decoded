import { RankingConfig } from '@/lib/rankings-config';
import { Driver } from '@prisma/client';
import { MetadataRoute } from 'next';

async function getAllDriverIds(): Promise<number[]> {
	try {
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
		const response = await fetch(`${baseUrl}/api/drivers`);
		if (!response.ok) return [];

		const drivers = await response.json();
		return drivers.map((driver: Driver) => driver.id);
	} catch {
		return [];
	}
}

async function getAllRankingSlugs(): Promise<string[]> {
	try {
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
		const response = await fetch(`${baseUrl}/api/rankings`);
		if (!response.ok) return [];

		const data = await response.json();
		return data.allRankings?.map((ranking: RankingConfig) => ranking.slug) || [];
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

	return [...staticPages, ...driverPages, ...rankingPages];
}
