'use client';

import { useState, useMemo } from 'react';
import { useDrivers } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Check, ChevronsUpDown, X } from 'lucide-react';
import { getCountryFlag } from '@/lib/flags';
import { cn } from '@/lib/utils';
import { DriverAvatar } from '@/components/driver-avatar';
import Link from 'next/link';
import { DriverWithDNA } from '@/lib/types';

// Available countries from the flags mapping
const countries = [
	'German',
	'British',
	'Spanish',
	'French',
	'Italian',
	'Dutch',
	'Finnish',
	'Brazilian',
	'Australian',
	'Canadian',
	'Mexican',
	'Monégasque',
	'Austrian',
	'Belgian',
	'Danish',
	'Japanese',
	'Polish',
	'Swiss',
	'Swedish',
	'Argentine',
	'South African',
	'New Zealander',
	'American',
	'Chilean',
	'Colombian',
	'Venezuelan',
	'Portuguese',
	'Thai',
	'Malaysian',
	'Indian',
	'Russian',
	'Irish',
	'Hungarian',
	'Czech',
	'Uruguayan',
	'East German',
	'West German',
	'Rhodesian',
	'Yugoslavian',
].sort();

function DNAScoreBadge({ label, score }: { label: string; score: number | null }) {
	if (score === null) {
		return (
			<Badge variant='outline' className='bg-gray-100 text-gray-600 border-gray-200'>
				{label}: N/A
			</Badge>
		);
	}

	const getColor = (value: number) => {
		if (value >= 70) return 'bg-green-100 text-green-800 border-green-200';
		if (value >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		return 'bg-red-100 text-red-800 border-red-200';
	};

	return (
		<Badge variant='outline' className={getColor(score)}>
			{label}: {score.toFixed(1)}
		</Badge>
	);
}

function DriverCard({ driver }: { driver: DriverWithDNA }) {
	const profile = driver.dnaProfile;
	const flag = getCountryFlag(driver.nationality);

	if (!profile) {
		return null; // Skip drivers without DNA profiles
	}

	return (
		<Link href={`/driver/${driver.id}`}>
			<Card className='cursor-pointer hover:shadow-lg transition-shadow'>
				<CardHeader>
					<div className='flex items-start gap-3 mb-2'>
						<DriverAvatar driverId={driver.id} driverName={driver.name} imageUrl={profile.imageUrl} size={48} />
						<div className='flex-1'>
							<CardTitle className='flex justify-between items-start mb-1'>
								{driver.name}
								{flag && (
									<span className='text-xl cursor-help transition-transform hover:scale-110' title={driver.nationality || undefined}>
										{flag}
									</span>
								)}
							</CardTitle>
							<CardDescription>
								{profile.racesAnalyzed} races analyzed • {profile.careerSpan}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className='flex flex-wrap gap-2'>
						<DNAScoreBadge label='Aggression' score={profile.aggressionScore} />
						<DNAScoreBadge label='Consistency' score={profile.consistencyScore} />
						<DNAScoreBadge label='Racecraft' score={profile.racecraftScore} />
						<DNAScoreBadge label='Pressure' score={profile.pressurePerformanceScore} />
						{profile.clutchFactorScore && <DNAScoreBadge label='Clutch' score={profile.clutchFactorScore} />}
						<DNAScoreBadge label='Race Start' score={profile.raceStartScore} />
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

export default function HomePage() {
	const { data: drivers, isLoading, error } = useDrivers();
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCountry, setSelectedCountry] = useState('');
	const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);

	const filteredDrivers = useMemo(() => {
		if (!drivers) return [];

		let filtered = drivers;

		// Filter by name if search term exists
		if (searchTerm.trim()) {
			const search = searchTerm.toLowerCase();
			filtered = filtered.filter((driver) => driver.name.toLowerCase().includes(search));
		}

		// Filter by country if selected
		if (selectedCountry) {
			filtered = filtered.filter((driver) => driver.nationality === selectedCountry);
		}

		return filtered;
	}, [drivers, searchTerm, selectedCountry]);

	if (isLoading) {
		return (
			<div className='flex justify-center items-center min-h-[400px]'>
				<p>Loading drivers...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className='flex justify-center items-center min-h-[400px]'>
				<p className='text-red-500'>Error loading drivers: {error.message}</p>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			<div>
				<h1 className='text-3xl font-bold mb-2'>F1 Driver DNA Profiles</h1>
				<p className='text-muted-foreground'>Explore the personality traits of Formula 1 drivers through data analysis</p>
			</div>

			<div className='flex gap-4'>
				<div className='relative flex-1'>
					<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
					<Input placeholder='Search drivers by name...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' />
				</div>

				<div className='flex-shrink-0'>
					<Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
						<PopoverTrigger asChild>
							<Button variant='outline' role='combobox' aria-expanded={countryPopoverOpen} className='w-[200px] justify-between'>
								{selectedCountry ? (
									<span className='flex items-center gap-2'>
										{getCountryFlag(selectedCountry)}
										{selectedCountry}
									</span>
								) : (
									'Select nationality...'
								)}
								<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
							</Button>
						</PopoverTrigger>
						<PopoverContent className='w-[200px] p-0'>
							<Command>
								<CommandInput placeholder='Search nationality...' />
								<CommandList>
									<CommandEmpty>No nationality found.</CommandEmpty>
									<CommandGroup>
										{countries.map((country) => (
											<CommandItem
												key={country}
												value={country}
												onSelect={(currentValue) => {
													setSelectedCountry(currentValue === selectedCountry ? '' : currentValue);
													setCountryPopoverOpen(false);
												}}>
												<div className='flex items-center gap-2 flex-1'>
													{getCountryFlag(country)}
													{country}
												</div>
												<Check className={cn('ml-auto h-4 w-4', selectedCountry === country ? 'opacity-100' : 'opacity-0')} />
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>

					{selectedCountry && (
						<Button variant='ghost' size='sm' className='ml-2 px-2' onClick={() => setSelectedCountry('')}>
							<X className='h-4 w-4' />
						</Button>
					)}
				</div>
			</div>

			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
				{filteredDrivers.map((driver) => (
					<DriverCard key={driver.id} driver={driver} />
				))}
			</div>

			{filteredDrivers.length === 0 && (searchTerm.trim() || selectedCountry) && (
				<div className='text-center py-12'>
					<p className='text-muted-foreground'>
						No drivers found matching the current filters
						{searchTerm.trim() && ` (name: "${searchTerm}")`}
						{selectedCountry && ` (nationality: ${selectedCountry})`}
					</p>
				</div>
			)}

			{drivers && drivers.length === 0 && (
				<div className='text-center py-12'>
					<p className='text-muted-foreground'>No drivers with DNA profiles found.</p>
				</div>
			)}
		</div>
	);
}
