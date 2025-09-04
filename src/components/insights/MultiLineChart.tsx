'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataPoint {
	era: string;
	[key: string]: string | number;
}

interface MultiLineChartProps {
	data: DataPoint[];
	title: string;
	description?: string;
	xAxisLabel: string;
	yAxisLabel: string;
	lines: Array<{
		key: string;
		label: string;
		color: string;
	}>;
	className?: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
	if (active && payload && payload.length) {
		return (
			<div className='bg-background border border-border rounded-lg p-3 shadow-lg'>
				<p className='font-medium text-foreground mb-2'>{label}</p>
				<div className='space-y-1'>
					{payload.map((entry, index) => (
						<div key={index} className='flex justify-between items-center gap-4'>
							<div className='flex items-center gap-2'>
								<div className='w-3 h-3 rounded-full' style={{ backgroundColor: entry.color }} />
								<span className='text-sm text-muted-foreground'>{entry.name}:</span>
							</div>
							<span className='text-sm font-medium text-foreground'>{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}</span>
						</div>
					))}
				</div>
			</div>
		);
	}
	return null;
}

export function MultiLineChart({ data, title, description, xAxisLabel, yAxisLabel, lines, className }: MultiLineChartProps) {
	// Create chart config from lines prop
	const chartConfig = lines.reduce((config: Record<string, { label: string; color: string }>, line, index) => {
		const chartColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

		config[line.key] = {
			label: line.label,
			color: chartColors[index % chartColors.length],
		};
		return config;
	}, {} as Record<string, { label: string; color: string }>);

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description && <p className='text-muted-foreground text-sm'>{description}</p>}
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className='w-full h-[300px] sm:h-[400px]'>
					<LineChart data={data} margin={{ top: 20, right: 15, left: 40, bottom: 60 }}>
						<CartesianGrid strokeDasharray='3 3' />
						<XAxis
							dataKey='era'
							tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
							tickLine={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
							axisLine={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
							interval={0}
							angle={-45}
							textAnchor='end'
							height={60}
							tickMargin={8}
							label={{
								value: xAxisLabel,
								position: 'insideBottom',
								offset: -10,
								style: {
									textAnchor: 'middle',
									fontSize: '13px',
									fill: 'var(--foreground)',
									fontWeight: 500,
								},
							}}
						/>
						<YAxis
							tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
							tickLine={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
							axisLine={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
							width={70}
							tickMargin={8}
							label={{
								value: yAxisLabel,
								angle: -90,
								position: 'insideLeft',
								style: {
									textAnchor: 'middle',
									fontSize: '13px',
									fill: 'var(--foreground)',
									fontWeight: 500,
								},
							}}
						/>
						<ChartTooltip content={<CustomTooltip />} />
						<ChartLegend content={<ChartLegendContent />} />

						{lines.map((line) => (
							<Line
								key={line.key}
								type='monotone'
								dataKey={line.key}
								stroke={`var(--color-${line.key})`}
								strokeWidth={2}
								dot={{ r: 4 }}
								activeDot={{ r: 6 }}
								name={line.label}
							/>
						))}
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
