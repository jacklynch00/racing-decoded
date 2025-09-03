'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
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

export function MultiLineChart({
	data,
	title,
	description,
	lines,
	className
}: Omit<MultiLineChartProps, 'xAxisLabel' | 'yAxisLabel'>) {
	// Create chart config from lines prop
	const chartConfig = lines.reduce((config: Record<string, { label: string; color: string }>, line, index) => {
		const chartColors = [
			'var(--chart-1)',
			'var(--chart-2)',
			'var(--chart-3)',
			'var(--chart-4)',
			'var(--chart-5)'
		];
		
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
				{description && <p className="text-muted-foreground text-sm">{description}</p>}
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="w-full h-[300px] sm:h-[400px]">
					<LineChart data={data} margin={{ top: 20, right: 15, left: 40, bottom: 60 }}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis 
							dataKey="era"
							tick={{ fontSize: 11 }}
							interval={0}
							angle={-45}
							textAnchor="end"
							height={60}
						/>
						<YAxis
							tick={{ fontSize: 11 }}
							width={50}
						/>
						<ChartTooltip 
							content={
								<ChartTooltipContent
									formatter={(value, name) => [
										typeof value === 'number' ? value.toFixed(1) : value,
										name
									]}
								/>
							}
						/>
						<ChartLegend content={<ChartLegendContent />} />
						
						{lines.map((line) => (
							<Line
								key={line.key}
								type="monotone"
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