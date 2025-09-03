'use client';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BarData {
	label: string;
	value: number;
	[key: string]: string | number;
}

interface BarChartProps {
	data: BarData[];
	title: string;
	description?: string;
	xAxisLabel: string;
	yAxisLabel: string;
	className?: string;
}

const chartConfig = {
	value: {
		label: 'Value',
		color: 'var(--chart-1)',
	},
};

export function BarChart({
	data,
	title,
	description,
	xAxisLabel,
	yAxisLabel,
	className
}: BarChartProps) {
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description && <p className="text-muted-foreground text-sm">{description}</p>}
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="w-full h-[300px] sm:h-[400px]">
					<RechartsBarChart data={data} margin={{ top: 20, right: 20, bottom: 70, left: 70 }}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis 
							dataKey="label"
							tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
							tickLine={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
							axisLine={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
							interval={0}
							angle={-45}
							textAnchor="end"
							height={60}
							tickMargin={8}
							label={{ 
								value: xAxisLabel, 
								position: 'insideBottom', 
								offset: -10,
								style: { 
									textAnchor: 'middle', 
									fontSize: '13px', 
									fill: 'hsl(var(--foreground))',
									fontWeight: 500
								} 
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
									fill: 'hsl(var(--foreground))',
									fontWeight: 500
								} 
							}}
						/>
						<ChartTooltip 
							content={
								<ChartTooltipContent
									formatter={(value, name) => [value, name]}
								/>
							}
						/>
						<Bar 
							dataKey="value" 
							fill='var(--color-value)'
							radius={[4, 4, 0, 0]}
						/>
					</RechartsBarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}