'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrackVisualization } from '@/components/TrackVisualization';

// Available tracks (starting with Monaco)
const AVAILABLE_TRACKS = [
	{
		id: 'monaco',
		name: 'Circuit de Monaco',
		country: 'Monaco',
		lapDistance: 3.337,
		available: true,
	},
	{
		id: 'silverstone',
		name: 'Silverstone Circuit',
		country: 'United Kingdom',
		lapDistance: 5.891,
		available: false, // Coming soon
	},
	{
		id: 'spa',
		name: 'Circuit de Spa-Francorchamps',
		country: 'Belgium',
		lapDistance: 7.004,
		available: false, // Coming soon
	},
];

interface Race {
	raceId: number;
	name: string;
	year: number;
	date: string;
	circuitId: number;
}

interface Driver {
	driverId: number;
	name: string;
	nationality: string;
}

export default function TrackAnimationPage() {
	const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
	const [availableRaces, setAvailableRaces] = useState<Race[]>([]);
	const [selectedRace, setSelectedRace] = useState<Race | null>(null);
	const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
	const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
	const [loading, setLoading] = useState(false);

	// Combobox states
	const [trackOpen, setTrackOpen] = useState(false);
	const [raceOpen, setRaceOpen] = useState(false);
	const [driverOpen, setDriverOpen] = useState(false);

	// Load races when track is selected
	useEffect(() => {
		if (selectedTrack) {
			loadRacesForTrack(selectedTrack);
		}
	}, [selectedTrack]);

	// Load drivers when race is selected
	useEffect(() => {
		if (selectedRace) {
			loadDriversForRace(selectedRace.raceId);
		}
	}, [selectedRace]);

	const loadRacesForTrack = async (trackId: string) => {
		setLoading(true);
		try {
			const response = await fetch(`/api/track-animation/races?trackId=${trackId}`);
			const races = await response.json();
			setAvailableRaces(races);
		} catch (error) {
			console.error('Failed to load races:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadDriversForRace = async (raceId: number) => {
		setLoading(true);
		try {
			const response = await fetch(`/api/track-animation/drivers?raceId=${raceId}`);
			const drivers = await response.json();
			setAvailableDrivers(drivers);
		} catch (error) {
			console.error('Failed to load drivers:', error);
		} finally {
			setLoading(false);
		}
	};

	const canStartAnimation = selectedTrack && selectedRace && selectedDriver;

	return (
		<div className='space-y-4 sm:space-y-6 px-4 sm:px-0'>
			{/* Title Section */}
			<div className='space-y-4'>
				<div className='flex flex-col sm:flex-row items-start gap-4'>
					<div className='flex-1'>
						<h1 className='text-2xl sm:text-3xl font-bold mb-2'>
							<span className='text-3xl sm:text-4xl flex-shrink-0' role='img' aria-label='F1 Track Animation'>
								🏁
							</span>
							F1 Track Animation
						</h1>
						<p className='text-sm sm:text-lg text-muted-foreground mb-4'>Replay races with real lap time data</p>
					</div>
				</div>
			</div>

			{/* Compact Selection Controls */}
			<Card>
				<CardHeader>
					<CardTitle>Race Selection</CardTitle>
					<CardDescription>Choose a track, race, and driver to start the animation</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='flex flex-col sm:flex-row gap-4'>
						{/* Track Selection */}
						<div className='flex-1'>
							<label className='text-sm font-medium mb-2 block'>Track</label>
							<Popover open={trackOpen} onOpenChange={setTrackOpen}>
								<PopoverTrigger asChild>
									<Button variant='outline' role='combobox' aria-expanded={trackOpen} className='w-full justify-between'>
										{selectedTrack
											? AVAILABLE_TRACKS.find((track) => track.id === selectedTrack)?.name || 'Select track...'
											: 'Select track...'}
										<ChevronsUpDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-full p-0'>
									<Command>
										<CommandInput placeholder='Search tracks...' />
										<CommandList>
											<CommandEmpty>No tracks found.</CommandEmpty>
											<CommandGroup>
												{AVAILABLE_TRACKS.map((track) => (
													<CommandItem
														key={track.id}
														value={track.id}
														disabled={!track.available}
														onSelect={(currentValue) => {
															if (!track.available) return;
															setSelectedTrack(currentValue === selectedTrack ? null : currentValue);
															setSelectedRace(null);
															setSelectedDriver(null);
															setTrackOpen(false);
														}}>
														<CheckIcon
															className={cn('mr-2 h-4 w-4', selectedTrack === track.id ? 'opacity-100' : 'opacity-0')}
														/>
														<div className='flex-1 text-left'>
															<div className={cn('font-medium', !track.available && 'text-muted-foreground')}>
																{track.name}
															</div>
															<div className='text-xs text-muted-foreground'>
																{track.country} • {track.lapDistance}km
															</div>
														</div>
														{!track.available && (
															<Badge variant='secondary' className='ml-2 text-xs'>
																Coming Soon
															</Badge>
														)}
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>

						{/* Race Selection */}
						<div className='flex-1'>
							<label className='text-sm font-medium mb-2 block'>Race</label>
							<Popover open={raceOpen} onOpenChange={setRaceOpen}>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										role='combobox'
										aria-expanded={raceOpen}
										className='w-full justify-between'
										disabled={!selectedTrack}>
										{selectedRace ? `${selectedRace.name} ${selectedRace.year}` : 'Select race...'}
										<ChevronsUpDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-full p-0'>
									<Command>
										<CommandInput placeholder='Search races...' />
										<CommandList>
											<CommandEmpty>{loading ? 'Loading races...' : 'No races found.'}</CommandEmpty>
											<CommandGroup>
												{availableRaces.map((race) => (
													<CommandItem
														key={race.raceId}
														value={race.raceId.toString()}
														onSelect={() => {
															setSelectedRace(race);
															setSelectedDriver(null);
															setRaceOpen(false);
														}}>
														<CheckIcon
															className={cn('mr-2 h-4 w-4', selectedRace?.raceId === race.raceId ? 'opacity-100' : 'opacity-0')}
														/>
														<div className='flex-1 text-left'>
															<div className='font-medium'>{race.name}</div>
															<div className='text-xs text-muted-foreground'>{race.year} • {new Date(race.date).toLocaleDateString()}</div>
														</div>
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>

						{/* Driver Selection */}
						<div className='flex-1'>
							<label className='text-sm font-medium mb-2 block'>Driver</label>
							<Popover open={driverOpen} onOpenChange={setDriverOpen}>
								<PopoverTrigger asChild>
									<Button
										variant='outline'
										role='combobox'
										aria-expanded={driverOpen}
										className='w-full justify-between'
										disabled={!selectedRace}>
										{selectedDriver ? selectedDriver.name : 'Select driver...'}
										<ChevronsUpDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-full p-0'>
									<Command>
										<CommandInput placeholder='Search drivers...' />
										<CommandList>
											<CommandEmpty>{loading ? 'Loading drivers...' : 'No drivers found.'}</CommandEmpty>
											<CommandGroup>
												{availableDrivers.map((driver) => (
													<CommandItem
														key={driver.driverId}
														value={driver.driverId.toString()}
														onSelect={() => {
															setSelectedDriver(driver);
															setDriverOpen(false);
														}}>
														<CheckIcon
															className={cn('mr-2 h-4 w-4', selectedDriver?.driverId === driver.driverId ? 'opacity-100' : 'opacity-0')}
														/>
														<div className='flex-1 text-left'>
															<div className='font-medium'>{driver.name}</div>
															<div className='text-xs text-muted-foreground'>{driver.nationality}</div>
														</div>
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Track Animation */}
			{canStartAnimation && <TrackVisualization raceId={selectedRace!.raceId} driverId={selectedDriver!.driverId} />}

			{/* Feature Preview */}
			{!canStartAnimation && (
				<Card className='border-dashed'>
					<CardHeader>
						<CardTitle>🏁 F1 Track Animation Preview</CardTitle>
						<CardDescription>Experience Formula 1 races like never before with real lap time data visualization</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='grid gap-4 md:grid-cols-2'>
							<div>
								<h3 className='font-medium mb-2'>✨ Features</h3>
								<ul className='text-sm text-muted-foreground space-y-1'>
									<li>• Real lap time data from your F1 database</li>
									<li>• Interactive track visualization</li>
									<li>• Pit stop animations and timing</li>
									<li>• Adjustable animation speed controls</li>
									<li>• See how DNA traits affect track performance</li>
								</ul>
							</div>
							<div>
								<h3 className='font-medium mb-2'>🏎️ Available Tracks</h3>
								<ul className='text-sm text-muted-foreground space-y-1'>
									<li>• Monaco (Available now)</li>
									<li>• Silverstone (Coming soon)</li>
									<li>• Spa-Francorchamps (Coming soon)</li>
									<li>• More tracks being added</li>
								</ul>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
