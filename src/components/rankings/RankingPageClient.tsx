'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Medal, Award } from 'lucide-react';
import Link from 'next/link';
import { DriverAvatar } from '@/components/driver-avatar';
import { getCountryFlag } from '@/lib/flags';
import type { RankingConfig } from '@/lib/rankings-config';
import { DriverDnaProfileWithStats } from '@/lib/types';

interface RankedDriver {
	id: number;
	name: string;
	nationality: string | null;
	age: number | null;
	dob: Date | null;
	position: number;
	rankingValue: number | null;
	dnaProfile: DriverDnaProfileWithStats;
}

interface RankingData {
	ranking: RankingConfig;
	drivers: RankedDriver[];
	count: number;
}

function PositionIcon({ position }: { position: number }) {
	if (position === 1) return <Trophy className='h-5 w-5 text-yellow-500' />;
	if (position === 2) return <Medal className='h-5 w-5 text-gray-400' />;
	if (position === 3) return <Award className='h-5 w-5 text-amber-600' />;
	return <span className='text-sm font-medium text-muted-foreground'>#{position}</span>;
}

function RankingValueBadge({ value, unit, category }: { value: number | null; unit?: string; category: string }) {
	if (value === null) {
		return <Badge variant='secondary'>N/A</Badge>;
	}

	const getBadgeProps = (val: number, cat: string) => {
		if (cat === 'dna') {
			if (val >= 80) {
				return {
					variant: 'outline' as const,
					className: 'border-green-500 bg-green-50 text-green-800 dark:border-green-400 dark:bg-green-950 dark:text-green-300',
				};
			}
			if (val >= 60) {
				return {
					variant: 'outline' as const,
					className: 'border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300',
				};
			}
			if (val >= 40) {
				return {
					variant: 'outline' as const,
					className: 'border-yellow-500 bg-yellow-50 text-yellow-800 dark:border-yellow-400 dark:bg-yellow-950 dark:text-yellow-300',
				};
			}
			return {
				variant: 'secondary' as const,
				className: '',
			};
		}
		return {
			variant: 'default' as const,
			className: '',
		};
	};

	const { variant, className } = getBadgeProps(value, category);
	const displayValue = value.toFixed(1);

	return (
		<Badge variant={variant} className={className}>
			{displayValue}
			{unit}
		</Badge>
	);
}

function DriverRow({ driver, ranking }: { driver: RankedDriver; ranking: RankingConfig }) {
	const flag = getCountryFlag(driver.nationality);

	return (
		<Link href={`/driver/${driver.id}`}>
			<div className='p-3 sm:p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group'>
				{/* Mobile Layout */}
				<div className='sm:hidden'>
					<div className='flex items-center gap-3 mb-2'>
						{/* Position */}
						<div className='flex-shrink-0 w-8 flex justify-center'>
							<PositionIcon position={driver.position} />
						</div>

						{/* Driver Avatar and Name */}
						<DriverAvatar driverId={driver.id} driverName={driver.name} imageUrl={driver.dnaProfile?.imageUrl} size={40} />

						<div className='flex-1 min-w-0'>
							<div className='flex items-center gap-2 mb-1'>
								<h3 className='font-semibold text-sm group-hover:text-primary transition-colors truncate'>{driver.name}</h3>
								{flag && (
									<span className='text-base flex-shrink-0' title={driver.nationality || undefined}>
										{flag}
									</span>
								)}
							</div>
						</div>

						{/* Ranking Value */}
						<div className='flex-shrink-0'>
							<RankingValueBadge value={driver.rankingValue} unit={ranking.unit} category={ranking.category} />
						</div>
					</div>

					{/* Mobile Stats Row */}
					<div className='flex items-center justify-between text-xs text-muted-foreground ml-11'>
						<div className='flex items-center gap-2 flex-wrap'>
							{driver.dnaProfile?.racesAnalyzed && <span>{driver.dnaProfile.racesAnalyzed} races</span>}
							{driver.dnaProfile?.careerSpan && <span>• {driver.dnaProfile.careerSpan}</span>}
							{driver.age && <span>• {driver.age} years old</span>}
						</div>

						{/* Additional Stats for Mobile */}
						{ranking.category === 'career' && driver?.dnaProfile?.wins && driver.dnaProfile.wins > 0 && (
							<div className='flex items-center gap-1'>
								<span>{driver.dnaProfile.wins}W</span>
								{driver.dnaProfile.podiums && driver.dnaProfile.podiums > 0 && <span>• {driver.dnaProfile.podiums}P</span>}
							</div>
						)}
					</div>
				</div>

				{/* Desktop Layout */}
				<div className='hidden sm:flex items-center gap-4'>
					{/* Position */}
					<div className='flex-shrink-0 w-12 flex justify-center'>
						<PositionIcon position={driver.position} />
					</div>

					{/* Driver Info */}
					<div className='flex items-center gap-3 flex-1 min-w-0'>
						<DriverAvatar driverId={driver.id} driverName={driver.name} imageUrl={driver.dnaProfile?.imageUrl} size={48} />
						<div className='flex-1 min-w-0'>
							<div className='flex items-center gap-2 mb-1'>
								<h3 className='font-semibold text-sm group-hover:text-primary transition-colors truncate'>{driver.name}</h3>
								{flag && (
									<span className='text-lg flex-shrink-0' title={driver.nationality || undefined}>
										{flag}
									</span>
								)}
							</div>
							<div className='flex items-center gap-2 text-xs text-muted-foreground'>
								{driver.dnaProfile?.racesAnalyzed && <span>{driver.dnaProfile.racesAnalyzed} races</span>}
								{driver.dnaProfile?.careerSpan && <span>• {driver.dnaProfile.careerSpan}</span>}
								{driver.age && <span>• {driver.age} years old</span>}
							</div>
						</div>
					</div>

					{/* Ranking Value */}
					<div className='flex-shrink-0'>
						<RankingValueBadge value={driver.rankingValue} unit={ranking.unit} category={ranking.category} />
					</div>

					{/* Additional Stats for Career Rankings */}
					{ranking.category === 'career' && driver.dnaProfile?.wins && driver.dnaProfile.wins > 0 && (
						<div className='flex items-center gap-2 text-xs text-muted-foreground'>
							<span>{driver.dnaProfile.wins} wins</span>
							{driver.dnaProfile.podiums && driver.dnaProfile.podiums > 0 && <span>• {driver.dnaProfile.podiums} podiums</span>}
						</div>
					)}
				</div>
			</div>
		</Link>
	);
}

