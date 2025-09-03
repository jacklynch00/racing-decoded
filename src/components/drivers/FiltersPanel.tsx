import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Check, ChevronsUpDown, X, Filter } from 'lucide-react';
import { getCountryFlag } from '@/lib/flags';
import { cn } from '@/lib/utils';
import { RangeFilter } from './RangeFilter';

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

interface FiltersPanelProps {
	hasActiveFilters: boolean;
	activeFiltersCount: number;
	selectedCountry: string;
	setSelectedCountry: (country: string) => void;
	aggressionRange: [string | number, string | number];
	setAggressionRange: (range: [string | number, string | number]) => void;
	consistencyRange: [string | number, string | number];
	setConsistencyRange: (range: [string | number, string | number]) => void;
	racecraftRange: [string | number, string | number];
	setRacecraftRange: (range: [string | number, string | number]) => void;
	pressureRange: [string | number, string | number];
	setPressureRange: (range: [string | number, string | number]) => void;
	raceStartRange: [string | number, string | number];
	setRaceStartRange: (range: [string | number, string | number]) => void;
	clutchRange: [string | number, string | number];
	setClutchRange: (range: [string | number, string | number]) => void;
	yearRange: [string | number, string | number];
	setYearRange: (range: [string | number, string | number]) => void;
	racesRange: [string | number, string | number];
	setRacesRange: (range: [string | number, string | number]) => void;
	clearAllFilters: () => void;
	sortBy: string;
	setSortBy: (sort: string) => void;
	sortOrder: string;
	setSortOrder: (order: string) => void;
}

function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Badge
			variant='secondary'
			className='cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors'
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={onRemove}
		>
			{label}
			{isHovered ? <X className='ml-1 h-3 w-3' /> : <span className='ml-1'>×</span>}
		</Badge>
	);
}

