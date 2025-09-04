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

			// Reset all animation state
			setIsAnimating(false);
			setIsPaused(false);
			setCurrentLap(0);
			setCurrentLapTime(null);
			setLapProgress(0);
			setShowPitStop(false);

			try {
				const response = await fetch(`/api/track-animation/lap-data?raceId=${raceId}&driverId=${driverId}`);
				if (!response.ok) {
					throw new Error('Failed to load race data');
				}

				const data: AnimationData = await response.json();
				setAnimationData(data);

				// Don't reset here - let the separate effect handle loading data into canvas

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
		console.log('TrackVisualization: Canvas initialization effect triggered', {
			hasCanvas: !!canvasRef.current,
			trackInitialized,
		});

		const initializeCanvas = () => {
			if (!canvasRef.current) {
				console.log('TrackVisualization: Canvas ref not available, trying again in 100ms');
				setTimeout(initializeCanvas, 100);
				return;
			}

			if (trackInitialized) {
				console.log('TrackVisualization: Already initialized');
				return;
			}

			try {
				console.log('TrackVisualization: Initializing Canvas animator...');
				animatorRef.current = initializeCanvasAnimator(canvasRef.current, MONACO_TRACK);
				setTrackInitialized(true);
				console.log('TrackVisualization: Canvas animator initialized successfully');
			} catch (err) {
				console.error('TrackVisualization: Failed to initialize Canvas animator:', err);
				setError(`Failed to initialize track animation: ${err instanceof Error ? err.message : 'Unknown error'}`);
			}
		};

		// Start initialization process
		initializeCanvas();
		
	}, []); // Only run once on mount

	// Load animation data into initialized canvas
	useEffect(() => {
		if (animatorRef.current && trackInitialized && animationData) {
			console.log('TrackVisualization: Loading animation data into initialized canvas');
			try {
				// Load new data without clearing the track
				animatorRef.current.loadAnimationDataWithoutReset(animationData);
			} catch (err) {
				console.error('TrackVisualization: Failed to load animation data:', err);
			}
		}
	}, [animationData, trackInitialized]);

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

	// Don't return early for loading - show loading overlay instead to keep track visible

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

	// Show track even without data - it will show a loading or no data overlay

	return (
		<div className='space-y-4 sm:space-y-6'>
			{/* Race Information */}
			{animationData && (
				<Card>
					<CardHeader>
						<div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4'>
							<div className='flex-1'>
								<CardTitle className='text-lg sm:text-xl'>
									{animationData.raceInfo.raceName} {animationData.raceInfo.year}
								</CardTitle>
								<CardDescription className='text-sm sm:text-base'>
									{animationData.driverInfo.name} • {animationData.raceInfo.circuitName}
								</CardDescription>
							</div>
							<div className='flex gap-2'>
								<Badge variant='outline' className='text-xs'>
									Grid: P{animationData.raceResult.gridPosition}
								</Badge>
								{animationData.raceResult.finishPosition && (
									<Badge variant='outline' className='text-xs'>
										Finish: P{animationData.raceResult.finishPosition}
									</Badge>
								)}
							</div>
						</div>
					</CardHeader>
				</Card>
			)}

			{/* Track Visualization */}
			<Card>
				<CardHeader>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
						<CardTitle className='text-lg sm:text-xl'>Live Race Animation</CardTitle>
						<div className='flex flex-wrap items-center gap-2 text-sm'>
							{showPitStop && (
								<Badge variant='secondary' className='animate-pulse text-xs'>
									🏁 Pit Stop ({pitStopDuration.toFixed(1)}s)
								</Badge>
							)}
							<span className='text-muted-foreground text-xs sm:text-sm'>
								Lap {currentLap} / {totalLaps}
							</span>
							{currentLapTime && <span className='font-mono text-muted-foreground text-xs sm:text-sm'>{currentLapTime.toFixed(3)}s</span>}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className='flex flex-col lg:flex-row gap-4 lg:gap-6'>
						{/* Track Container */}
						<div className='flex-1 flex justify-center'>
							<div className='rounded-lg flex items-center justify-center relative w-full max-w-[400px] sm:max-w-[500px] lg:max-w-[600px]' style={{ aspectRatio: '6/5' }}>
								<canvas
									ref={canvasRef}
									width={600}
									height={500}
									className='w-full h-full'
									style={{
										maxWidth: '100%',
										maxHeight: '100%',
										display: 'block',
									}}
								/>
								{!trackInitialized && (
									<div className='absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg'>
										<p className='text-muted-foreground'>Initializing track...</p>
									</div>
								)}
								{loading && trackInitialized && (
									<div className='absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg'>
										<p className='text-muted-foreground'>Loading driver data...</p>
									</div>
								)}
								{!loading && trackInitialized && !animationData && (
									<div className='absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg'>
										<p className='text-muted-foreground'>Select driver to load data...</p>
									</div>
								)}
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
						<div className='lg:min-w-[350px] lg:max-w-[400px]'>
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
			{animationData && (
				<div className='grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardContent className='py-3 sm:py-4'>
						<div className='text-xl sm:text-2xl font-bold'>{animationData.raceResult.totalLaps}</div>
						<p className='text-xs sm:text-sm text-muted-foreground'>Total Laps</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='py-3 sm:py-4'>
						<div className='text-xl sm:text-2xl font-bold'>{animationData.raceResult.points}</div>
						<p className='text-xs sm:text-sm text-muted-foreground'>Points Scored</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='py-3 sm:py-4'>
						<div className='text-xl sm:text-2xl font-bold'>{animationData.pitStops.length}</div>
						<p className='text-xs sm:text-sm text-muted-foreground'>Pit Stops</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='py-3 sm:py-4'>
						<div className='text-xl sm:text-2xl font-bold'>
							{animationData.animationData.averageLapTime ? `${animationData.animationData.averageLapTime.toFixed(3)}s` : 'N/A'}
						</div>
						<p className='text-xs sm:text-sm text-muted-foreground'>Average Lap Time</p>
					</CardContent>
				</Card>
			</div>
			)}
		</div>
	);
}
