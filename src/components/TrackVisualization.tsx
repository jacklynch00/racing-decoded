'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimationData } from '@/utils/trackAnimation';
import { CanvasF1Animator, initializeCanvasAnimator } from '@/utils/canvasTrackAnimator';
import { MONACO_TRACK } from '@/utils/trackLayouts';
import { RaceControls } from './RaceControls';

interface TrackVisualizationProps {
	raceId: number;
	driverId: number;
}

export function TrackVisualization({ raceId, driverId }: TrackVisualizationProps) {
	const [animationData, setAnimationData] = useState<AnimationData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentLap, setCurrentLap] = useState(0);
	const [totalLaps, setTotalLaps] = useState(0);
	const [currentLapTime, setCurrentLapTime] = useState<number | null>(null);
	const [lapProgress, setLapProgress] = useState(0);
	const [isAnimating, setIsAnimating] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [showPitStop, setShowPitStop] = useState(false);
	const [pitStopDuration, setPitStopDuration] = useState(0);

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animatorRef = useRef<CanvasF1Animator | null>(null);
	const [trackInitialized, setTrackInitialized] = useState(false);

	// Load animation data when props change
	useEffect(() => {
		const loadAnimationData = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await fetch(`/api/track-animation/lap-data?raceId=${raceId}&driverId=${driverId}`);
				if (!response.ok) {
					throw new Error('Failed to load race data');
				}

				const data: AnimationData = await response.json();
				setAnimationData(data);

				// Load data into Canvas animator if initialized
				if (animatorRef.current) {
					animatorRef.current.loadAnimationData(data);
				}

				// Initialize lap counter
				setTotalLaps(data.animationData.totalLaps);
				setCurrentLap(0);
			} catch (err) {
				console.error('Error loading animation data:', err);
				setError(err instanceof Error ? err.message : 'Failed to load race data');
			} finally {
				setLoading(false);
			}
		};

		if (raceId && driverId) {
			loadAnimationData();
		}
	}, [raceId, driverId]);

	// Initialize Canvas when component mounts
	useEffect(() => {
		console.log('TrackVisualization: Canvas effect triggered', {
			hasCanvas: !!canvasRef.current,
			trackInitialized,
			hasAnimationData: !!animationData,
		});

		if (canvasRef.current && !trackInitialized) {
			try {
				console.log('TrackVisualization: Initializing Canvas animator...');
				animatorRef.current = initializeCanvasAnimator(canvasRef.current, MONACO_TRACK);
				setTrackInitialized(true);

				// Load data if already available
				if (animationData) {
					animatorRef.current.loadAnimationData(animationData);
				}

				console.log('TrackVisualization: Canvas animator initialized successfully');
			} catch (err) {
				console.error('TrackVisualization: Failed to initialize Canvas animator:', err);
				setError(`Failed to initialize track animation: ${err instanceof Error ? err.message : 'Unknown error'}`);
			}
		}
	}, [animationData, trackInitialized]);

	// Additional effect to try initializing when canvas ref becomes available
	useEffect(() => {
		if (canvasRef.current && !trackInitialized && !animatorRef.current) {
			const timer = setTimeout(() => {
				try {
					console.log('TrackVisualization: Delayed Canvas initialization...');
					animatorRef.current = initializeCanvasAnimator(canvasRef.current!, MONACO_TRACK);
					setTrackInitialized(true);

					if (animationData) {
						animatorRef.current.loadAnimationData(animationData);
					}

					console.log('TrackVisualization: Delayed Canvas initialization successful');
				} catch (err) {
					console.error('TrackVisualization: Delayed Canvas initialization failed:', err);
					setError(`Failed to initialize track animation: ${err instanceof Error ? err.message : 'Unknown error'}`);
				}
			}, 100);

			return () => clearTimeout(timer);
		}
	}, [trackInitialized, animationData]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (animatorRef.current) {
				animatorRef.current.destroy();
			}
		};
	}, []);

	// Setup animation callbacks
	useEffect(() => {
		if (animatorRef.current) {
			animatorRef.current.setCallbacks({
				onLapUpdate: (lap, total, lapTime, progress = 0) => {
					setCurrentLap(lap);
					setTotalLaps(total);
					setCurrentLapTime(lapTime || null);
					setLapProgress(progress);
				},
				onPitStop: (lap, duration) => {
					setShowPitStop(true);
					setPitStopDuration(duration);
					// Hide pit stop notification after duration
					setTimeout(() => setShowPitStop(false), Math.min(duration * 1000, 3000));
				},
				onComplete: () => {
					setIsAnimating(false);
					setIsPaused(false);
				},
			});
		}
	}, [trackInitialized]);

	const handleStart = () => {
		if (!animatorRef.current) return;

		if (isPaused) {
			animatorRef.current.resume();
			setIsPaused(false);
		} else {
			animatorRef.current.start();
			setCurrentLap(1);
		}
		setIsAnimating(true);
	};

	const handlePause = () => {
		if (!animatorRef.current) return;

		animatorRef.current.pause();
		setIsAnimating(false);
		setIsPaused(true);
	};

	const handleReset = () => {
		if (!animatorRef.current) return;

		animatorRef.current.reset();
		setIsAnimating(false);
		setIsPaused(false);
		setCurrentLap(0);
		setCurrentLapTime(null);
		setLapProgress(0);
		setShowPitStop(false);
	};

	const handleSpeedChange = (speed: number) => {
		if (!animatorRef.current) return;

		animatorRef.current.setSpeed(speed);
	};

	if (loading) {
		return (
			<Card>
				<CardContent className='py-12'>
					<div className='text-center'>
						<p className='text-muted-foreground'>Loading race data...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent className='py-12'>
					<div className='text-center'>
						<p className='text-red-500'>{error}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!animationData) {
		return (
			<Card>
				<CardContent className='py-12'>
					<div className='text-center'>
						<p className='text-muted-foreground'>No race data available</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Race Information */}
			<Card>
				<CardHeader>
					<div className='flex justify-between items-start'>
						<div>
							<CardTitle>
								{animationData.raceInfo.raceName} {animationData.raceInfo.year}
							</CardTitle>
							<CardDescription>
								{animationData.driverInfo.name} • {animationData.raceInfo.circuitName}
							</CardDescription>
						</div>
						<div className='text-right'>
							<Badge variant='outline'>Grid: P{animationData.raceResult.gridPosition}</Badge>
							{animationData.raceResult.finishPosition && (
								<Badge variant='outline' className='ml-2'>
									Finish: P{animationData.raceResult.finishPosition}
								</Badge>
							)}
						</div>
					</div>
				</CardHeader>
			</Card>

			{/* Track Visualization */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center justify-between'>
						<span>Live Race Animation</span>
						<div className='flex items-center gap-4 text-sm'>
							{showPitStop && (
								<Badge variant='secondary' className='animate-pulse'>
									🏁 Pit Stop ({pitStopDuration.toFixed(1)}s)
								</Badge>
							)}
							<span className='text-muted-foreground'>
								Lap {currentLap} / {totalLaps}
							</span>
							{currentLapTime && <span className='font-mono text-muted-foreground'>{currentLapTime.toFixed(3)}s</span>}
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='flex gap-6 flex-wrap w-full'>
						{/* Track Container */}
						<div className=''>
							<div className='rounded-lg flex items-center justify-center relative' style={{ width: '100%', height: '500px' }}>
								<canvas
									ref={canvasRef}
									width={600}
									height={500}
									className='rounded-lg border border-gray-300'
									style={{
										width: '600px',
										height: '500px',
										display: trackInitialized ? 'block' : 'none',
									}}
								/>
								{!trackInitialized && <p className='text-white absolute inset-0 flex items-center justify-center'>Initializing track...</p>}
							</div>

							{/* Animation Status Overlay */}
							{trackInitialized && !animationData?.animationData.hasLapTimes && (
								<div className='absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center'>
									<Card className='max-w-md'>
										<CardContent className='py-6'>
											<p className='text-center text-muted-foreground'>No lap time data available for this race and driver combination.</p>
										</CardContent>
									</Card>
								</div>
							)}
						</div>

						{/* Race Controls */}
						<div className='min-w-fit'>
							{trackInitialized && animationData?.animationData.hasLapTimes && (
								<RaceControls
									onStart={handleStart}
									onPause={handlePause}
									onReset={handleReset}
									onSpeedChange={handleSpeedChange}
									isAnimating={isAnimating}
									isPaused={isPaused}
									currentLap={currentLap}
									totalLaps={totalLaps}
									currentLapTime={currentLapTime}
									averageLapTime={animationData.animationData.averageLapTime}
									hasPitStops={animationData.animationData.hasPitStops}
									lapProgress={lapProgress}
								/>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Race Statistics */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardContent className='py-4'>
						<div className='text-2xl font-bold'>{animationData.raceResult.totalLaps}</div>
						<p className='text-sm text-muted-foreground'>Total Laps</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='py-4'>
						<div className='text-2xl font-bold'>{animationData.raceResult.points}</div>
						<p className='text-sm text-muted-foreground'>Points Scored</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='py-4'>
						<div className='text-2xl font-bold'>{animationData.pitStops.length}</div>
						<p className='text-sm text-muted-foreground'>Pit Stops</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='py-4'>
						<div className='text-2xl font-bold'>{animationData.animationData.averageLapTime ? `${animationData.animationData.averageLapTime.toFixed(3)}s` : 'N/A'}</div>
						<p className='text-sm text-muted-foreground'>Average Lap Time</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
