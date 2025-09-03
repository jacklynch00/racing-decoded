'use client';

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BarData {
	label: string;
	value: number;
	[key: string]: any;
}

interface BarChartProps {
	data: BarData[];
	title: string;
	description?: string;
	xAxisLabel: string;
	yAxisLabel: string;
	className?: string;
}

function CustomTooltip({ active, payload, label }: any) {
	if (active && payload && payload.length) {
		const data = payload[0].payload;
		return (
			<div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
				<p className="font-medium text-popover-foreground">{label}</p>
				<div className="space-y-1 mt-2">
					{Object.entries(data).map(([key, value]) => {
						if (key === 'label') return null;
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
				<ResponsiveContainer width="100%" height={400}>
					<RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 60, bottom: 60 }}>
						<CartesianGrid strokeDasharray="3 3" className="opacity-30" />
						<XAxis 
							dataKey="label"
							label={{ value: xAxisLabel, position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' } }}
							tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
							tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
							axisLine={{ stroke: 'hsl(var(--border))' }}
						/>
						<YAxis
							label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' } }}
							tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
							tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
							axisLine={{ stroke: 'hsl(var(--border))' }}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Bar 
							dataKey="value" 
							fill="oklch(var(--chart-1))"
							radius={[4, 4, 0, 0]}
						/>
					</RechartsBarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}