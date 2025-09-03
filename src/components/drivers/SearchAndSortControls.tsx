import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, SortAsc, SortDesc, Filter, Check, ChevronsUpDown, X } from 'lucide-react';
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

interface SearchAndSortControlsProps {
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	sortBy: string;
	setSortBy: (sort: string) => void;
	sortOrder: string;
	setSortOrder: (order: string) => void;
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
}

function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Badge variant='secondary' className='cursor-pointer' onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={onRemove}>
			<span className='truncate max-w-[150px] sm:max-w-none'>{label}</span>
			{isHovered ? <X className='ml-1 h-3 w-3' /> : <span className='ml-1'>×</span>}
		</Badge>
	);
}

export function SearchAndSortControls({
	searchTerm,
	setSearchTerm,
	sortBy,
	setSortBy,
	sortOrder,
	setSortOrder,
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
}: SearchAndSortControlsProps) {
	const [filtersPopoverOpen, setFiltersPopoverOpen] = useState(false);
	const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);

	// Generate filter badges
	const activeFilterBadges = [];

	if (selectedCountry) {
		activeFilterBadges.push({
			key: 'country',
			label: `${getCountryFlag(selectedCountry)} ${selectedCountry}`,
			onRemove: () => setSelectedCountry(''),
		});
	}

	if (aggressionRange.some((v) => v !== '')) {
		const min = aggressionRange[0];
		const max = aggressionRange[1];
		const label = min && max ? `Aggression: ${min}-${max}` : min ? `Aggression: ≥${min}` : `Aggression: ≤${max}`;
		activeFilterBadges.push({
			key: 'aggression',
			label,
			onRemove: () => setAggressionRange(['', '']),
		});
	}

	if (consistencyRange.some((v) => v !== '')) {
		const min = consistencyRange[0];
		const max = consistencyRange[1];
		const label = min && max ? `Consistency: ${min}-${max}` : min ? `Consistency: ≥${min}` : `Consistency: ≤${max}`;
		activeFilterBadges.push({
			key: 'consistency',
			label,
			onRemove: () => setConsistencyRange(['', '']),
		});
	}

	if (racecraftRange.some((v) => v !== '')) {
		const min = racecraftRange[0];
		const max = racecraftRange[1];
		const label = min && max ? `Racecraft: ${min}-${max}` : min ? `Racecraft: ≥${min}` : `Racecraft: ≤${max}`;
		activeFilterBadges.push({
			key: 'racecraft',
			label,
			onRemove: () => setRacecraftRange(['', '']),
		});
	}

	if (pressureRange.some((v) => v !== '')) {
		const min = pressureRange[0];
		const max = pressureRange[1];
		const label = min && max ? `Pressure: ${min}-${max}` : min ? `Pressure: ≥${min}` : `Pressure: ≤${max}`;
		activeFilterBadges.push({
			key: 'pressure',
			label,
			onRemove: () => setPressureRange(['', '']),
		});
	}

	if (raceStartRange.some((v) => v !== '')) {
		const min = raceStartRange[0];
		const max = raceStartRange[1];
		const label = min && max ? `Race Start: ${min}-${max}` : min ? `Race Start: ≥${min}` : `Race Start: ≤${max}`;
		activeFilterBadges.push({
			key: 'raceStart',
			label,
			onRemove: () => setRaceStartRange(['', '']),
		});
	}

	if (clutchRange.some((v) => v !== '')) {
		const min = clutchRange[0];
		const max = clutchRange[1];
		const label = min && max ? `Clutch: ${min}-${max}` : min ? `Clutch: ≥${min}` : `Clutch: ≤${max}`;
		activeFilterBadges.push({
			key: 'clutch',
			label,
			onRemove: () => setClutchRange(['', '']),
		});
	}

	if (yearRange.some((v) => v !== '')) {
		const min = yearRange[0];
		const max = yearRange[1];
		const label = min && max ? `Years: ${min}-${max}` : min ? `Years: ≥${min}` : `Years: ≤${max}`;
		activeFilterBadges.push({
			key: 'year',
			label,
			onRemove: () => setYearRange(['', '']),
		});
	}

	if (racesRange.some((v) => v !== '')) {
		const min = racesRange[0];
		const max = racesRange[1];
		const label = min && max ? `Races: ${min}-${max}` : min ? `Races: ≥${min}` : `Races: ≤${max}`;
		activeFilterBadges.push({
			key: 'races',
			label,
			onRemove: () => setRacesRange(['', '']),
		});
	}

	if (sortBy !== 'wins' || sortOrder !== 'desc') {
		const sortLabel =
			sortBy === 'wins'
				? 'Wins'
				: sortBy === 'racesAnalyzed'
				? 'Races Analyzed'
				: sortBy === 'aggressionScore'
				? 'Aggression'
				: sortBy === 'consistencyScore'
				? 'Consistency'
				: sortBy === 'racecraftScore'
				? 'Racecraft'
				: sortBy === 'pressurePerformanceScore'
				? 'Pressure'
				: sortBy === 'raceStartScore'
				? 'Race Start'
				: sortBy === 'clutchFactorScore'
				? 'Clutch'
				: sortBy === 'nationality'
				? 'Nationality'
				: sortBy === 'age'
				? 'Age'
				: sortBy === 'name'
				? 'Name'
				: sortBy;
		const label = `Sort: ${sortLabel} (${sortOrder === 'asc' ? 'Asc' : 'Desc'})`;
		activeFilterBadges.push({
			key: 'sort',
			label,
			onRemove: () => {
				setSortBy('wins');
				setSortOrder('desc');
			},
		});
	}
	return (
		<div className='space-y-3 sm:space-y-4'>
			{/* Search, Sort, and Filter Row */}
			<div className='flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center'>
				<div className='relative flex-1 min-w-0 sm:max-w-md'>
					<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
					<Input placeholder='Search drivers by name...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' />
				</div>

				{/* Controls Row - Filter and Sort */}
				<div className='flex gap-3 items-center flex-wrap sm:flex-nowrap'>
					{/* Filter Button */}
					<Popover open={filtersPopoverOpen} onOpenChange={setFiltersPopoverOpen}>
						<PopoverTrigger asChild>
							<Button variant='outline' size='sm'>
								<Filter className='h-4 w-4 mr-2' />
								Filters
								{hasActiveFilters && <span className='ml-1'>({activeFiltersCount})</span>}
							</Button>
						</PopoverTrigger>
						<PopoverContent className='w-[90vw] max-w-[800px]' align='end' side='bottom' sideOffset={8}>
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
								<CardContent className='grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
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
											<PopoverContent className='w-[280px] p-0'>
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

					{/* Sort Controls */}
					<div className='flex gap-2 items-center flex-shrink-0'>
						<Label className='text-sm font-medium whitespace-nowrap hidden sm:inline'>Sort by:</Label>
						<Label className='text-sm font-medium whitespace-nowrap sm:hidden'>Sort:</Label>
						<Select value={sortBy} onValueChange={setSortBy}>
							<SelectTrigger className='w-[120px] sm:w-[140px]'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='name'>Name</SelectItem>
								<SelectItem value='nationality'>Nationality</SelectItem>
								<SelectItem value='age'>Age</SelectItem>
								<SelectItem value='wins'>Wins</SelectItem>
								<SelectItem value='racesAnalyzed'>Races Analyzed</SelectItem>
								<SelectItem value='aggressionScore'>Aggression</SelectItem>
								<SelectItem value='consistencyScore'>Consistency</SelectItem>
								<SelectItem value='racecraftScore'>Racecraft</SelectItem>
								<SelectItem value='pressurePerformanceScore'>Pressure</SelectItem>
								<SelectItem value='raceStartScore'>Race Start</SelectItem>
								<SelectItem value='clutchFactorScore'>Clutch Factor</SelectItem>
							</SelectContent>
						</Select>
						<Button
							variant='outline'
							size='sm'
							onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
							title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}>
							{sortOrder === 'asc' ? <SortAsc className='h-4 w-4' /> : <SortDesc className='h-4 w-4' />}
						</Button>
					</div>

					{/* Clear All Filters Button */}
					{hasActiveFilters && (
						<Button variant='ghost' size='sm' onClick={clearAllFilters}>
							<span className='hidden sm:inline'>Clear all</span>
							<span className='sm:hidden'>Clear</span>
						</Button>
					)}
				</div>
			</div>

			{/* Active Filter Badges */}
			{activeFilterBadges.length > 0 && (
				<div className='flex flex-wrap gap-1.5 sm:gap-2'>
					{activeFilterBadges.map((badge) => (
						<FilterBadge key={badge.key} label={badge.label} onRemove={badge.onRemove} />
					))}
				</div>
			)}
		</div>
	);
}
