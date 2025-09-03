'use client';

import { use } from 'react';
import { useDriver, useDriverTimeline, useDriverBreakdown } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCountryFlag } from '@/lib/flags';
import Link from 'next/link';
import { ArrowLeft, Calculator, Info } from 'lucide-react';
import { TimelineChart } from '@/components/timeline-chart';
import { RadialChart } from '@/components/radial-chart';
import { FormulaDisplay } from '@/components/formula-display';
import { DriverAvatar } from '@/components/driver-avatar';
import { getTraitFormula, TraitFormula } from '@/lib/dna-formulas';

function DNAScoreCard({
	title,
	score,
	description,
	breakdown,
}: {
	title: string;
	score: number | null;
	description: string;
	driverId: number;
	breakdown: Record<string, unknown> | undefined;
}) {
	const getColor = (value: number) => {
		if (value >= 70) return 'text-green-600 dark:text-green-400';
		if (value >= 50) return 'text-blue-600 dark:text-blue-400';
		return 'text-yellow-600 dark:text-yellow-400';
	};

	const getTraitKey = (title: string) => {
		switch (title) {
			case 'Aggression':
				return 'aggression';
			case 'Consistency':
				return 'consistency';
			case 'Racecraft':
				return 'racecraft';
			case 'Pressure Performance':
				return 'pressure_performance';
			case 'Clutch Factor':
				return 'clutch_factor';
			case 'Race Start':
				return 'race_start';
			default:
				return title.toLowerCase().replace(' ', '_');
		}
	};

	const traitData = breakdown
		? (breakdown[getTraitKey(title)] as
				| {
						rawValue: number;
						normalizedScore: number;
						contributingStats: Record<string, unknown>;
						calculationNotes: string | null;
				  }
				| undefined)
		: null;
	const traitFormula: TraitFormula | null = getTraitFormula(getTraitKey(title));

	const getDataRequirementMessage = (title: string) => {
		const messages: Record<string, string> = {
			Aggression: 'Requires 15+ races with sufficient overtaking/defending data.',
			Consistency: 'Requires 15+ races with position and lap time data.',
			Racecraft: 'Requires 20+ races with wheel-to-wheel racing situations.',
			'Pressure Performance': 'Requires championship battles, must-win scenarios, or high-pressure situations.',
			'Race Start': 'Requires 5+ races with starting position and first lap data.',
		};
		return messages[title] || 'Insufficient data for reliable calculation.';
	};

	return (
		<Card className='flex flex-col h-full'>
			<CardHeader className='pb-3'>
				<CardTitle className='text-base flex items-center gap-2'>
					{title}
					{score === null && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Info className='h-3 w-3 text-muted-foreground cursor-help' />
								</TooltipTrigger>
								<TooltipContent className='max-w-xs'>
									<p className='text-xs'>{getDataRequirementMessage(title)}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className='pt-0 flex-1 flex flex-col'>
				<div className={`text-2xl font-bold ${getColor(score || 0)} mb-1`}>{score?.toFixed(1) || 'N/A'}</div>

				<div className='flex-1' />

				<div className='mt-auto'>
					<p className='text-xs text-muted-foreground leading-tight mb-3'>{description}</p>

					{!!traitData && !!traitFormula && (
						<Dialog>
							<DialogTrigger asChild>
								<Button variant='ghost' size='sm' className='h-6 px-2 text-xs'>
									<Calculator className='h-3 w-3 mr-1' />
									Show Calculation
								</Button>
							</DialogTrigger>
							<DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
								<DialogHeader>
									<DialogTitle>{title} Calculation</DialogTitle>
									<DialogDescription>Mathematical breakdown showing exactly how this score was calculated</DialogDescription>
								</DialogHeader>

								<div className='mt-4'>
									<FormulaDisplay traitFormula={traitFormula} contributingStats={traitData.contributingStats || {}} finalScore={score || 0} />
								</div>

								{traitData.calculationNotes && (
									<div className='mt-4 p-3 bg-muted/50 rounded'>
										<h4 className='font-medium mb-2'>Additional Notes:</h4>
										<p className='text-sm text-muted-foreground'>{traitData.calculationNotes}</p>
									</div>
								)}
							</DialogContent>
						</Dialog>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export default function DriverPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const driverId = parseInt(id);

	const { data: driver, isLoading: driverLoading, error: driverError } = useDriver(driverId);
	const { data: timeline, isLoading: timelineLoading, error: timelineError } = useDriverTimeline(driverId);
	const { data: breakdown } = useDriverBreakdown(driverId);

	if (driverLoading) {
		return (
			<div className='flex justify-center items-center min-h-[400px]'>
				<p>Loading driver...</p>
			</div>
		);
	}

	if (driverError || !driver) {
		return (
			<div className='space-y-4'>
				<Link href='/'>
					<Button variant='outline' size='sm'>
						<ArrowLeft className='mr-2 h-4 w-4' />
						Back to drivers
					</Button>
				</Link>
				<div className='flex justify-center items-center min-h-[400px]'>
					<p className='text-red-500'>{driverError?.message || 'Driver not found'}</p>
				</div>
			</div>
		);
	}

	const profile = driver.dnaProfile;
	const flag = getCountryFlag(driver.nationality);

	return (
		<div className='space-y-6'>
			<div>
				<Link href='/'>
					<Button variant='outline' size='sm'>
						<ArrowLeft className='mr-2 h-4 w-4' />
						Back to drivers
					</Button>
				</Link>
			</div>

			{profile ? (
				<>
					{/* Driver Info and Radar Chart Row */}
					<div className='grid gap-6 lg:grid-cols-2'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-4'>
									<DriverAvatar driverId={driverId} driverName={driver.name} imageUrl={profile.imageUrl} size={60} />
									<div className='flex-1'>
										<div className='flex items-center gap-3 mb-1'>
											<span className='text-2xl font-bold'>{driver.name}</span>
											{flag && (
												<span className='text-2xl cursor-help transition-transform hover:scale-110' title={driver.nationality || undefined}>
													{flag}
												</span>
											)}
										</div>
										<div className='flex items-center gap-4 text-sm text-muted-foreground'>
											<span>Nationality: {driver.nationality}</span>
											{driver.dob && <span>Born: {new Date(driver.dob).getFullYear()}</span>}
										</div>
									</div>
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								{/* </CardContent> will be closed later */}
								<div className='space-y-2'>
									<div className='text-sm'>
										<span className='font-medium'>Races Analyzed:</span> {profile.racesAnalyzed}
									</div>
									<div className='text-sm'>
										<span className='font-medium'>Career Span:</span> {profile.careerSpan}
									</div>

									{/* Racing Statistics */}
									{(profile.wins !== null || profile.podiums !== null) && (
										<div className='pt-2 border-t'>
											<div className='grid grid-cols-2 gap-2 text-sm'>
												{/* Podium finishes stacked */}
												<div className='space-y-1'>
													{profile.wins !== null && (
														<div>
															<span className='font-medium text-green-600'>1st:</span> {profile.wins}
														</div>
													)}
													{profile.secondPlaces !== null && (
														<div>
															<span className='font-medium text-gray-500'>2nd:</span> {profile.secondPlaces}
														</div>
													)}
													{profile.thirdPlaces !== null && (
														<div>
															<span className='font-medium text-amber-600'>3rd:</span> {profile.thirdPlaces}
														</div>
													)}
												</div>

												{/* Other stats stacked */}
												<div className='space-y-1'>
													{profile.podiums !== null && (
														<div>
															<span className='font-medium text-blue-600'>Podiums:</span> {profile.podiums}
														</div>
													)}
													{profile.avgFinishPosition !== null && (
														<div>
															<span className='font-medium'>Avg Finish:</span> {profile.avgFinishPosition?.toFixed(2)}
														</div>
													)}
													{profile.bestChampionshipFinish !== null && (
														<div>
															<span className='font-medium'>Best WDC:</span> P{profile.bestChampionshipFinish}
														</div>
													)}
												</div>
											</div>
										</div>
									)}

									<div className='text-sm text-muted-foreground'>Last updated: {new Date(profile.lastUpdated).toLocaleDateString()}</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Career Overview</CardTitle>
								<CardDescription>DNA trait comparison across all analyzed metrics</CardDescription>
							</CardHeader>
							<CardContent>
								<RadialChart
									data={{
										aggressionScore: profile.aggressionScore,
										consistencyScore: profile.consistencyScore,
										racecraftScore: profile.racecraftScore,
										pressurePerformanceScore: profile.pressurePerformanceScore,
										clutchFactorScore: profile.clutchFactorScore,
										raceStartScore: profile.raceStartScore,
									}}
									driverName={driver.name.split(' ')[0]}
								/>
							</CardContent>
						</Card>
					</div>

					{/* DNA Score Cards */}
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
						<DNAScoreCard
							title='Aggression'
							score={profile.aggressionScore}
							description='Racing aggression and overtaking tendency'
							driverId={driverId}
							breakdown={breakdown}
						/>
						<DNAScoreCard
							title='Consistency'
							score={profile.consistencyScore}
							description='Reliability and consistent performance'
							driverId={driverId}
							breakdown={breakdown}
						/>
						<DNAScoreCard title='Racecraft' score={profile.racecraftScore} description='Wheel-to-wheel racing skill' driverId={driverId} breakdown={breakdown} />
						<DNAScoreCard
							title='Pressure Performance'
							score={profile.pressurePerformanceScore}
							description='Performance under pressure'
							driverId={driverId}
							breakdown={breakdown}
						/>
						<DNAScoreCard
							title='Race Start'
							score={profile.raceStartScore}
							description='First lap position change performance'
							driverId={driverId}
							breakdown={breakdown}
						/>
					</div>

					{timeline && timeline.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Career Evolution</CardTitle>
								<CardDescription>How {driver.name.split(' ')[0]}&apos;s DNA traits evolved over their career</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='mb-4 p-3 bg-muted/50 rounded-md'>
									<div className='flex items-start gap-2'>
										<Info className='h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0' />
										<div className='text-xs text-muted-foreground'>
											<p className='font-medium mb-1'>Career Overview vs. Timeline Data:</p>
											<p>
												<strong>Career Overview</strong> (above) uses data from all {profile.racesAnalyzed} races across their entire career.
												<strong> Timeline</strong> (below) shows season-by-season performance, requiring sufficient data within each individual season.
											</p>
										</div>
									</div>
								</div>
								<TimelineChart data={timeline} driverName={driver.name} />
							</CardContent>
						</Card>
					)}

					{timelineLoading && (
						<Card>
							<CardContent className='py-8'>
								<p className='text-center text-muted-foreground'>Loading timeline...</p>
							</CardContent>
						</Card>
					)}

					{timelineError && (
						<Card>
							<CardContent className='py-8'>
								<p className='text-center text-red-500'>Failed to load timeline data</p>
							</CardContent>
						</Card>
					)}
				</>
			) : (
				<Card>
					<CardContent className='py-8'>
						<p className='text-center text-muted-foreground'>No DNA profile available for this driver</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
