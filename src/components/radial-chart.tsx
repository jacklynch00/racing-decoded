'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface RadialChartProps {
	data: {
		aggressionScore: number | null;
		consistencyScore: number | null;
		racecraftScore: number | null;
		pressurePerformanceScore: number | null;
		clutchFactorScore: number | null;
		raceStartScore?: number | null;
	};
	driverName: string;
}

const chartConfig = {
	score: {
		label: 'Score',
		color: 'var(--chart-1)',
	},
};

export function RadialChart({ data, driverName }: RadialChartProps) {
	// Transform data for radar chart - each trait is a separate data point
	const radarData = [
		{
			trait: 'Aggression',
			score: data.aggressionScore || 0,
			fullMark: 100,
			description: 'Racing aggression and overtaking tendency',
		},
		{
			trait: 'Consistency',
			score: data.consistencyScore || 0,
			fullMark: 100,
			description: 'Reliability and consistent performance',
		},
		{
			trait: 'Racecraft',
			score: data.racecraftScore || 0,
			fullMark: 100,
			description: 'Wheel-to-wheel racing skill',
		},
		{
			trait: 'Pressure Performance',
			score: data.pressurePerformanceScore || 0,
			fullMark: 100,
			description: 'Performance under pressure',
		},
		{
			trait: 'Race Start',
			score: data.raceStartScore || 0,
			fullMark: 100,
			description: 'First lap position change performance',
		},
	];

	const chartData = radarData;

	return (
		<ChartContainer config={chartConfig} className='w-full h-64 sm:h-80'>
			<RadarChart cx='50%' cy='50%' outerRadius='65%' data={chartData}>
				<PolarGrid />
				<PolarAngleAxis dataKey='trait' />
				<PolarRadiusAxis angle={90} domain={[0, 100]} />
				<ChartTooltip
					content={
						<ChartTooltipContent
							formatter={(value, name, payload) => {
								const getScoreColor = (score: number) => {
									if (score >= 70) return 'text-green-600 dark:text-green-400';
									if (score >= 50) return 'text-blue-600 dark:text-blue-400';
									return 'text-yellow-600 dark:text-yellow-400';
								};
								
								return [
									<span key="value" className={getScoreColor(value as number)}>
										{(value as number)?.toFixed(1)}
									</span>,
									payload?.payload?.trait
								];
							}}
							labelFormatter={(label, payload) => {
								const data = payload?.[0]?.payload;
								return (
									<div className="space-y-1">
										<p className="font-medium">{data?.trait}</p>
										<p className="text-sm text-muted-foreground leading-tight">{data?.description}</p>
									</div>
								);
							}}
						/>
					}
				/>
				<Radar 
					name={driverName} 
					dataKey='score' 
					stroke='var(--color-score)'
					fill='var(--color-score)'
					fillOpacity={0.6} 
				/>
			</RadarChart>
		</ChartContainer>
	);
}
