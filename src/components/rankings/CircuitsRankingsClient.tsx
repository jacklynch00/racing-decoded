'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getRankingsByCategory } from '@/lib/rankings-config';
import type { RankingConfig } from '@/lib/rankings-config';

interface CircuitInfo {
	id: number;
	name: string;
	location: string;
	country: string;
	circuitRef: string;
	totalRaces: number;
	firstRace: number;
	lastRace: number;
	recentRaces: number;
}

interface CircuitsData {
	circuits: CircuitInfo[];
	totalCircuits: number;
}

function CircuitRankingCard({ ranking, circuitInfo }: { ranking: RankingConfig; circuitInfo?: CircuitInfo }) {
	return (
		<Link href={`/rankings/${ranking.slug}`}>
			<Card className='cursor-pointer group'>
				<CardHeader>
					<div className='flex items-start justify-between'>
						<div className='flex items-start gap-3'>
							<span className='text-2xl' role='img' aria-label={ranking.title}>
								{ranking.icon}
							</span>
							<div>
								<CardTitle className='text-lg'>{ranking.title}</CardTitle>
								<CardDescription className='mt-2 text-sm'>{ranking.description}</CardDescription>
								{circuitInfo && (
									<div className='mt-3 space-y-1'>
										<p className='text-xs text-muted-foreground'>
											📍 {circuitInfo.location}, {circuitInfo.country}
										</p>
										<p className='text-xs text-muted-foreground'>
											🏁 {circuitInfo.totalRaces} total races ({circuitInfo.firstRace}-{circuitInfo.lastRace})
										</p>
									</div>
								)}
							</div>
						</div>
						<ArrowRight className='h-4 w-4 text-muted-foreground' />
					</div>
				</CardHeader>
				<CardContent>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<Badge variant='secondary'>
								Circuit Masters
							</Badge>
							<span className='text-xs text-muted-foreground'>Top 20 drivers</span>
						</div>
						{circuitInfo && circuitInfo.recentRaces > 0 && (
							<Badge variant='outline'>
								{circuitInfo.recentRaces} recent races
							</Badge>
						)}
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

export function CircuitsRankingsClient() {
	const [circuitsData, setCircuitsData] = useState<CircuitsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Get circuit rankings from config
	const circuitRankings = getRankingsByCategory('circuit');

	// Create a mapping of circuit refs to ranking configs
	const circuitRefMap = new Map<string, RankingConfig>();
	circuitRankings.forEach((ranking) => {
		if (ranking.filters?.circuitRef && typeof ranking.filters.circuitRef === 'string') {
			circuitRefMap.set(ranking.filters.circuitRef, ranking);
		}
	});

	useEffect(() => {
		const fetchCircuits = async () => {
			try {
				const response = await fetch('/api/circuits');
				if (!response.ok) {
					throw new Error('Failed to fetch circuits');
				}
				const data = await response.json();
				setCircuitsData(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred');
			} finally {
				setLoading(false);
			}
		};

		fetchCircuits();
	}, []);

	if (loading) {
		return (
			<div className='space-y-6'>
				<div className='flex items-center gap-4'>
					<Link href='/rankings'>
						<Button variant='outline' size='sm'>
							<ArrowLeft className='h-4 w-4 mr-2' />
							Back to Rankings
						</Button>
					</Link>
				</div>
				<div>
					<h1 className='text-3xl font-bold mb-2'>Circuit Masters</h1>
					<p className='text-muted-foreground'>Loading circuit data...</p>
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
				<div className='flex items-center gap-4'>
					<Link href='/rankings'>
						<Button variant='outline' size='sm'>
							<ArrowLeft className='h-4 w-4 mr-2' />
							Back to Rankings
						</Button>
					</Link>
				</div>
				<div>
					<h1 className='text-3xl font-bold mb-2'>Circuit Masters</h1>
					<p className='text-muted-foreground'>Track-specific driver performance rankings</p>
				</div>
				<div className='flex justify-center items-center min-h-[400px]'>
					<div className='text-center space-y-2'>
						<p className='text-red-500'>Error loading circuits: {error}</p>
						<Button variant='outline' onClick={() => window.location.reload()}>
							Try Again
						</Button>
					</div>
				</div>
			</div>
		);
	}

	// Find circuit info for each ranking
	const rankingsWithCircuitInfo = circuitRankings
		.map((ranking) => {
			const circuitRef = ranking.filters?.circuitRef;
			const circuitInfo = circuitsData?.circuits.find((c) => c.circuitRef === circuitRef);
			return { ranking, circuitInfo };
		})
		.filter((item) => item.circuitInfo); // Only show rankings for circuits we have data for

	return (
		<div className='space-y-8'>
			{/* Header */}
			<div className='flex items-center gap-4'>
				<Link href='/rankings'>
					<Button variant='outline' size='sm'>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Back to Rankings
					</Button>
				</Link>
			</div>

			{/* Title Section */}
			<div className='text-center space-y-4'>
				<div className='flex items-center justify-center gap-3'>
					<span className='text-4xl' role='img' aria-label='Circuit Masters'>
						🏎️
					</span>
					<h1 className='text-4xl font-bold'>Circuit Masters</h1>
				</div>
				<p className='text-lg text-muted-foreground max-w-3xl mx-auto'>
					Discover which drivers dominate specific Formula 1 circuits. From the glamour of Monaco to the speed temple of Monza, see who has mastered the most iconic
					venues in motorsport.
				</p>
				<div className='flex justify-center'>
					<Badge variant='outline' className='text-sm'>
						{rankingsWithCircuitInfo.length} Iconic Circuits
					</Badge>
				</div>
			</div>

			{/* Circuit Rankings Grid */}
			<div className='space-y-8'>
				<div>
					<h2 className='text-2xl font-bold mb-6'>Legendary Circuits</h2>
					<div className='grid gap-6 md:grid-cols-2'>
						{rankingsWithCircuitInfo.map(({ ranking, circuitInfo }) => (
							<CircuitRankingCard key={ranking.slug} ranking={ranking} circuitInfo={circuitInfo} />
						))}
					</div>
				</div>
			</div>

			{/* Info Section */}
			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>About Circuit Masters</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid gap-4 md:grid-cols-2'>
						<div>
							<h4 className='font-semibold mb-2'>What are Circuit Masters?</h4>
							<p className='text-sm text-muted-foreground'>
								Circuit Masters are drivers who have achieved exceptional success at specific Formula 1 venues. Each circuit has unique characteristics that favor
								different driving styles and skills.
							</p>
						</div>
						<div>
							<h4 className='font-semibold mb-2'>Ranking Methodology</h4>
							<p className='text-sm text-muted-foreground'>
								Rankings are based on race wins at each circuit throughout F1 history. Only drivers with victories are included, showing true mastery of each
								venue&apos;s unique challenges.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
