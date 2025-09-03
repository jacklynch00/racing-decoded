'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
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

const chartConfig = {
	aggression: {
		label: 'Aggression',
		color: 'var(--chart-1)',
	},
	consistency: {
		label: 'Consistency', 
		color: 'var(--chart-2)',
	},
	racecraft: {
		label: 'Racecraft',
		color: 'var(--chart-3)',
	},
	pressure_performance: {
		label: 'Pressure Performance',
		color: 'var(--chart-4)',
	},
	race_start: {
		label: 'Race Start',
		color: 'var(--chart-5)',
	},
};

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
			<ChartContainer config={chartConfig} className='w-full h-80 sm:h-96'>
				<LineChart data={chartData} margin={{ top: 20, right: 15, left: 20, bottom: 40 }}>
					<CartesianGrid strokeDasharray='3 3' />
					<XAxis 
						dataKey='season' 
						tick={{ fontSize: 11 }}
						angle={-45}
						textAnchor="end"
						height={50}
					/>
					<YAxis 
						domain={[0, 100]} 
						tick={{ fontSize: 11 }}
						width={50}
					/>
					<ChartTooltip 
						content={
							<ChartTooltipContent 
								formatter={(value, name) => {
									const getScoreColor = (score: number | null) => {
										if (!score) return 'text-muted-foreground';
										if (score >= 70) return 'text-green-600 dark:text-green-400';
										if (score >= 50) return 'text-blue-600 dark:text-blue-400';
										return 'text-yellow-600 dark:text-yellow-400';
									};
									
									return [
										<span key="value" className={getScoreColor(value as number)}>
											{value !== null ? (value as number).toFixed(1) : 'N/A'}
										</span>,
										name
									];
								}}
								labelFormatter={(label) => {
									return `${label} Season`;
								}}
							/>
						}
					/>
					<Legend />
					<Line 
						type='monotone' 
						dataKey='aggression' 
						stroke='var(--color-aggression)'
						strokeWidth={2} 
						dot={{ r: 4 }} 
						activeDot={{ r: 6 }} 
					/>
					<Line 
						type='monotone' 
						dataKey='consistency' 
						stroke='var(--color-consistency)'
						strokeWidth={2} 
						dot={{ r: 4 }} 
						activeDot={{ r: 6 }} 
					/>
					<Line 
						type='monotone' 
						dataKey='racecraft' 
						stroke='var(--color-racecraft)'
						strokeWidth={2} 
						dot={{ r: 4 }} 
						activeDot={{ r: 6 }} 
					/>
					<Line 
						type='monotone' 
						dataKey='pressure_performance' 
						stroke='var(--color-pressure_performance)'
						strokeWidth={2} 
						dot={{ r: 4 }} 
						activeDot={{ r: 6 }} 
					/>
					<Line 
						type='monotone' 
						dataKey='race_start' 
						stroke='var(--color-race_start)'
						strokeWidth={2} 
						dot={{ r: 4 }} 
						activeDot={{ r: 6 }} 
					/>
				</LineChart>
			</ChartContainer>
		</div>
	);
}
