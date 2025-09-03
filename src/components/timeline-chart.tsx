'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface TimelineEntry {
	season: string;
	traitScores: {
		aggression: number;
		consistency: number;
		racecraft: number;
		pressure_performance: number;
		race_start: number;
	};
	racesCompleted: number;
}

interface TimelineChartProps {
	data: TimelineEntry[];
	driverName: string;
}

const DataRequirementsInfo = () => (
	<TooltipProvider>
		<UITooltip>
			<TooltipTrigger asChild>
				<button className='inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors'>
					<Info className='h-3 w-3' />
					Missing data points?
				</button>
			</TooltipTrigger>
			<TooltipContent className='max-w-sm'>
				<div className='space-y-2 text-xs'>
					<p className='font-medium'>Why some data points are missing:</p>
					<ul className='space-y-1 list-disc list-inside'>
						<li>
							<strong>Insufficient races:</strong> Some traits require 15-20 races per season
						</li>
						<li>
							<strong>Pressure Performance:</strong> Requires championship battles or high-pressure scenarios
						</li>
						<li>
							<strong>Racecraft:</strong> Needs sufficient wheel-to-wheel racing data
						</li>
						<li>
							<strong>Early career:</strong> Limited race data in partial seasons
						</li>
					</ul>
					<p className='text-muted-foreground mt-2'>Career overview scores use data from all seasons combined.</p>
				</div>
			</TooltipContent>
		</UITooltip>
	</TooltipProvider>
);

export function TimelineChart({ data }: TimelineChartProps) {
	if (!data || data.length === 0) {
		return (
			<div className='flex justify-center items-center h-64'>
				<p className='text-muted-foreground'>No timeline data available</p>
			</div>
		);
	}

	// Transform the data for the chart
	const chartData = data.map((entry) => ({
		season: entry.season,
		aggression: entry.traitScores.aggression,
		consistency: entry.traitScores.consistency,
		racecraft: entry.traitScores.racecraft,
		pressure_performance: entry.traitScores.pressure_performance,
		race_start: entry.traitScores.race_start,
		races: entry.racesCompleted,
	}));

	return (
		<div className='w-full'>
			<div className='flex justify-end mb-3'>
				<DataRequirementsInfo />
			</div>
			<div className='w-full h-96'>
				<ResponsiveContainer width='100%' height='100%'>
					<LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
						<CartesianGrid strokeDasharray='3 3' className='opacity-30' />
						<XAxis dataKey='season' tick={{ fontSize: 12 }} tickLine={{ stroke: '#6b7280' }} />
						<YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickLine={{ stroke: '#6b7280' }} />
						<Tooltip
							content={({ active, payload, label }) => {
								if (active && payload && payload.length) {
									const races = payload[0]?.payload?.races;
									const getScoreColor = (score: number | null) => {
										if (!score) return 'text-muted-foreground';
										if (score >= 70) return 'text-green-600 dark:text-green-400';
										if (score >= 50) return 'text-blue-600 dark:text-blue-400';
										return 'text-yellow-600 dark:text-yellow-400';
									};

									return (
										<div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
											<p className="font-medium text-popover-foreground mb-2">
												{label} Season{races ? ` • ${races} races` : ''}
											</p>
											<div className="space-y-1">
												{payload.map((entry, index) => {
													const nameMap: Record<string, string> = {
														aggression: 'Aggression',
														consistency: 'Consistency',
														racecraft: 'Racecraft',
														pressure_performance: 'Pressure Performance',
														race_start: 'Race Start',
													};
													const score = entry.value as number | null;
													return (
														<div key={index} className="flex justify-between items-center gap-2">
															<span className="text-sm text-popover-foreground">
																{nameMap[entry.dataKey as string] || entry.dataKey}:
															</span>
															<span className={`font-medium ${getScoreColor(score)}`}>
																{score !== null ? score.toFixed(1) : 'N/A'}
															</span>
														</div>
													);
												})}
											</div>
										</div>
									);
								}
								return null;
							}}
						/>
						<Legend
							wrapperStyle={{ paddingTop: '20px' }}
							formatter={(value) => {
								const nameMap: Record<string, string> = {
									aggression: 'Aggression',
									consistency: 'Consistency',
									racecraft: 'Racecraft',
									pressure_performance: 'Pressure Performance',
									race_start: 'Race Start',
								};
								return nameMap[value] || value;
							}}
						/>
						<Line type='monotone' dataKey='aggression' stroke='#ef4444' strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name='aggression' />
						<Line type='monotone' dataKey='consistency' stroke='#3b82f6' strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name='consistency' />
						<Line type='monotone' dataKey='racecraft' stroke='#10b981' strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name='racecraft' />
						<Line type='monotone' dataKey='pressure_performance' stroke='#f59e0b' strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name='pressure_performance' />
						<Line type='monotone' dataKey='race_start' stroke='#8b5cf6' strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name='race_start' />
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
