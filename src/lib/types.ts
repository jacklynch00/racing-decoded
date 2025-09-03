// Re-export types from Prisma client
import type {
  Driver,
  DriverDnaProfile,
  DriverDnaBreakdown,
  DriverDnaTimeline,
  DriverRacingStats,
} from '@prisma/client';

export type {
  Driver,
  DriverDnaProfile,
  DriverDnaBreakdown,
  DriverDnaTimeline,
  DriverRacingStats,
};

// Extended DriverDnaProfile with calculated racing statistics
export interface DriverDnaProfileWithStats extends DriverDnaProfile {
  wins?: number;
  secondPlaces?: number;
  thirdPlaces?: number;
  podiums?: number;
  avgFinishPosition?: number | null;
  bestChampionshipFinish?: number | null;
  avgChampionshipFinish?: number | null;
}

// API response types
export interface DriverWithDNA {
  id: number;
  name: string;
  nationality: string | null;
  age: number | null;
  dob: Date | null;
  dnaProfile: DriverDnaProfileWithStats | null;
}

export interface DriverDetails {
  id: number;
  name: string;
  nationality: string | null;
  dob: Date | null;
  url: string | null;
  dnaProfile: DriverDnaProfileWithStats | null;
  dnaBreakdowns: DriverDnaBreakdown[];
}

export interface TimelineEntry {
  season: string;
  racesCompleted: number;
  traitScores: {
    aggression: number;
    consistency: number;
    racecraft: number;
    pressure_performance: number;
    race_start: number;
  };
}