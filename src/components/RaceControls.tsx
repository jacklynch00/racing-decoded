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
	lapProgress?: number;
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
	lapProgress = 0,
}: RaceControlsProps) {
	const [speed, setSpeed] = useState(1);

	const handleSpeedChange = (newSpeed: number[]) => {
		const speedValue = newSpeed[0];
		setSpeed(speedValue);
		onSpeedChange(speedValue);
	};

	const getSpeedLabel = (speed: number): string => {
		if (speed <= 1) return 'Normal';
		if (speed <= 2) return 'Fast';
		if (speed <= 4) return 'Very Fast';
		return 'Ultra Fast';
	};

	const getOverallProgressPercentage = (): number => {
		if (totalLaps === 0) return 0;
		// Calculate overall progress including current lap progress
		const completedLaps = Math.max(0, currentLap - 1);
		const currentLapProgress = lapProgress || 0;
		const progress = ((completedLaps + currentLapProgress) / totalLaps) * 100;
		// Ensure progress is between 0 and 100
		return Math.min(100, Math.max(0, progress));
	};

	const formatTime = (seconds: number | null): string => {
		if (!seconds) return 'N/A';
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toFixed(3).padStart(6, '0')}`;
	};

	return (
		<Card className='h-fit'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
					<Gauge className='h-4 w-4 sm:h-5 sm:w-5' />
					Race Controls
				</CardTitle>
				<CardDescription className='text-sm'>Control the race animation speed and playback</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4 sm:space-y-6'>
				{/* Main Control Buttons */}
				<div className='space-y-3'>
					{/* Mobile: Full-width stacked buttons */}
					<div className='flex flex-col gap-2'>
						<Button onClick={onStart} disabled={isAnimating && !isPaused} size='default' className='w-full justify-center py-3'>
							<Play className='mr-2 h-4 w-4' />
							{isPaused ? 'Resume Race' : 'Start Race'}
						</Button>

						<div className='flex gap-2'>
							<Button onClick={onPause} disabled={!isAnimating} variant='outline' size='default' className='flex-1 justify-center py-3'>
								<Pause className='mr-2 h-4 w-4' />
								Pause
							</Button>

							<Button onClick={onReset} variant='outline' size='default' className='flex-1 justify-center py-3'>
								<RotateCcw className='mr-2 h-4 w-4' />
								Reset
							</Button>
						</div>
					</div>

					{/* Mobile: Animation Status */}
					<div className='flex sm:hidden justify-center'>
						<Badge variant={isAnimating ? 'default' : 'secondary'} className='text-sm'>
							{isAnimating ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}
						</Badge>
					</div>
				</div>

				{/* Progress Bar */}
				<div className='space-y-2'>
					<div className='flex justify-between items-center text-xs sm:text-sm'>
						<span className='text-muted-foreground'>Race Progress</span>
						<span className='font-mono'>
							{currentLap} / {totalLaps} laps
						</span>
					</div>
					<div className='w-full bg-muted rounded-full h-2'>
						<div className='bg-primary h-2 rounded-full transition-all duration-300' style={{ width: `${getOverallProgressPercentage()}%` }} />
					</div>
					<div className='flex justify-between text-xs text-muted-foreground'>
						<span>Start</span>
						<span className='hidden sm:inline'>{getOverallProgressPercentage().toFixed(1)}% Complete</span>
						<span className='sm:hidden'>{getOverallProgressPercentage().toFixed(0)}%</span>
						<span>Finish</span>
					</div>
				</div>

				{/* Speed Control */}
				<div className='space-y-2 sm:space-y-3'>
					<div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2'>
						<div className='flex items-center gap-2'>
							<Zap className='h-3 w-3 sm:h-4 sm:w-4' />
							<span className='font-medium text-sm sm:text-base'>Animation Speed</span>
						</div>
						<Badge variant='outline' className='text-xs w-fit'>
							{speed}x <span className='hidden sm:inline'>{getSpeedLabel(speed)}</span>
						</Badge>
					</div>

					<Slider value={[speed]} onValueChange={handleSpeedChange} min={1} max={6} step={1} className='w-full' />

					<div className='flex justify-between text-xs text-muted-foreground'>
						<span>1x</span>
						<span className='hidden sm:inline'>2x</span>
						<span className='hidden sm:inline'>3x</span>
						<span className='hidden sm:inline'>4x</span>
						<span className='hidden sm:inline'>5x</span>
						<span>6x</span>
					</div>
				</div>

				{/* Live Statistics */}
				<div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t'>
					<div className='text-center'>
						<div className='flex items-center justify-center gap-1 text-xs sm:text-sm text-muted-foreground mb-1'>
							<Timer className='h-3 w-3' />
							<span className='hidden sm:inline'>Current Lap Time</span>
							<span className='sm:hidden'>Current</span>
						</div>
						<div className='font-mono text-sm sm:text-lg font-bold'>{formatTime(currentLapTime)}</div>
					</div>

					<div className='text-center'>
						<div className='flex items-center justify-center gap-1 text-xs sm:text-sm text-muted-foreground mb-1'>
							<Gauge className='h-3 w-3' />
							<span className='hidden sm:inline'>Average Lap Time</span>
							<span className='sm:hidden'>Average</span>
						</div>
						<div className='font-mono text-sm sm:text-lg font-bold'>{formatTime(averageLapTime)}</div>
					</div>

					<div className='text-center'>
						<div className='flex items-center justify-center gap-1 text-xs sm:text-sm text-muted-foreground mb-1'>
							<Flag className='h-3 w-3' />
							Pit Stops
						</div>
						<div className='font-mono text-sm sm:text-lg font-bold'>{hasPitStops ? 'Yes' : 'None'}</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
