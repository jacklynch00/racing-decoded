'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
			<div className="bg-background border border-border rounded-lg p-3 shadow-lg">
				<p className="font-medium text-foreground mb-1">{data.driverName}</p>
				<div className="space-y-1 text-sm">
					{Object.entries(data).map(([key, value]) => {
						if (key === 'driverId' || key === 'driverName' || key === 'category') return null;
						const displayKey = key === 'x' ? 'X Value' : key === 'y' ? 'Y Value' : key;
						return (
							<div key={key} className="flex justify-between items-center gap-4">
								<span className="text-muted-foreground capitalize">
									{displayKey.replace(/([A-Z])/g, ' $1').toLowerCase()}:
								</span>
								<span className="font-medium text-foreground">{String(value)}</span>
							</div>
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

	// Chart colors using the same CSS variables as bar and line charts
	const chartColors = [
		'var(--chart-1)',
		'var(--chart-2)',
		'var(--chart-3)',
		'var(--chart-4)',
		'var(--chart-5)'
	];

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description && <p className="text-muted-foreground text-sm">{description}</p>}
			</CardHeader>
			<CardContent>
				<div className="w-full h-[300px] sm:h-[400px]">
					<ResponsiveContainer width="100%" height="100%">
						<ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
							<CartesianGrid 
								strokeDasharray="2 2" 
								stroke="hsl(var(--border))"
								className="opacity-40"
								horizontal={true}
								vertical={true}
							/>
							<XAxis 
								type="number" 
								dataKey="x" 
								name={xAxisLabel}
								tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
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
										fill: 'hsl(var(--foreground))',
										fontWeight: 500
									} 
								}}
							/>
							<YAxis 
								type="number" 
								dataKey="y" 
								name={yAxisLabel}
								tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
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
										fill: 'hsl(var(--foreground))',
										fontWeight: 500
									} 
								}}
							/>
							<Tooltip content={<CustomTooltip />} />
							{colorBy && (
								<Legend 
									wrapperStyle={{ 
										paddingTop: '20px', 
										color: 'hsl(var(--foreground))'
									}}
								/>
							)}
							
							{Object.entries(groupedData).map(([category, categoryData], index) => (
								<Scatter
									key={category}
									name={category}
									data={categoryData.map(item => ({ ...item, x: item.x, y: item.y }))}
									fill={chartColors[index % chartColors.length]}
									stroke={chartColors[index % chartColors.length]}
									strokeWidth={1}
									fillOpacity={0.8}
								/>
							))}
						</ScatterChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}