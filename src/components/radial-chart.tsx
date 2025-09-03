'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

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
		<div className='w-full h-80'>
			<ResponsiveContainer width='100%' height='100%'>
				<RadarChart cx='50%' cy='50%' outerRadius='65%' data={chartData}>
					<PolarGrid />
					<PolarAngleAxis dataKey='trait' />
					<PolarRadiusAxis angle={90} domain={[0, 100]} />
					<Tooltip
						formatter={(value: number) => [`${value.toFixed(1)}`, 'Score']}
						labelFormatter={(label) => `${label}`}
						content={({ active, payload }) => {
							if (active && payload && payload.length) {
								const data = payload[0].payload;
								const getScoreColor = (score: number) => {
									if (score >= 70) return 'text-green-600 dark:text-green-400';
									if (score >= 50) return 'text-blue-600 dark:text-blue-400';
									return 'text-yellow-600 dark:text-yellow-400';
								};

								return (
									<div className="bg-popover border border-border rounded-lg p-3 shadow-lg max-w-xs">
										<p className="font-medium text-popover-foreground mb-1">{data.trait}</p>
										<p className={`text-lg font-bold mb-2 ${getScoreColor(data.score)}`}>{data.score?.toFixed(1)}</p>
										<p className="text-sm text-muted-foreground leading-tight">{data.description}</p>
									</div>
								);
							}
							return null;
						}}
					/>
					<Radar name={driverName} dataKey='score' stroke='#8884d8' fill='#8884d8' fillOpacity={0.6} />
				</RadarChart>
			</ResponsiveContainer>
		</div>
	);
}
