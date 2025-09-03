'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HeatmapData {
	row: string;
	column: string;
	value: number;
	displayValue?: string;
}

interface HeatmapChartProps {
	data: HeatmapData[];
	title: string;
	description?: string;
	rowLabel: string;
	columnLabel: string;
	className?: string;
	minValue?: number;
	maxValue?: number;
}

export function HeatmapChart({
	data,
	title,
	description,
	rowLabel,
	columnLabel,
	className,
	minValue,
	maxValue
}: HeatmapChartProps) {
	// Get unique rows and columns
	const rows = [...new Set(data.map(d => d.row))];
	const columns = [...new Set(data.map(d => d.column))];

	// Calculate value range for color scaling
	const values = data.map(d => d.value);
	const min = minValue ?? Math.min(...values);
	const max = maxValue ?? Math.max(...values);

	// Create a lookup map for quick access
	const dataMap = new Map(data.map(d => [`${d.row}-${d.column}`, d]));

	// Color scale function
	const getColor = (value: number) => {
		if (value === 0) return 'bg-muted/20';
		
		const normalized = (value - min) / (max - min);
		
		if (normalized >= 0.8) return 'bg-green-500/90';
		if (normalized >= 0.6) return 'bg-green-400/80';
		if (normalized >= 0.4) return 'bg-yellow-400/70';
		if (normalized >= 0.2) return 'bg-orange-400/70';
		return 'bg-red-400/70';
	};

	const getTextColor = (value: number) => {
		const normalized = (value - min) / (max - min);
		return normalized > 0.5 ? 'text-white' : 'text-foreground';
	};

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description && <p className="text-muted-foreground text-sm">{description}</p>}
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{/* Legend */}
					<div className="flex items-center justify-between text-sm text-muted-foreground">
						<span>Lower correlation</span>
						<div className="flex items-center gap-1">
							<div className="w-4 h-4 bg-red-400/70 rounded"></div>
							<div className="w-4 h-4 bg-orange-400/70 rounded"></div>
							<div className="w-4 h-4 bg-yellow-400/70 rounded"></div>
							<div className="w-4 h-4 bg-green-400/80 rounded"></div>
							<div className="w-4 h-4 bg-green-500/90 rounded"></div>
						</div>
						<span>Higher correlation</span>
					</div>

					{/* Heatmap grid */}
					<div className="overflow-x-auto">
						<div className="min-w-fit">
							{/* Column headers */}
							<div className="grid gap-1 mb-2" style={{ gridTemplateColumns: `120px repeat(${columns.length}, 80px)` }}>
								<div className="text-sm font-medium text-muted-foreground"></div>
								{columns.map(column => (
									<div key={column} className="text-xs font-medium text-center text-muted-foreground p-2">
										{column}
									</div>
								))}
							</div>

							{/* Data rows */}
							{rows.map(row => (
								<div key={row} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `120px repeat(${columns.length}, 80px)` }}>
									{/* Row header */}
									<div className="text-sm font-medium text-muted-foreground p-2 text-right">
										{row}
									</div>

									{/* Data cells */}
									{columns.map(column => {
										const cellData = dataMap.get(`${row}-${column}`);
										const value = cellData?.value ?? 0;
										const displayValue = cellData?.displayValue ?? value.toFixed(2);

										return (
											<div
												key={column}
												className={`
													h-12 flex items-center justify-center text-xs font-medium rounded
													transition-all hover:scale-105 cursor-default
													${getColor(value)} ${getTextColor(value)}
												`}
												title={`${row} × ${column}: ${displayValue}`}
											>
												{displayValue}
											</div>
										);
									})}
								</div>
							))}
						</div>
					</div>

					{/* Axis labels */}
					<div className="flex justify-between items-end text-sm text-muted-foreground mt-4">
						<div className="transform -rotate-90 origin-center absolute left-4 top-1/2 -translate-y-1/2">
							{rowLabel}
						</div>
						<div className="text-center flex-1">
							{columnLabel}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}