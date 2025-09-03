'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataPoint {
	driverId: number;
	driverName: string;
	x: number;
	y: number;
	category?: string;
	[key: string]: any;
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

const THEME_COLORS = [
	'oklch(var(--chart-1))',
	'oklch(var(--chart-2))',
	'oklch(var(--chart-3))',
	'oklch(var(--chart-4))',
	'oklch(var(--chart-5))'
];

function CustomTooltip({ active, payload }: any) {
	if (active && payload && payload.length) {
		const data = payload[0].payload;
		return (
			<div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
				<p className="font-medium text-popover-foreground">{data.driverName}</p>
				<div className="space-y-1 mt-2">
					{Object.entries(data).map(([key, value]) => {
						if (key === 'driverId' || key === 'driverName' || key === 'category') return null;
						return (
							<p key={key} className="text-sm text-muted-foreground">
								<span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}: </span>
								<span className="font-medium">{value}</span>
							</p>
						);
					})}
				</div>
			</div>
		);
	}
	return null;
}

export function ScatterPlotChart({
	data,
	title,
	description,
	xAxisLabel,
	yAxisLabel,
	colorBy,
	className
}: ScatterPlotChartProps) {
	// Group data by category if colorBy is specified
	const groupedData = colorBy 
		? data.reduce((acc, item) => {
				const category = item[colorBy] || 'Unknown';
				if (!acc[category]) acc[category] = [];
				acc[category].push(item);
				return acc;
			}, {} as Record<string, DataPoint[]>)
		: { 'All Drivers': data };

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description && <p className="text-muted-foreground text-sm">{description}</p>}
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={400}>
					<ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
						<CartesianGrid strokeDasharray="3 3" className="opacity-30" />
						<XAxis 
							type="number" 
							dataKey="x" 
							name={xAxisLabel}
							label={{ value: xAxisLabel, position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' } }}
							tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
							tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
							axisLine={{ stroke: 'hsl(var(--border))' }}
						/>
						<YAxis 
							type="number" 
							dataKey="y" 
							name={yAxisLabel}
							label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' } }}
							tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
							tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
							axisLine={{ stroke: 'hsl(var(--border))' }}
						/>
						<Tooltip content={<CustomTooltip />} />
						{colorBy && <Legend />}
						
						{Object.entries(groupedData).map(([category, categoryData], index) => (
							<Scatter
								key={category}
								name={category}
								data={categoryData.map(item => ({ ...item, x: item.x, y: item.y }))}
								fill={THEME_COLORS[index % THEME_COLORS.length]}
							/>
						))}
					</ScatterChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}