export function FiltersPanel({
	hasActiveFilters,
	activeFiltersCount,
	selectedCountry,
	setSelectedCountry,
	aggressionRange,
	setAggressionRange,
	consistencyRange,
	setConsistencyRange,
	racecraftRange,
	setRacecraftRange,
	pressureRange,
	setPressureRange,
	raceStartRange,
	setRaceStartRange,
	clutchRange,
	setClutchRange,
	yearRange,
	setYearRange,
	racesRange,
	setRacesRange,
	clearAllFilters,
	sortBy,
	setSortBy,
	sortOrder,
	setSortOrder,
}: FiltersPanelProps) {
	const [filtersPopoverOpen, setFiltersPopoverOpen] = useState(false);
	const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);

	// Generate filter badges
	const activeFilterBadges = [];

	if (selectedCountry) {
		activeFilterBadges.push({
			key: 'country',
			label: `${getCountryFlag(selectedCountry)} ${selectedCountry}`,
			onRemove: () => setSelectedCountry('')
		});
	}

	if (aggressionRange.some(v => v !== '')) {
		const min = aggressionRange[0];
		const max = aggressionRange[1];
		const label = min && max ? `Aggression: ${min}-${max}` : min ? `Aggression: ≥${min}` : `Aggression: ≤${max}`;
		activeFilterBadges.push({
			key: 'aggression',
			label,
			onRemove: () => setAggressionRange(['', ''])
		});
	}

	if (consistencyRange.some(v => v !== '')) {
		const min = consistencyRange[0];
		const max = consistencyRange[1];
		const label = min && max ? `Consistency: ${min}-${max}` : min ? `Consistency: ≥${min}` : `Consistency: ≤${max}`;
		activeFilterBadges.push({
			key: 'consistency',
			label,
			onRemove: () => setConsistencyRange(['', ''])
		});
	}

	if (racecraftRange.some(v => v !== '')) {
		const min = racecraftRange[0];
		const max = racecraftRange[1];
		const label = min && max ? `Racecraft: ${min}-${max}` : min ? `Racecraft: ≥${min}` : `Racecraft: ≤${max}`;
		activeFilterBadges.push({
			key: 'racecraft',
			label,
			onRemove: () => setRacecraftRange(['', ''])
		});
	}

	if (pressureRange.some(v => v !== '')) {
		const min = pressureRange[0];
		const max = pressureRange[1];
		const label = min && max ? `Pressure: ${min}-${max}` : min ? `Pressure: ≥${min}` : `Pressure: ≤${max}`;
		activeFilterBadges.push({
			key: 'pressure',
			label,
			onRemove: () => setPressureRange(['', ''])
		});
	}

	if (raceStartRange.some(v => v !== '')) {
		const min = raceStartRange[0];
		const max = raceStartRange[1];
		const label = min && max ? `Race Start: ${min}-${max}` : min ? `Race Start: ≥${min}` : `Race Start: ≤${max}`;
		activeFilterBadges.push({
			key: 'raceStart',
			label,
			onRemove: () => setRaceStartRange(['', ''])
		});
	}

	if (clutchRange.some(v => v !== '')) {
		const min = clutchRange[0];
		const max = clutchRange[1];
		const label = min && max ? `Clutch: ${min}-${max}` : min ? `Clutch: ≥${min}` : `Clutch: ≤${max}`;
		activeFilterBadges.push({
			key: 'clutch',
			label,
			onRemove: () => setClutchRange(['', ''])
		});
	}

	if (yearRange.some(v => v !== '')) {
		const min = yearRange[0];
		const max = yearRange[1];
		const label = min && max ? `Years: ${min}-${max}` : min ? `Years: ≥${min}` : `Years: ≤${max}`;
		activeFilterBadges.push({
			key: 'year',
			label,
			onRemove: () => setYearRange(['', ''])
		});
	}

	if (racesRange.some(v => v !== '')) {
		const min = racesRange[0];
		const max = racesRange[1];
		const label = min && max ? `Races: ${min}-${max}` : min ? `Races: ≥${min}` : `Races: ≤${max}`;
		activeFilterBadges.push({
			key: 'races',
			label,
			onRemove: () => setRacesRange(['', ''])
		});
	}

	if (sortBy !== 'wins' || sortOrder !== 'desc') {
		const sortLabel = sortBy === 'wins' ? 'Wins' : sortBy === 'racesAnalyzed' ? 'Races Analyzed' : sortBy === 'aggressionScore' ? 'Aggression' : sortBy === 'consistencyScore' ? 'Consistency' : sortBy === 'racecraftScore' ? 'Racecraft' : sortBy === 'pressurePerformanceScore' ? 'Pressure' : sortBy === 'raceStartScore' ? 'Race Start' : sortBy === 'clutchFactorScore' ? 'Clutch' : sortBy === 'nationality' ? 'Nationality' : sortBy === 'age' ? 'Age' : sortBy === 'name' ? 'Name' : sortBy;
		const label = `Sort: ${sortLabel} (${sortOrder === 'asc' ? 'Asc' : 'Desc'})`;
		activeFilterBadges.push({
			key: 'sort',
			label,
			onRemove: () => {
				setSortBy('wins');
				setSortOrder('desc');
			}
		});
	}

	return (
		<div className='space-y-3'>
			<div className='flex items-center gap-2'>
				{/* Filter Toggle Button */}
				<Popover open={filtersPopoverOpen} onOpenChange={setFiltersPopoverOpen}>
					<PopoverTrigger asChild>
						<Button variant='outline' className={hasActiveFilters ? 'border-primary' : ''}>
							<Filter className='h-4 w-4 mr-2' />
							Filters {hasActiveFilters && `(${activeFiltersCount})`}
						</Button>
					</PopoverTrigger>
					<PopoverContent className='w-[800px]' align='start'>
						<Card className='border-0 shadow-none'>
							<CardHeader>
								<div className='flex justify-between items-center'>
									<CardTitle className='text-lg'>Advanced Filters</CardTitle>
									{hasActiveFilters && (
										<Button variant='outline' size='sm' onClick={clearAllFilters}>
											<X className='h-4 w-4 mr-1' />
											Clear All
										</Button>
									)}
								</div>
							</CardHeader>
							<CardContent className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
								{/* DNA Attribute Range Filters */}
								<RangeFilter label='Aggression' value={aggressionRange} onChange={setAggressionRange} min={0} max={100} />
								<RangeFilter label='Consistency' value={consistencyRange} onChange={setConsistencyRange} min={0} max={100} />
								<RangeFilter label='Racecraft' value={racecraftRange} onChange={setRacecraftRange} min={0} max={100} />
								<RangeFilter label='Pressure Performance' value={pressureRange} onChange={setPressureRange} min={0} max={100} />
								<RangeFilter label='Race Start' value={raceStartRange} onChange={setRaceStartRange} min={0} max={100} />
								<RangeFilter label='Clutch Factor' value={clutchRange} onChange={setClutchRange} min={0} max={100} />

								{/* Year Range Filter */}
								<RangeFilter label='Career Years' value={yearRange} onChange={setYearRange} min={1950} max={2024} placeholder={['Min Year', 'Max Year']} />

								{/* Races Range Filter */}
								<RangeFilter label='Number of Races' value={racesRange} onChange={setRacesRange} min={1} max={400} placeholder={['Min Races', 'Max Races']} />

								{/* Nationality Filter */}
								<div className='space-y-2'>
									<Label className='text-sm font-medium'>Nationality</Label>
									<Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
										<PopoverTrigger asChild>
											<Button variant='outline' role='combobox' aria-expanded={countryPopoverOpen} className='w-full justify-between'>
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
										<PopoverContent className='w-full p-0'>
											<Command>
												<CommandInput placeholder='Search nationality...' />
												<CommandList>
													<CommandEmpty>No nationality found.</CommandEmpty>
													<CommandGroup>
														<CommandItem
															value=''
															onSelect={() => {
																setSelectedCountry('');
																setCountryPopoverOpen(false);
															}}>
															<span className='text-muted-foreground'>All nationalities</span>
															<Check className={cn('ml-auto h-4 w-4', !selectedCountry ? 'opacity-100' : 'opacity-0')} />
														</CommandItem>
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
								</div>
							</CardContent>
						</Card>
					</PopoverContent>
				</Popover>

				{hasActiveFilters && (
					<Button variant='ghost' size='sm' onClick={clearAllFilters} className='text-muted-foreground hover:text-foreground'>
						Clear all
					</Button>
				)}
			</div>

			{/* Active Filter Badges */}
			{activeFilterBadges.length > 0 && (
				<div className='flex flex-wrap gap-2'>
					{activeFilterBadges.map((badge) => (
						<FilterBadge key={badge.key} label={badge.label} onRemove={badge.onRemove} />
					))}
				</div>
			)}
		</div>
	);
}