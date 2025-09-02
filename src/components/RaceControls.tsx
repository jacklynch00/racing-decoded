'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, Gauge, Timer, Flag, Zap } from 'lucide-react';

interface RaceControlsProps {
	onStart: () => void;
	onPause: () => void;
	onReset: () => void;
	onSpeedChange: (speed: number) => void;
	isAnimating: boolean;
	isPaused: boolean;
	currentLap: number;
	totalLaps: number;
	currentLapTime: number | null;
	averageLapTime: number | null;
	hasPitStops: boolean;
}

export function RaceControls({
	onStart,
	onPause,
	onReset,
	onSpeedChange,
	isAnimating,
	isPaused,
	currentLap,
	totalLaps,
	currentLapTime,
	averageLapTime,
	hasPitStops,
}: RaceControlsProps) {
	const [speed, setSpeed] = useState(1);

	const handleSpeedChange = (newSpeed: number[]) => {
		const speedValue = newSpeed[0];
		setSpeed(speedValue);
		onSpeedChange(speedValue);
	};

	const getSpeedLabel = (speed: number): string => {
		if (speed <= 0.5) return 'Very Slow';
		if (speed <= 1) return 'Normal';
		if (speed <= 2) return 'Fast';
		if (speed <= 4) return 'Very Fast';
		return 'Ultra Fast';
	};

	const getProgressPercentage = (): number => {
		if (totalLaps === 0) return 0;
		return (currentLap / totalLaps) * 100;
	};

	const formatTime = (seconds: number | null): string => {
		if (!seconds) return 'N/A';
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toFixed(3).padStart(6, '0')}`;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Gauge className='h-5 w-5' />
					Race Controls
				</CardTitle>
				<CardDescription>Control the race animation speed and playback</CardDescription>
			</CardHeader>
			<CardContent className='space-y-6'>
				{/* Main Control Buttons */}
				<div className='flex items-center gap-4'>
					<Button onClick={onStart} disabled={isAnimating && !isPaused} size='lg' className='min-w-[120px]'>
						<Play className='mr-2 h-4 w-4' />
						{isPaused ? 'Resume' : 'Start'}
					</Button>

					<Button onClick={onPause} disabled={!isAnimating} variant='outline' size='lg'>
						<Pause className='mr-2 h-4 w-4' />
						Pause
					</Button>

					<Button onClick={onReset} variant='outline' size='lg'>
						<RotateCcw className='mr-2 h-4 w-4' />
						Reset
					</Button>

					{/* Animation Status */}
					<div className='ml-auto'>
						<Badge variant={isAnimating ? 'default' : 'secondary'} className='text-sm'>
							{isAnimating ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}
						</Badge>
					</div>
				</div>

				{/* Progress Bar */}
				<div className='space-y-2'>
					<div className='flex justify-between items-center text-sm'>
						<span className='text-muted-foreground'>Race Progress</span>
						<span className='font-mono'>
							{currentLap} / {totalLaps} laps
						</span>
					</div>
					<div className='w-full bg-muted rounded-full h-2'>
						<div className='bg-primary h-2 rounded-full transition-all duration-300' style={{ width: `${getProgressPercentage()}%` }} />
					</div>
					<div className='flex justify-between text-xs text-muted-foreground'>
						<span>Start</span>
						<span>{getProgressPercentage().toFixed(1)}% Complete</span>
						<span>Finish</span>
					</div>
				</div>

				{/* Speed Control */}
				<div className='space-y-3'>
					<div className='flex justify-between items-center'>
						<div className='flex items-center gap-2'>
							<Zap className='h-4 w-4' />
							<span className='font-medium'>Animation Speed</span>
						</div>
						<Badge variant='outline'>
							{speed}x {getSpeedLabel(speed)}
						</Badge>
					</div>

					<Slider value={[speed]} onValueChange={handleSpeedChange} min={0.25} max={8} step={0.25} className='w-full' />

					<div className='flex justify-between text-xs text-muted-foreground'>
						<span>0.25x</span>
						<span>1x</span>
						<span>2x</span>
						<span>4x</span>
						<span>8x</span>
					</div>
				</div>

				{/* Live Statistics */}
				<div className='grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t'>
					<div className='text-center'>
						<div className='flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1'>
							<Timer className='h-3 w-3' />
							Current Lap Time
						</div>
						<div className='font-mono text-lg font-bold'>{formatTime(currentLapTime)}</div>
					</div>

					<div className='text-center'>
						<div className='flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1'>
							<Gauge className='h-3 w-3' />
							Average Lap Time
						</div>
						<div className='font-mono text-lg font-bold'>{formatTime(averageLapTime)}</div>
					</div>

					<div className='text-center'>
						<div className='flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1'>
							<Flag className='h-3 w-3' />
							Pit Stops
						</div>
						<div className='font-mono text-lg font-bold'>{hasPitStops ? 'Yes' : 'None'}</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
