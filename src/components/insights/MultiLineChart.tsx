'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

const TRAIT_COLORS = {
	aggression: '#ff6b6b',
	consistency: '#4ecdc4',
	racecraft: '#45b7d1',
	pressurePerformance: '#96ceb4',
	raceStart: '#ffeaa7',
	clutchFactor: '#dda0dd'
};

function CustomTooltip({ active, payload, label }: any) {
	if (active && payload && payload.length) {
		return (
			<div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
				<p className="font-medium text-popover-foreground mb-2">{label}</p>
				<div className="space-y-1">
					{payload.map((entry: any, index: number) => (
						<p key={index} className="text-sm" style={{ color: entry.color }}>
							<span className="font-medium">{entry.name}: </span>
							<span>{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
						</p>
					))}
				</div>
			</div>
		);
	}
	return null;
}

export function MultiLineChart({
	data,
	title,
	description,
	xAxisLabel,
	yAxisLabel,
	lines,
	className
}: MultiLineChartProps) {
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description && <p className="text-muted-foreground text-sm">{description}</p>}
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={400}>
					<LineChart data={data} margin={{ top: 20, right: 30, left: 60, bottom: 60 }}>
						<CartesianGrid strokeDasharray="3 3" className="opacity-30" />
						<XAxis 
							dataKey="era"
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
						<Legend />
						
						{lines.map((line) => (
							<Line
								key={line.key}
								type="monotone"
								dataKey={line.key}
								stroke={line.color}
								strokeWidth={2}
								dot={{ r: 4 }}
								activeDot={{ r: 6 }}
								name={line.label}
							/>
						))}
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}