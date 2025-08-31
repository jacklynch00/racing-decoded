#!/usr/bin/env python3
"""
Calculate DNA Timeline - Season-by-season trait evolution
"""
import sys
import os
from pathlib import Path
import pandas as pd
import numpy as np
from tqdm import tqdm
from loguru import logger
from datetime import datetime
from typing import Dict, List, Optional
import json
from sqlalchemy import text

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from utils.database import db_manager
from calculators.aggression_calculator import AggressionCalculator
from calculators.consistency_calculator import ConsistencyCalculator
from calculators.race_start_calculator import RaceStartCalculator
from calculators.pressure_calculator import PressureCalculator
from calculators.racecraft_calculator import RacecraftCalculator

class DNATimelineProcessor:
    """Calculate DNA traits for each driver by season"""
    
    def __init__(self, min_races_per_season: int = 5):
        self.min_races_per_season = min_races_per_season
        self.logger = logger
        self.calculators = {
            'aggression': AggressionCalculator(),
            'consistency': ConsistencyCalculator(),
            'race_start': RaceStartCalculator(),
            'pressure_performance': PressureCalculator(),
            'racecraft': RacecraftCalculator()
        }
        self.data_cache = {}
    
    def load_f1_data(self) -> bool:
        """Load F1 data from database"""
        self.logger.info("Loading F1 data from database...")
        engine = db_manager.connect()
        
        try:
            # Load all necessary tables
            tables_to_load = [
                'drivers', 'results', 'qualifying', 'lap_times', 
                'pit_stops', 'driver_standings', 'races', 'constructors'
            ]
            
            for table in tables_to_load:
                self.logger.info(f"Loading {table}...")
                df = pd.read_sql(f'SELECT * FROM {table}', engine)
                self.data_cache[table] = df
                self.logger.info(f"Loaded {len(df):,} rows from {table}")
            
            # Add year column to results by joining with races
            if 'results' in self.data_cache and 'races' in self.data_cache:
                self.data_cache['results'] = self.data_cache['results'].merge(
                    self.data_cache['races'][['raceId', 'year']],
                    on='raceId',
                    how='left'
                )
            
            self.logger.success("Successfully loaded all F1 data from database")
            return True
            
        except Exception as e:
            self.logger.error(f"Error loading F1 data: {e}")
            return False
    
    def get_driver_seasons(self, driver_id: int) -> List[int]:
        """Get list of seasons for a driver with sufficient races"""
        if 'results' not in self.data_cache:
            return []
        
        driver_results = self.data_cache['results'][
            self.data_cache['results']['driverId'] == driver_id
        ]
        
        if driver_results.empty:
            return []
        
        # Count races per season
        races_per_season = driver_results.groupby('year').size()
        qualifying_seasons = races_per_season[
            races_per_season >= self.min_races_per_season
        ].index.tolist()
        
        return sorted(qualifying_seasons)
    
    def get_driver_season_data(self, driver_id: int, season: int) -> Dict[str, pd.DataFrame]:
        """Get driver data for a specific season"""
        season_data = {}
        
        # Get results for this driver and season
        if 'results' in self.data_cache:
            season_results = self.data_cache['results'][
                (self.data_cache['results']['driverId'] == driver_id) &
                (self.data_cache['results']['year'] == season)
            ]
            season_data['results'] = season_results
        
        # Get qualifying data for this season
        if 'qualifying' in self.data_cache and 'races' in self.data_cache:
            # First get race IDs for this season
            season_races = self.data_cache['races'][
                self.data_cache['races']['year'] == season
            ]['raceId'].tolist()
            
            season_qualifying = self.data_cache['qualifying'][
                (self.data_cache['qualifying']['driverId'] == driver_id) &
                (self.data_cache['qualifying']['raceId'].isin(season_races))
            ]
            season_data['qualifying'] = season_qualifying
        
        # Get lap times for this season
        if 'lap_times' in self.data_cache:
            season_lap_times = self.data_cache['lap_times'][
                (self.data_cache['lap_times']['driverId'] == driver_id) &
                (self.data_cache['lap_times']['raceId'].isin(season_races))
            ] if 'season_races' in locals() else pd.DataFrame()
            season_data['lap_times'] = season_lap_times
        
        # Get driver standings for this season
        if 'driver_standings' in self.data_cache:
            season_standings = self.data_cache['driver_standings'][
                (self.data_cache['driver_standings']['driverId'] == driver_id) &
                (self.data_cache['driver_standings']['raceId'].isin(season_races))
            ] if 'season_races' in locals() else pd.DataFrame()
            season_data['standings'] = season_standings
        
        # Add races data for this season
        if 'races' in self.data_cache and 'season_races' in locals():
            season_race_data = self.data_cache['races'][
                self.data_cache['races']['raceId'].isin(season_races)
            ]
            season_data['races'] = season_race_data
        
        return season_data
    
    def calculate_season_dna(self, driver_id: int, season: int, driver_name: str) -> Optional[Dict]:
        """Calculate DNA traits for a driver in a specific season"""
        season_data = self.get_driver_season_data(driver_id, season)
        
        if season_data.get('results', pd.DataFrame()).empty:
            return None
        
        races_completed = len(season_data['results'])
        if races_completed < self.min_races_per_season:
            return None
        
        # Calculate each trait for this season
        trait_scores = {}
        for trait_name, calculator in self.calculators.items():
            try:
                result = calculator.calculate_trait(str(driver_id), season_data)
                score = result.get('score')
                trait_scores[trait_name] = score if score is not None else None
                self.logger.debug(f"{trait_name} for {driver_name} {season}: {score if score is not None else 'N/A'}")
            except Exception as e:
                self.logger.debug(f"Error calculating {trait_name} for {driver_name} {season}: {e}")
                trait_scores[trait_name] = None  # No default score
        
        return {
            'driverId': driver_id,
            'season': season,
            'traitScores': json.dumps(trait_scores),
            'racesCompleted': races_completed
        }
    
    def save_timeline_data(self, timeline_data: List[Dict]) -> bool:
        """Save timeline data to database using UPSERT"""
        if not timeline_data:
            return True
        
        try:
            engine = db_manager.connect()
            
            with engine.begin() as conn:
                for data in timeline_data:
                    upsert_sql = text("""
                        INSERT INTO drivers_dna_timeline (
                            "driverId", season, "traitScores", "racesCompleted"
                        ) VALUES (
                            :driverId, :season, :traitScores, :racesCompleted
                        )
                        ON CONFLICT ("driverId", season) DO UPDATE SET
                            "traitScores" = EXCLUDED."traitScores",
                            "racesCompleted" = EXCLUDED."racesCompleted"
                    """)
                    
                    conn.execute(upsert_sql, data)
            
            self.logger.success(f"Successfully saved {len(timeline_data)} timeline records")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to save timeline data: {e}")
            return False
    
    def process_driver_timeline(self, driver_id: int, driver_name: str) -> bool:
        """Process timeline for a single driver"""
        seasons = self.get_driver_seasons(driver_id)
        
        if not seasons:
            self.logger.debug(f"No qualifying seasons for {driver_name}")
            return False
        
        self.logger.info(f"Processing timeline for {driver_name} ({len(seasons)} seasons: {min(seasons)}-{max(seasons)})")
        
        timeline_data = []
        successful_seasons = 0
        
        for season in tqdm(seasons, desc=f"Processing {driver_name}", leave=False):
            season_result = self.calculate_season_dna(driver_id, season, driver_name)
            if season_result:
                timeline_data.append(season_result)
                successful_seasons += 1
        
        if timeline_data:
            success = self.save_timeline_data(timeline_data)
            if success:
                self.logger.info(f"Successfully processed {successful_seasons}/{len(seasons)} seasons for {driver_name}")
                return True
        
        return False
    
    def get_eligible_drivers(self, limit: Optional[int] = None) -> List[tuple]:
        """Get list of drivers eligible for timeline analysis"""
        if 'drivers' not in self.data_cache or 'results' not in self.data_cache:
            return []
        
        # Get drivers with sufficient race data
        driver_race_counts = self.data_cache['results'].groupby('driverId').size()
        eligible_driver_ids = driver_race_counts[
            driver_race_counts >= (self.min_races_per_season * 2)  # At least 2 seasons worth
        ].index.tolist()
        
        # Get driver names
        eligible_drivers = []
        for driver_id in eligible_driver_ids:
            driver_info = self.data_cache['drivers'][
                self.data_cache['drivers']['driverId'] == driver_id
            ]
            if not driver_info.empty:
                driver_name = f"{driver_info.iloc[0]['forename']} {driver_info.iloc[0]['surname']}"
                total_races = driver_race_counts[driver_id]
                eligible_drivers.append((driver_id, driver_name, total_races))
        
        # Sort by total races (descending)
        eligible_drivers.sort(key=lambda x: x[2], reverse=True)
        
        if limit:
            eligible_drivers = eligible_drivers[:limit]
        
        return eligible_drivers
    
    def process_all_timelines(self, limit: Optional[int] = None) -> bool:
        """Process timelines for all eligible drivers"""
        eligible_drivers = self.get_eligible_drivers(limit)
        
        if not eligible_drivers:
            self.logger.warning("No eligible drivers found for timeline analysis")
            return False
        
        self.logger.info(f"Processing timeline data for {len(eligible_drivers)} drivers")
        
        successful_drivers = 0
        failed_drivers = 0
        
        with tqdm(eligible_drivers, desc="Processing driver timelines") as pbar:
            for driver_id, driver_name, total_races in pbar:
                pbar.set_description(f"Processing {driver_name}")
                
                try:
                    success = self.process_driver_timeline(driver_id, driver_name)
                    if success:
                        successful_drivers += 1
                    else:
                        failed_drivers += 1
                        
                except Exception as e:
                    self.logger.error(f"Failed to process {driver_name}: {e}")
                    failed_drivers += 1
        
        self.logger.success(f"Timeline processing completed: {successful_drivers} successful, {failed_drivers} failed")
        return successful_drivers > 0

def main(limit: Optional[int] = None):
    """Main timeline calculation function"""
    processor = DNATimelineProcessor()
    
    # Load data
    if not processor.load_f1_data():
        return False
    
    # Process timelines
    return processor.process_all_timelines(limit)

if __name__ == "__main__":
    # Configure logging
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO"
    )
    
    import argparse
    parser = argparse.ArgumentParser(description="Calculate DNA timeline data")
    parser.add_argument("--limit", type=int, help="Limit number of drivers to process")
    
    args = parser.parse_args()
    
    try:
        success = main(args.limit)
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.warning("Timeline calculation cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Timeline calculation failed: {e}")
        sys.exit(1)