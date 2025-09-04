'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InsightConfig } from '@/lib/insights-config';
import { DriverAvatar } from '@/components/driver-avatar';
import { ScatterPlotChart } from '@/components/insights/ScatterPlotChart';
import { MultiLineChart } from '@/components/insights/MultiLineChart';
import { HeatmapChart } from '@/components/insights/HeatmapChart';
import { BarChart } from '@/components/insights/BarChart';
import { Lightbulb, TrendingUp, ArrowRight, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getTraitFormula } from '@/lib/dna-formulas';

interface InsightPageClientProps {
	config: InsightConfig;
}

export function InsightPageClient({ config }: InsightPageClientProps) {
	const {
		data: insightData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['insight', config.slug],
		queryFn: async () => {
			const response = await fetch(`/api/insights/${config.slug}`);
			if (!response.ok) throw new Error('Failed to fetch insight data');
			return response.json();
		},
	});

	const renderMainVisualization = () => {
		if (isLoading) {
			return (
				<Card>
					<CardContent className='h-96 flex items-center justify-center'>
						<p className='text-muted-foreground'>Loading visualization...</p>
					</CardContent>
				</Card>
			);
		}

		if (error || !insightData?.data) {
			return (
				<Card>
					<CardContent>
						<div className='h-96 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20'>
							<div className='text-center space-y-2'>
								<p className='text-muted-foreground'>{error ? 'Error loading data' : 'No data available'}</p>
								<p className='text-sm text-muted-foreground'>{config.visualizations.primary.dataQuery}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			);
		}

		// Render actual visualizations based on data
		if (config.slug === 'aggression-paradox' && insightData.data.scatterData) {
			const scatterData = insightData.data.scatterData.map((item: { wins?: number; aggressionScore?: number; [key: string]: unknown }) => ({
				...item,
				x: item.wins || 0,
				y: item.aggressionScore || 0,
			}));

			return (
				<ScatterPlotChart
					data={scatterData}
					title={config.visualizations.primary.title}
					description={config.visualizations.primary.description}
					xAxisLabel='Career Wins'
					yAxisLabel='Aggression Score'
				/>
			);
		}

		if (config.slug === 'era-evolution' && insightData.data.eraTraitAverages) {
			return (
				<MultiLineChart
					data={insightData.data.eraTraitAverages}
					title={config.visualizations.primary.title}
					description={config.visualizations.primary.description}
					lines={[
						{
							key: 'aggressionScore',
							label: 'Aggression',
							color: 'var(--chart-1)',
						},
						{
							key: 'consistencyScore',
							label: 'Consistency',
							color: 'var(--chart-2)',
						},
						{
							key: 'racecraftScore',
							label: 'Racecraft',
							color: 'var(--chart-3)',
						},
						{
							key: 'pressurePerformanceScore',
							label: 'Pressure Performance',
							color: 'var(--chart-4)',
						},
						{
							key: 'raceStartScore',
							label: 'Race Start',
							color: 'var(--chart-5)',
						},
					]}
					xAxisLabel='Era'
					yAxisLabel='DNA Trait'
				/>
			);
		}

		if (config.slug === 'consistency-trap' && insightData.data.scatterData) {
			const scatterData = insightData.data.scatterData.map((item: { consistencyScore?: number; wins?: number; [key: string]: unknown }) => ({
				...item,
				x: item.consistencyScore || 0,
				y: item.wins || 0,
			}));

			return (
				<ScatterPlotChart
					data={scatterData}
					title={config.visualizations.primary.title}
					description={config.visualizations.primary.description}
					xAxisLabel='Consistency Score'
					yAxisLabel='Career Wins'
				/>
			);
		}

		if (config.slug === 'circuit-dna' && insightData.data.circuitTraitCorrelations) {
			return (
				<HeatmapChart
					data={insightData.data.circuitTraitCorrelations}
					title={config.visualizations.primary.title}
					description={config.visualizations.primary.description}
					rowLabel='Circuit'
					columnLabel='DNA Trait'
				/>
			);
		}

		// Default placeholder for other insights
		return (
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<span className='capitalize'>{config.visualizations.primary.type}</span> Chart
						<Badge variant='outline'>Interactive</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='h-96 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20'>
						<div className='text-center space-y-2'>
							<p className='text-muted-foreground'>
								{config.visualizations.primary.type.charAt(0).toUpperCase() + config.visualizations.primary.type.slice(1)} visualization coming soon
							</p>
							<p className='text-sm text-muted-foreground'>Data: {config.visualizations.primary.dataQuery}</p>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	};

	return (
		<div className='space-y-6 lg:space-y-8'>
			{/* Main Visualization Section */}
			<div className='space-y-4 lg:space-y-6'>
				<div className='text-center px-4'>
					<h2 className='text-xl sm:text-2xl font-bold mb-2'>{config.visualizations.primary.title}</h2>
					<p className='text-muted-foreground text-sm sm:text-base'>{config.visualizations.primary.description}</p>
				</div>

				<div className='w-full overflow-hidden'>{renderMainVisualization()}</div>
			</div>

			{/* Narrative Explanation */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Lightbulb className='h-5 w-5 text-yellow-500' />
							Why This Happens
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground leading-relaxed'>{config.narrative.explanation}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<TrendingUp className='h-5 w-5 text-green-500' />
							What This Means
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground leading-relaxed'>{config.narrative.implications}</p>
					</CardContent>
				</Card>
			</div>

			{/* Driver Examples */}
			<div className='space-y-4 lg:space-y-6'>
				<div className='flex items-center gap-2 px-4'>
					<span className='text-xl sm:text-2xl'>👥</span>
					<h2 className='text-xl sm:text-2xl font-bold'>Driver Examples</h2>
				</div>

				<div className='grid gap-4 lg:gap-6'>
					{config.examples.map((example, index) => (
						<Card key={index} className='border-l-4 border-l-primary'>
							<CardHeader>
								<div className='flex items-start gap-3 sm:gap-4'>
									<DriverAvatar driverId={example.driverId} driverName={example.driverName} size={40} />
									<div className='flex-1 min-w-0'>
										<CardTitle className='text-base sm:text-lg'>{example.driverName}</CardTitle>
										<p className='text-muted-foreground mt-1 text-sm sm:text-base leading-relaxed'>{example.explanation}</p>
									</div>
									<Link href={`/driver/${example.driverId}`}>
										<Button variant='ghost' size='sm'>
											View Profile
											<ExternalLink className='h-4 w-4 ml-1' />
										</Button>
									</Link>
								</div>
							</CardHeader>
							<CardContent>
								<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'>
									{Object.entries(example.stats).map(([key, value]) => (
										<div key={key} className='text-center p-2 sm:p-3 bg-muted/30 rounded-lg'>
											<div className='text-base sm:text-lg font-bold'>{value}</div>
											<div className='text-xs text-muted-foreground capitalize leading-tight'>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Supporting Visualizations */}
			{config.visualizations.supporting.length > 0 &&
				config.visualizations.supporting.some((viz) => {
					// Check if this chart would actually render (not return null)
					if (isLoading || error || !insightData?.data) return false;

					// Check each insight type for supported charts
					if (config.slug === 'aggression-paradox') {
						return (viz.type === 'bar' && insightData.data.aggByWinRange) || (viz.type === 'line' && insightData.data.eraAverages);
					}
					if (config.slug === 'consistency-trap') {
						return (viz.type === 'bar' && insightData.data.consistencyRangeData) || (viz.type === 'scatter' && insightData.data.scatterData);
					}
					if (config.slug === 'era-evolution') {
						return (viz.type === 'heatmap' && insightData.data.heatmapData) || (viz.type === 'bar' && insightData.data.championshipData);
					}
					if (config.slug === 'circuit-dna') {
						return (viz.type === 'scatter' && insightData.data.monacoData) || (viz.type === 'bar' && insightData.data.trackTypeData);
					}
					return false;
				}) && (
					<div className='space-y-4 lg:space-y-6'>
						<div className='flex items-center gap-2 px-4'>
							<span className='text-xl sm:text-2xl'>📊</span>
							<h2 className='text-xl sm:text-2xl font-bold'>Supporting Analysis</h2>
						</div>

						<div className='grid gap-4 lg:gap-6'>
							{config.visualizations.supporting
								.map((viz, index) => {
									const renderSupportingChart = () => {
										if (isLoading) {
											return (
												<div className='h-64 flex items-center justify-center'>
													<p className='text-muted-foreground'>Loading chart...</p>
												</div>
											);
										}

										if (error || !insightData?.data) {
											return (
												<div className='h-64 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20'>
													<div className='text-center space-y-2'>
														<div className='text-4xl'>📈</div>
														<p className='text-muted-foreground'>{error ? 'Error loading data' : 'No data available'}</p>
													</div>
												</div>
											);
										}

										// Render specific charts based on insight and chart type
										if (config.slug === 'aggression-paradox') {
											if (viz.type === 'bar' && insightData.data.aggByWinRange) {
												return (
													<BarChart
														data={insightData.data.aggByWinRange.map((item: { label: string; avgAggression: number; count: number }) => ({
															label: item.label,
															value: item.avgAggression,
															count: item.count,
															avgAggression: item.avgAggression,
														}))}
														title={viz.title}
														description={viz.description}
														xAxisLabel='Win Range Groups'
														yAxisLabel='Average Aggression Score'
													/>
												);
											}
											if (viz.type === 'line' && insightData.data.eraAverages) {
												return (
													<MultiLineChart
														data={insightData.data.eraAverages}
														title={viz.title}
														description={viz.description}
														lines={[
															{
																key: 'avgAggression',
																label: 'Aggression Score',
																color: 'oklch(var(--chart-1))',
															},
														]}
														xAxisLabel='Era'
														yAxisLabel='DNA Trait'
													/>
												);
											}
										}

										if (config.slug === 'consistency-trap') {
											if (viz.type === 'scatter' && insightData.data.scatterData) {
												// For consistency trap, we need different scatter data
												if (viz.title.includes('Championships')) {
													// Main chart: Consistency vs Championships (we don't have championship data yet)
													return (
														<ScatterPlotChart
															data={insightData.data.scatterData.map(
																(item: { consistencyScore?: number; wins?: number; [key: string]: unknown }) => ({
																	...item,
																	x: item.consistencyScore || 0,
																	y: item.wins || 0, // Using wins as proxy for success
																})
															)}
															title={viz.title}
															description={viz.description}
															xAxisLabel='Consistency Score'
															yAxisLabel='Career Wins'
														/>
													);
												} else {
													// Win Rate chart
													return (
														<ScatterPlotChart
															data={insightData.data.scatterData.map(
																(item: { consistencyScore?: number; wins?: number; [key: string]: unknown }) => ({
																	...item,
																	x: item.consistencyScore || 0,
																	y: item.winRate || 0,
																})
															)}
															title={viz.title}
															description={viz.description}
															xAxisLabel='Consistency Score'
															yAxisLabel='Win Rate (%)'
														/>
													);
												}
											}
											if (viz.type === 'bar' && insightData.data.scatterData) {
												// Group consistency data by ranges
												const consistencyRanges = [
													{ min: 0, max: 50, label: 'Low (0-50)' },
													{ min: 50, max: 60, label: 'Moderate (50-60)' },
													{ min: 60, max: 70, label: 'Good (60-70)' },
													{ min: 70, max: 80, label: 'High (70-80)' },
													{ min: 80, max: 100, label: 'Ultra-High (80+)' },
												];

												const consistencyByRange = consistencyRanges.map((range) => {
													const driversInRange = insightData.data.scatterData.filter(
														(d: { consistencyScore?: number }) => (d.consistencyScore || 0) >= range.min && (d.consistencyScore || 0) < range.max
													);
													const avgWins =
														driversInRange.length > 0
															? driversInRange.reduce((sum: number, d: { wins?: number }) => sum + (d.wins || 0), 0) / driversInRange.length
															: 0;

													return {
														label: range.label,
														value: Number(avgWins.toFixed(1)),
														count: driversInRange.length,
														avgWins: Number(avgWins.toFixed(1)),
													};
												});

												return (
													<BarChart
														data={consistencyByRange}
														title={viz.title}
														description={viz.description}
														xAxisLabel='Consistency Score Range'
														yAxisLabel='Average Career Wins'
													/>
												);
											}
										}

										if (config.slug === 'era-evolution') {
											if (viz.type === 'line' && insightData.data.eraTraitAverages) {
												return (
													<MultiLineChart
														data={insightData.data.eraTraitAverages}
														title={viz.title}
														description={viz.description}
														lines={[
															{
																key: 'aggressionScore',
																label: 'Aggression',
																color: 'oklch(var(--chart-1))',
															},
															{
																key: 'consistencyScore',
																label: 'Consistency',
																color: 'oklch(var(--chart-2))',
															},
															{
																key: 'racecraftScore',
																label: 'Racecraft',
																color: 'oklch(var(--chart-3))',
															},
															{
																key: 'pressurePerformanceScore',
																label: 'Pressure Performance',
																color: 'oklch(var(--chart-4))',
															},
															{
																key: 'raceStartScore',
																label: 'Race Start',
																color: 'oklch(var(--chart-5))',
															},
														]}
														xAxisLabel='Era'
														yAxisLabel='DNA Trait'
													/>
												);
											}
											if (viz.type === 'heatmap' && insightData.data.heatmapData) {
												return (
													<HeatmapChart
														data={insightData.data.heatmapData}
														title={viz.title}
														description={viz.description}
														rowLabel='Era'
														columnLabel='DNA Trait'
													/>
												);
											}
										}

										if (config.slug === 'circuit-dna') {
											if (viz.type === 'heatmap' && insightData.data.circuitTraitCorrelations) {
												return (
													<HeatmapChart
														data={insightData.data.circuitTraitCorrelations}
														title={viz.title}
														description={viz.description}
														rowLabel='Circuit'
														columnLabel='DNA Trait Correlation'
														minValue={0}
														maxValue={100}
													/>
												);
											}
											if (viz.type === 'scatter' && insightData.data.monacoRacecraftData) {
												return (
													<ScatterPlotChart
														data={insightData.data.monacoRacecraftData.map(
															(item: { racecraftScore?: number; monacoSuccessRate?: number; [key: string]: unknown }) => ({
																...item,
																x: item.racecraftScore || 0,
																y: item.monacoSuccessRate || 0,
															})
														)}
														title={viz.title}
														description={viz.description}
														xAxisLabel='Racecraft Score'
														yAxisLabel='Monaco Success Rate (%)'
													/>
												);
											}
										}

										// Return null for unsupported chart types to hide them
										return null;
									};

									const chart = renderSupportingChart();
									return chart ? <div key={index}>{chart}</div> : null;
								})
								.filter(Boolean)}
						</div>
					</div>
				)}

			{/* Methodology */}
			<Card className='bg-muted/20'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<span className='text-xl'>🔬</span>
						Methodology
					</CardTitle>
				</CardHeader>
				<CardContent className='space-y-6'>
					<div>
						<h4 className='font-semibold mb-2'>Analysis Methods</h4>
						<div className='flex flex-wrap gap-2'>
							{config.chartTypes.map((chart) => (
								<Badge key={chart} variant='outline' className='capitalize'>
									{chart} Analysis
								</Badge>
							))}
						</div>
					</div>
					
					{config.dnaTraitsUsed && config.dnaTraitsUsed.length > 0 && (
						<div>
							<h4 className='font-semibold mb-3'>DNA Trait Calculations</h4>
							<div className='space-y-4'>
								{config.dnaTraitsUsed.map((traitKey) => {
									const formula = getTraitFormula(traitKey);
									if (!formula) return null;
									
									const traitNames: Record<string, string> = {
										aggression: 'Aggression Score',
										consistency: 'Consistency Score', 
										racecraft: 'Racecraft Score',
										pressure_performance: 'Pressure Performance Score',
										race_start: 'Race Start Score'
									};
									
									return (
										<div key={traitKey} className='border rounded-lg p-4 bg-background/50'>
											<h5 className='font-medium mb-2'>{traitNames[traitKey]}</h5>
											<p className='text-sm text-muted-foreground mb-3'>{formula.description}</p>
											
											<div className='space-y-2'>
												<h6 className='text-sm font-medium'>Key Components:</h6>
												<ul className='text-sm text-muted-foreground space-y-1'>
													{formula.components.map((component, index) => (
														<li key={index} className='flex items-start gap-2'>
															<span className='text-primary font-medium min-w-0'>
																{component.name}
															</span>
															<span className='text-muted-foreground'>
																({(component.weight * 100).toFixed(0)}% weight)
															</span>
														</li>
													))}
												</ul>
											</div>
											
											<div className='mt-3 pt-2 border-t border-border/50'>
												<p className='text-xs text-muted-foreground'>
													<strong>Final Calculation:</strong> {formula.finalCalculation.description}
												</p>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}
					
					<div>
						<h4 className='font-semibold mb-2'>Data Sources</h4>
						<p className='text-sm text-muted-foreground'>
							This analysis uses comprehensive F1 data including race results, qualifying positions, driver DNA profiles, and career statistics. 
							Statistical correlations and trend analysis reveal patterns that might not be immediately obvious from traditional metrics.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Related Insights */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<span className='text-xl'>🔗</span>
						Explore More Insights
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='flex flex-wrap gap-2'>
						<Link href='/insights'>
							<Button variant='outline'>
								View All Insights
								<ArrowRight className='h-4 w-4 ml-1' />
							</Button>
						</Link>
						<Link href='/rankings'>
							<Button variant='outline'>
								Driver Rankings
								<ArrowRight className='h-4 w-4 ml-1' />
							</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
