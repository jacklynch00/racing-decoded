'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartLegend } from '@/components/ui/chart';

interface DataPoint {
	driverId: number;
	driverName: string;
	x: number;
	y: number;
	category?: string;
	[key: string]: string | number | undefined;
}

interface ScatterPlotChartProps {
	data: DataPoint[];
	title: string;
	description?: string;
	xAxisLabel: string;
	yAxisLabel: string;
	colorBy?: string;
	className?: string;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DataPoint }> }) {
	if (active && payload && payload.length) {
		const data = payload[0].payload;
		return (
			<div className='bg-background border border-border rounded-lg p-3 shadow-lg'>
				<p className='font-medium text-foreground mb-1'>{data.driverName}</p>
				<div className='space-y-1 text-sm'>
					{Object.entries(data).map(([key, value]) => {
						if (key === 'driverId' || key === 'driverName' || key === 'category') return null;
						const displayKey = key === 'x' ? 'X' : key === 'y' ? 'Y' : key;
						return (
							<div key={key} className='flex justify-between items-center gap-4'>
								<span className='text-muted-foreground capitalize'>{displayKey.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
								<span className='font-medium text-foreground'>{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
							</div>
						);
					})}
				</div>
			</div>
		);
	}
	return null;
}

export function ScatterPlotChart({ data, title, description, xAxisLabel, yAxisLabel, colorBy, className }: ScatterPlotChartProps) {
	// Group data by category if colorBy is specified
	const groupedData = colorBy
		? data.reduce((acc, item) => {
				const category = item[colorBy] || 'Unknown';
				if (!acc[category]) acc[category] = [];
				acc[category].push(item);
				return acc;
		  }, {} as Record<string, DataPoint[]>)
		: { 'All Drivers': data };

	// Create chart config for shadcn/ui chart system
	const chartConfig = Object.entries(groupedData).reduce((config, [category], index) => {
		config[category.toLowerCase().replace(/\s+/g, '-')] = {
			label: category,
			color: `var(--chart-${(index % 5) + 1})`,
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
					<ScatterChart data={data} margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
						<CartesianGrid strokeDasharray='3 3' />
						<XAxis
							type='number'
							dataKey='x'
							name={xAxisLabel}
							tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
							tickLine={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
							axisLine={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
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
							type='number'
							dataKey='y'
							name={yAxisLabel}
							tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
							tickLine={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
							axisLine={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
							width={60}
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
						{colorBy && <ChartLegend />}

						{Object.entries(groupedData).map(([category, categoryData]) => (
							<Scatter
								key={category}
								name={category}
								data={categoryData.map((item) => ({ ...item, x: item.x, y: item.y }))}
								fill={`var(--color-${category.toLowerCase().replace(/\s+/g, '-')})`}
								stroke={`var(--color-${category.toLowerCase().replace(/\s+/g, '-')})`}
								strokeWidth={1}
								fillOpacity={0.8}
							/>
						))}
					</ScatterChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