export function RankingPageClient() {
	const params = useParams();
	const slug = params?.slug as string;
	const [data, setData] = useState<RankingData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!slug) return;

		const fetchRanking = async () => {
			try {
				const response = await fetch(`/api/rankings/${slug}`);
				if (!response.ok) {
					if (response.status === 404) {
						throw new Error('Ranking not found');
					}
					throw new Error('Failed to fetch ranking data');
				}
				const rankingData = await response.json();
				setData(rankingData);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred');
			} finally {
				setLoading(false);
			}
		};

		fetchRanking();
	}, [slug]);

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
					<h1 className='text-3xl font-bold mb-2'>Loading...</h1>
					<p className='text-muted-foreground'>Loading ranking data...</p>
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
					<h1 className='text-3xl font-bold mb-2'>Error</h1>
					<p className='text-muted-foreground'>There was a problem loading the ranking</p>
				</div>
				<div className='flex justify-center items-center min-h-[400px]'>
					<div className='text-center space-y-2'>
						<p className='text-red-500'>Error: {error}</p>
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
		<div className='space-y-4 sm:space-y-6 px-4 sm:px-0'>
			{/* Header */}
			<div className='flex items-center gap-4'>
				<Link href='/rankings'>
					<Button variant='outline' size='sm'>
						<ArrowLeft className='h-4 w-4 mr-2' />
						<span className='hidden sm:inline'>Back to Rankings</span>
						<span className='sm:hidden'>Back</span>
					</Button>
				</Link>
			</div>

			{/* Title Section */}
			<div className='space-y-4'>
				<div className='flex flex-col sm:flex-row items-start gap-4'>
					<div className='flex-1'>
						<h1 className='text-2xl sm:text-3xl font-bold mb-2'>{data.ranking.title}</h1>
						<p className='text-sm sm:text-lg text-muted-foreground mb-4'>{data.ranking.description}</p>
						<div className='flex items-center gap-2'>
							<Badge variant='secondary'>{data.ranking.category}</Badge>
							<Badge variant='outline'>{data.count} drivers</Badge>
						</div>
					</div>
				</div>
			</div>

			{/* Ranking List */}
			<Card>
				<CardHeader>
					<CardTitle>Top {data.count} Drivers</CardTitle>
					<CardDescription>
						Ranked by {data.ranking.sortOrder === 'desc' ? 'highest' : 'lowest'} {data.ranking.sortField.replace(/([A-Z])/g, ' $1').toLowerCase()}
					</CardDescription>
				</CardHeader>
				<CardContent className='p-0'>
					<div className='divide-y'>
						{data.drivers.map((driver) => (
							<DriverRow key={driver.id} driver={driver} ranking={data.ranking} />
						))}
					</div>
				</CardContent>
			</Card>

			{/* Methodology Note */}
			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>Methodology</CardTitle>
				</CardHeader>
				<CardContent>
					<p className='text-sm text-muted-foreground'>
						{data.ranking.category === 'dna'
							? 'DNA scores are calculated based on comprehensive analysis of driver behavior patterns, performance metrics, and racing statistics across multiple seasons.'
							: "Career statistics are compiled from official Formula 1 race results and championship data spanning drivers' entire careers."}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
