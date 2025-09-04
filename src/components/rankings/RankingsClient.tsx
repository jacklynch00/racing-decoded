'use client';

import { useEffect, useState } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { RankingConfig } from '@/lib/rankings-config';

interface RankingCategory {
	name: string;
	description: string;
	icon: string;
	rankings: RankingConfig[];
}

interface RankingsData {
	categories: Record<string, RankingCategory>;
	allRankings: RankingConfig[];
	totalCount: number;
}

function RankingCard({ ranking }: { ranking: RankingConfig }) {
	return (
		<Link href={`/rankings/${ranking.slug}`}>
			<Card className='cursor-pointer group hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-primary h-full'>
				<CardHeader className='pb-3'>
					<div className='flex items-start justify-between'>
						<div className='flex-1 min-w-0'>
							<CardTitle className='text-lg group-hover:text-primary transition-colors leading-tight'>{ranking.title}</CardTitle>
							<CardDescription
								className='mt-2 text-sm overflow-hidden'
								style={{
									display: '-webkit-box',
									WebkitLineClamp: 2,
									WebkitBoxOrient: 'vertical',
									lineHeight: '1.3em',
									maxHeight: '2.6em',
								}}>
								{ranking.description}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
			</Card>
		</Link>
	);
}

function CategorySection({ categoryData }: { categoryData: RankingCategory }) {
	return (
		<div className='space-y-4'>
			<div className='flex items-center gap-3'>
				<div>
					<h2 className='text-2xl font-bold'>{categoryData.name}</h2>
					<p className='text-muted-foreground'>{categoryData.description}</p>
				</div>
			</div>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6'>
				{categoryData.rankings.map((ranking) => (
					<RankingCard key={ranking.slug} ranking={ranking} />
				))}
			</div>
		</div>
	);
}

export function RankingsClient() {
	const [data, setData] = useState<RankingsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchRankings = async () => {
			try {
				const response = await fetch('/api/rankings');
				if (!response.ok) {
					throw new Error('Failed to fetch rankings');
				}
				const rankingsData = await response.json();
				setData(rankingsData);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred');
			} finally {
				setLoading(false);
			}
		};

		fetchRankings();
	}, []);

	if (loading) {
		return (
			<div className='space-y-6'>
				<div>
					<h1 className='text-3xl font-bold mb-2'>F1 Driver Rankings</h1>
					<p className='text-muted-foreground'>Loading rankings...</p>
				</div>
				<div className='flex justify-center items-center min-h-[400px]'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='space-y-6'>
				<div>
					<h1 className='text-3xl font-bold mb-2'>F1 Driver Rankings</h1>
					<p className='text-muted-foreground'>Discover the top performers in Formula 1</p>
				</div>
				<div className='flex justify-center items-center min-h-[400px]'>
					<div className='text-center space-y-2'>
						<p className='text-red-500'>Error loading rankings: {error}</p>
						<Button variant='outline' onClick={() => window.location.reload()}>
							Try Again
						</Button>
					</div>
				</div>
			</div>
		);
	}

	if (!data) {
		return null;
	}

	return (
		<div className='space-y-8'>
			{/* Header */}
			<div className='text-center space-y-4'>
				<h1 className='text-4xl font-bold'>F1 Driver Rankings</h1>
				<p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
					Discover the top performers in Formula 1 across different categories. Our data-driven analysis ranks drivers by DNA traits, career achievements, and more.
				</p>
				<div className='flex justify-center'>
					<Badge variant='outline' className='text-sm'>
						{data.totalCount} Total Rankings Available
					</Badge>
				</div>
			</div>

			{/* Rankings Categories */}
			<div className='space-y-12'>
				{Object.entries(data.categories).map(([categoryKey, categoryData]) => (
					<CategorySection key={categoryKey} categoryData={categoryData} />
				))}
			</div>

			{/* Footer Note */}
			<div className='text-center pt-8 border-t'>
				<p className='text-sm text-muted-foreground'>
					Rankings are updated regularly based on our comprehensive Formula 1 database. Each ranking shows the top 20 drivers with detailed analysis and insights.
				</p>
			</div>
		</div>
	);
}
