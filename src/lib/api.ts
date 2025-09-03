'use client';

import { useQuery } from '@tanstack/react-query';
import { DriverWithDNA, DriverDetails, TimelineEntry } from './types';

// Types for filter parameters
export interface DriverFilters {
	minAggression?: number;
	maxAggression?: number;
	minConsistency?: number;
	maxConsistency?: number;
	minRacecraft?: number;
	maxRacecraft?: number;
	minPressure?: number;
	maxPressure?: number;
	minRaceStart?: number;
	maxRaceStart?: number;
	minClutch?: number;
	maxClutch?: number;
	minRaces?: number;
	maxRaces?: number;
	minYear?: number;
	maxYear?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

// Fetch all drivers with DNA profiles
export function useDrivers(filters?: DriverFilters) {
	const queryParams = new URLSearchParams();
	
	if (filters) {
		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '') {
				queryParams.append(key, value.toString());
			}
		});
	}
	
	const queryString = queryParams.toString();
	
	return useQuery<DriverWithDNA[]>({
		queryKey: ['drivers', filters],
		queryFn: async () => {
			const url = queryString ? `/api/drivers?${queryString}` : '/api/drivers';
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error('Failed to fetch drivers');
			}
			return response.json();
		},
	});
}

// Fetch specific driver details
export function useDriver(id: number) {
	return useQuery<DriverDetails>({
		queryKey: ['driver', id],
		queryFn: async () => {
			const response = await fetch(`/api/drivers/${id}`);
			if (!response.ok) {
				throw new Error('Failed to fetch driver');
			}
			return response.json();
		},
		enabled: !!id,
	});
}

// Fetch driver timeline data
export function useDriverTimeline(id: number) {
	return useQuery<TimelineEntry[]>({
		queryKey: ['driver-timeline', id],
		queryFn: async () => {
			const response = await fetch(`/api/drivers/${id}/timeline`);
			if (!response.ok) {
				throw new Error('Failed to fetch driver timeline');
			}
			return response.json();
		},
		enabled: !!id,
	});
}

// Fetch driver DNA breakdown data
export function useDriverBreakdown(id: number) {
	return useQuery<Record<string, unknown>>({
		queryKey: ['driver-breakdown', id],
		queryFn: async () => {
			const response = await fetch(`/api/drivers/${id}/breakdown`);
			if (!response.ok) {
				throw new Error('Failed to fetch driver breakdown');
			}
			return response.json();
		},
		enabled: !!id,
	});
}
