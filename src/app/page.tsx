'use client';

import { useMemo } from 'react';
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs';
import { useDrivers, DriverFilters } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { SearchAndSortControls, DriverCard } from '@/components/drivers';

export default function HomePage() {
	// URL state for all filters and sorting
	const [searchTerm, setSearchTerm] = useQueryState('search', parseAsString.withDefault(''));
	const [selectedCountry, setSelectedCountry] = useQueryState('country', parseAsString.withDefault(''));

	// Sorting
	const [sortBy, setSortBy] = useQueryState('sortBy', parseAsString.withDefault('wins'));
	const [sortOrder, setSortOrder] = useQueryState('sortOrder', parseAsString.withDefault('desc'));

	// DNA attribute filters
	const [aggressionMin, setAggressionMin] = useQueryState('aggressionMin', parseAsInteger);
	const [aggressionMax, setAggressionMax] = useQueryState('aggressionMax', parseAsInteger);
	const [consistencyMin, setConsistencyMin] = useQueryState('consistencyMin', parseAsInteger);
	const [consistencyMax, setConsistencyMax] = useQueryState('consistencyMax', parseAsInteger);
	const [racecraftMin, setRacecraftMin] = useQueryState('racecraftMin', parseAsInteger);
	const [racecraftMax, setRacecraftMax] = useQueryState('racecraftMax', parseAsInteger);
	const [pressureMin, setPressureMin] = useQueryState('pressureMin', parseAsInteger);
	const [pressureMax, setPressureMax] = useQueryState('pressureMax', parseAsInteger);
	const [raceStartMin, setRaceStartMin] = useQueryState('raceStartMin', parseAsInteger);
	const [raceStartMax, setRaceStartMax] = useQueryState('raceStartMax', parseAsInteger);
	const [clutchMin, setClutchMin] = useQueryState('clutchMin', parseAsInteger);
	const [clutchMax, setClutchMax] = useQueryState('clutchMax', parseAsInteger);

	// Year and races range filters
	const [yearMin, setYearMin] = useQueryState('yearMin', parseAsInteger);
	const [yearMax, setYearMax] = useQueryState('yearMax', parseAsInteger);
	const [racesMin, setRacesMin] = useQueryState('racesMin', parseAsInteger);
	const [racesMax, setRacesMax] = useQueryState('racesMax', parseAsInteger);

	// Convert individual values back to range tuples for existing components
	const aggressionRange: [string | number, string | number] = [aggressionMin ?? '', aggressionMax ?? ''];
	const setAggressionRange = (values: [string | number, string | number]) => {
		setAggressionMin(values[0] === '' ? null : Number(values[0]));
		setAggressionMax(values[1] === '' ? null : Number(values[1]));
	};

	const consistencyRange: [string | number, string | number] = [consistencyMin ?? '', consistencyMax ?? ''];
	const setConsistencyRange = (values: [string | number, string | number]) => {
		setConsistencyMin(values[0] === '' ? null : Number(values[0]));
		setConsistencyMax(values[1] === '' ? null : Number(values[1]));
	};

	const racecraftRange: [string | number, string | number] = [racecraftMin ?? '', racecraftMax ?? ''];
	const setRacecraftRange = (values: [string | number, string | number]) => {
		setRacecraftMin(values[0] === '' ? null : Number(values[0]));
		setRacecraftMax(values[1] === '' ? null : Number(values[1]));
	};

	const pressureRange: [string | number, string | number] = [pressureMin ?? '', pressureMax ?? ''];
	const setPressureRange = (values: [string | number, string | number]) => {
		setPressureMin(values[0] === '' ? null : Number(values[0]));
		setPressureMax(values[1] === '' ? null : Number(values[1]));
	};

	const raceStartRange: [string | number, string | number] = [raceStartMin ?? '', raceStartMax ?? ''];
	const setRaceStartRange = (values: [string | number, string | number]) => {
		setRaceStartMin(values[0] === '' ? null : Number(values[0]));
		setRaceStartMax(values[1] === '' ? null : Number(values[1]));
	};

	const clutchRange: [string | number, string | number] = [clutchMin ?? '', clutchMax ?? ''];
	const setClutchRange = (values: [string | number, string | number]) => {
		setClutchMin(values[0] === '' ? null : Number(values[0]));
		setClutchMax(values[1] === '' ? null : Number(values[1]));
	};

	const yearRange: [string | number, string | number] = [yearMin ?? '', yearMax ?? ''];
	const setYearRange = (values: [string | number, string | number]) => {
		setYearMin(values[0] === '' ? null : Number(values[0]));
		setYearMax(values[1] === '' ? null : Number(values[1]));
	};

	const racesRange: [string | number, string | number] = [racesMin ?? '', racesMax ?? ''];
	const setRacesRange = (values: [string | number, string | number]) => {
		setRacesMin(values[0] === '' ? null : Number(values[0]));
		setRacesMax(values[1] === '' ? null : Number(values[1]));
	};

	// Build filters object
	const filters: DriverFilters = useMemo(() => {
		const f: DriverFilters = {
			sortBy: sortBy as string,
			sortOrder: sortOrder as 'asc' | 'desc',
		};

		if (aggressionMin !== null) f.minAggression = aggressionMin;
		if (aggressionMax !== null) f.maxAggression = aggressionMax;
		if (consistencyMin !== null) f.minConsistency = consistencyMin;
		if (consistencyMax !== null) f.maxConsistency = consistencyMax;
		if (racecraftMin !== null) f.minRacecraft = racecraftMin;
		if (racecraftMax !== null) f.maxRacecraft = racecraftMax;
		if (pressureMin !== null) f.minPressure = pressureMin;
		if (pressureMax !== null) f.maxPressure = pressureMax;
		if (raceStartMin !== null) f.minRaceStart = raceStartMin;
		if (raceStartMax !== null) f.maxRaceStart = raceStartMax;
		if (clutchMin !== null) f.minClutch = clutchMin;
		if (clutchMax !== null) f.maxClutch = clutchMax;
		if (yearMin !== null) f.minYear = yearMin;
		if (yearMax !== null) f.maxYear = yearMax;
		if (racesMin !== null) f.minRaces = racesMin;
		if (racesMax !== null) f.maxRaces = racesMax;

		return f;
	}, [
		sortBy,
		sortOrder,
		aggressionMin,
		aggressionMax,
		consistencyMin,
		consistencyMax,
		racecraftMin,
		racecraftMax,
		pressureMin,
		pressureMax,
		raceStartMin,
		raceStartMax,
		clutchMin,
		clutchMax,
		yearMin,
		yearMax,
		racesMin,
		racesMax,
	]);

	const { data: drivers, isLoading, error } = useDrivers(filters);

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

	// Clear all filters function
	const clearAllFilters = () => {
		setSearchTerm('');
		setSelectedCountry('');
		setAggressionMin(null);
		setAggressionMax(null);
		setConsistencyMin(null);
		setConsistencyMax(null);
		setRacecraftMin(null);
		setRacecraftMax(null);
		setPressureMin(null);
		setPressureMax(null);
		setRaceStartMin(null);
		setRaceStartMax(null);
		setClutchMin(null);
		setClutchMax(null);
		setYearMin(null);
		setYearMax(null);
		setRacesMin(null);
		setRacesMax(null);
		setSortBy('wins');
		setSortOrder('desc');
	};

	// Check if any filters are active
	const hasActiveFilters: boolean = !!(
		searchTerm.trim() ||
		selectedCountry ||
		aggressionMin !== null ||
		aggressionMax !== null ||
		consistencyMin !== null ||
		consistencyMax !== null ||
		racecraftMin !== null ||
		racecraftMax !== null ||
		pressureMin !== null ||
		pressureMax !== null ||
		raceStartMin !== null ||
		raceStartMax !== null ||
		clutchMin !== null ||
		clutchMax !== null ||
		racesMin !== null ||
		racesMax !== null ||
		yearMin !== null ||
		yearMax !== null ||
		sortBy !== 'wins' ||
		sortOrder !== 'desc'
	);

	// Count active filters for display
	const activeFiltersCount = [
		selectedCountry ? 1 : 0,
		aggressionMin !== null || aggressionMax !== null ? 1 : 0,
		consistencyMin !== null || consistencyMax !== null ? 1 : 0,
		racecraftMin !== null || racecraftMax !== null ? 1 : 0,
		pressureMin !== null || pressureMax !== null ? 1 : 0,
		raceStartMin !== null || raceStartMax !== null ? 1 : 0,
		clutchMin !== null || clutchMax !== null ? 1 : 0,
		racesMin !== null || racesMax !== null ? 1 : 0,
		yearMin !== null || yearMax !== null ? 1 : 0,
		sortBy !== 'wins' || sortOrder !== 'desc' ? 1 : 0,
	].reduce((sum, count) => sum + count, 0);

	return (
		<div className='space-y-4 sm:space-y-6 px-4 sm:px-0'>
			<div className='text-center sm:text-left'>
				<h1 className='text-2xl sm:text-3xl font-bold mb-2'>F1 Driver DNA Profiles</h1>
				<p className='text-sm sm:text-base text-muted-foreground'>Explore the personality traits of Formula 1 drivers</p>
			</div>

			<div className='space-y-4'>
				{/* Search, Sort, and Filter Controls */}
				<SearchAndSortControls
					searchTerm={searchTerm}
					setSearchTerm={setSearchTerm}
					sortBy={sortBy}
					setSortBy={setSortBy}
					sortOrder={sortOrder}
					setSortOrder={setSortOrder}
					hasActiveFilters={hasActiveFilters}
					activeFiltersCount={activeFiltersCount}
					selectedCountry={selectedCountry}
					setSelectedCountry={setSelectedCountry}
					aggressionRange={aggressionRange}
					setAggressionRange={setAggressionRange}
					consistencyRange={consistencyRange}
					setConsistencyRange={setConsistencyRange}
					racecraftRange={racecraftRange}
					setRacecraftRange={setRacecraftRange}
					pressureRange={pressureRange}
					setPressureRange={setPressureRange}
					raceStartRange={raceStartRange}
					setRaceStartRange={setRaceStartRange}
					clutchRange={clutchRange}
					setClutchRange={setClutchRange}
					yearRange={yearRange}
					setYearRange={setYearRange}
					racesRange={racesRange}
					setRacesRange={setRacesRange}
					clearAllFilters={clearAllFilters}
				/>
			</div>

			{/* Results Count and Driver Cards Section */}
			{isLoading ? (
				<div className='flex justify-center items-center min-h-[400px]'>
					<div className='text-center space-y-2'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
						<p className='text-muted-foreground'>Loading drivers...</p>
					</div>
				</div>
			) : error ? (
				<div className='flex justify-center items-center min-h-[400px]'>
					<div className='text-center space-y-2'>
						<p className='text-red-500'>Error loading drivers: {error.message}</p>
						<Button variant='outline' onClick={() => window.location.reload()}>
							Try Again
						</Button>
					</div>
				</div>
			) : (
				<>
					{/* Results Count */}
					<div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b pb-4'>
						<div>
							<p className='text-sm text-muted-foreground font-medium'>
								{filteredDrivers.length} Driver{filteredDrivers.length !== 1 ? 's' : ''} Found
							</p>
						</div>
						{sortBy && (
							<div className='text-xs sm:text-sm text-muted-foreground'>
								Sorted by{' '}
								{sortBy === 'wins'
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
									? 'Pressure Performance'
									: sortBy === 'raceStartScore'
									? 'Race Start'
									: sortBy === 'clutchFactorScore'
									? 'Clutch Factor'
									: sortBy === 'nationality'
									? 'Nationality'
									: sortBy === 'age'
									? 'Age'
									: sortBy === 'name'
									? 'Name'
									: sortBy}{' '}
								({sortOrder === 'desc' ? 'High to Low' : 'Low to High'})
							</div>
						)}
					</div>

					<div className='grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
						{filteredDrivers.map((driver) => (
							<DriverCard key={driver.id} driver={driver} />
						))}
					</div>

					{filteredDrivers.length === 0 && (searchTerm.trim() || selectedCountry || hasActiveFilters) && (
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
				</>
			)}
		</div>
	);
}
