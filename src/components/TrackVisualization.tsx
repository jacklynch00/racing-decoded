'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trackAnimator, AnimationData } from '@/utils/trackAnimation';
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
	const [isAnimating, setIsAnimating] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [showPitStop, setShowPitStop] = useState(false);
	const [pitStopDuration, setPitStopDuration] = useState(0);

	const trackContainerRef = useRef<HTMLDivElement>(null);
	const [trackLoaded, setTrackLoaded] = useState(false);
	const [svgContent, setSvgContent] = useState<string>('');

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
				trackAnimator.loadAnimationData(data);

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

	// Load track when component first renders with animation data
	useEffect(() => {
		if (animationData && !trackLoaded) {
			console.log('TrackVisualization: Animation data available, loading track...');
			const timer = setTimeout(() => {
				loadTrack();
			}, 100);

			return () => clearTimeout(timer);
		}
	}, [animationData, trackLoaded]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			trackAnimator.pause();
		};
	}, []);

	// Setup animation callbacks
	useEffect(() => {
		trackAnimator.setCallbacks({
			onLapUpdate: (lap, total, lapTime) => {
				setCurrentLap(lap);
				setTotalLaps(total);
				setCurrentLapTime(lapTime || null);
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
	}, []);

	const loadTrack = async () => {
		try {
			if (trackContainerRef.current) {
				const rawSvgContent = await trackAnimator.loadTrack(trackContainerRef.current);

				// Scale down SVG to fit container
				const modifiedSvgContent = rawSvgContent
					.replace(/width="1014"/, 'width="280px"')
					.replace(/height="1297"/, 'height="358px"')
					.replace('<svg', '<svg viewBox="0 0 1014 1297" preserveAspectRatio="xMidYMid meet"');

				setSvgContent(modifiedSvgContent);
			}
		} catch (err) {
			console.error('TrackVisualization: Failed to load track:', err);
			setError(`Failed to load track visualization: ${err instanceof Error ? err.message : 'Unknown error'}`);
		}
	};

	// Initialize track after SVG content is rendered
	useEffect(() => {
		if (svgContent && trackContainerRef.current && !trackLoaded) {
			const timer = setTimeout(() => {
				try {
					trackAnimator.initializeTrack(trackContainerRef.current!);
					setTrackLoaded(true);
				} catch (err) {
					console.error('TrackVisualization: Failed to initialize track:', err);
					setError(`Failed to initialize track: ${err instanceof Error ? err.message : 'Unknown error'}`);
				}
			}, 200);

			return () => clearTimeout(timer);
		}
	}, [svgContent, trackLoaded]);

	const handleStart = () => {
		if (isPaused) {
			trackAnimator.resume();
			setIsPaused(false);
		} else {
			trackAnimator.start();
			setCurrentLap(1);
		}
		setIsAnimating(true);
	};

	const handlePause = () => {
		trackAnimator.pause();
		setIsAnimating(false);
		setIsPaused(true);
	};

	const handleReset = () => {
		trackAnimator.reset();
		setIsAnimating(false);
		setIsPaused(false);
		setCurrentLap(0);
		setCurrentLapTime(null);
		setShowPitStop(false);
	};

	const handleSpeedChange = (speed: number) => {
		trackAnimator.setSpeed(speed);
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
					<div className='flex gap-6'>
						{/* Track Container */}
						<div className='flex-1'>
							<div
								id='track-container'
								ref={trackContainerRef}
								className='bg-gray-100 rounded-lg flex items-center justify-center'
								style={{ width: '100%', height: '600px' }}>
								{svgContent ? (
									<div
										dangerouslySetInnerHTML={{ __html: svgContent }}
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											width: '100%',
											height: '100%',
										}}
									/>
								) : (
									<p className='text-muted-foreground'>Loading track...</p>
								)}
							</div>

							{/* Animation Status Overlay */}
							{trackLoaded && !animationData.animationData.hasLapTimes && (
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
						<div className='w-fit'>
							{trackLoaded && animationData.animationData.hasLapTimes && (
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
