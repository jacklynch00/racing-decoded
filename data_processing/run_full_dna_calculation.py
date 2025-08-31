#!/usr/bin/env python3
"""
Run full DNA calculation with racecraft calculator included
"""
import sys
from pathlib import Path
import pandas as pd
from tqdm import tqdm
from loguru import logger
from datetime import datetime
import json

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

from utils.database import db_manager
from calculators.aggression_calculator import AggressionCalculator
from calculators.consistency_calculator import ConsistencyCalculator
from calculators.race_start_calculator import RaceStartCalculator
from calculators.pressure_calculator import PressureCalculator
from calculators.racecraft_calculator import RacecraftCalculator

class DNAProcessor:
    """Processes F1 data to calculate driver DNA traits"""
    
    def __init__(self):
        self.calculators = {
            'aggression': AggressionCalculator(),
            'consistency': ConsistencyCalculator(),
            'race_start': RaceStartCalculator(),
            'pressure_performance': PressureCalculator(),
            'racecraft': RacecraftCalculator(),
        }
        
        self.data_cache = {}
        self.logger = logger.bind(processor="DNA")
    
    def load_f1_data(self) -> bool:
        """Load F1 data from database"""
        self.logger.info("Loading F1 data from database...")
        
        try:
            engine = db_manager.connect()
            
            # Load core datasets
            datasets = {
                'drivers': "SELECT * FROM drivers",
                'results': "SELECT * FROM results", 
                'qualifying': "SELECT * FROM qualifying",
                'lap_times': "SELECT * FROM lap_times",
                'pit_stops': "SELECT * FROM pit_stops",
                'driver_standings': "SELECT * FROM driver_standings",
                'races': "SELECT * FROM races",
                'constructors': "SELECT * FROM constructors"
            }
            
            for name, query in datasets.items():
                self.logger.info(f"Loading {name}...")
                self.data_cache[name] = pd.read_sql(query, engine)
                self.logger.info(f"Loaded {len(self.data_cache[name]):,} rows from {name}")
            
            # Merge race year data into results for era weighting
            races_subset = self.data_cache['races'][['raceId', 'year', 'name', 'date']].copy()
            self.data_cache['results'] = self.data_cache['results'].merge(
                races_subset, on='raceId', how='left'
            )
            
            # Also merge into qualifying
            if 'qualifying' in self.data_cache:
                self.data_cache['qualifying'] = self.data_cache['qualifying'].merge(
                    races_subset, on='raceId', how='left'
                )
            
            self.logger.success("Successfully loaded all F1 data from database")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to load F1 data: {e}")
            return False
    
    def get_driver_data(self, driver_id: str) -> dict:
        """Get all relevant data for a specific driver"""
        driver_data = {}
        
        # Get driver's race results
        driver_data['results'] = self.data_cache['results'][
            self.data_cache['results']['driverId'] == driver_id
        ].copy()
        
        # Get driver's qualifying data
        if 'qualifying' in self.data_cache:
            driver_data['qualifying'] = self.data_cache['qualifying'][
                self.data_cache['qualifying']['driverId'] == driver_id
            ].copy()
        
        # Get driver's lap times
        if 'lap_times' in self.data_cache:
            driver_data['lap_times'] = self.data_cache['lap_times'][
                self.data_cache['lap_times']['driverId'] == driver_id
            ].copy()
        
        # Get driver's pit stops
        if 'pit_stops' in self.data_cache:
            driver_data['pit_stops'] = self.data_cache['pit_stops'][
                self.data_cache['pit_stops']['driverId'] == driver_id
            ].copy()
        
        # Get driver's standings
        if 'driver_standings' in self.data_cache:
            driver_data['standings'] = self.data_cache['driver_standings'][
                self.data_cache['driver_standings']['driverId'] == driver_id
            ].copy()
        
        # Include all results for teammate comparisons
        driver_data['all_results'] = self.data_cache['results'].copy()
        
        return driver_data
    
    def calculate_driver_dna(self, driver_id: str, driver_info: dict) -> dict:
        """Calculate all DNA traits for a specific driver"""
        self.logger.info(f"Calculating DNA for driver {driver_id} ({driver_info.get('name', 'Unknown')})")
        
        # Get driver data
        driver_data = self.get_driver_data(driver_id)
        
        if driver_data['results'].empty:
            self.logger.warning(f"No results data for driver {driver_id}")
            return None
        
        # Calculate each DNA trait
        dna_results = {}
        trait_breakdowns = []
        
        for trait_name, calculator in self.calculators.items():
            self.logger.info(f"Calculating {trait_name} for {driver_id}")
            
            try:
                result = calculator.calculate_trait(driver_id, driver_data)
                dna_results[trait_name] = result
                
                # Store detailed breakdown
                breakdown = {
                    'driverId': driver_id,
                    'traitName': trait_name,
                    'rawValue': result.get('raw_value', 0),
                    'normalizedScore': result.get('score', 50),
                    'contributingStats': json.dumps(result.get('contributing_stats', {})),
                    'calculationNotes': result.get('calculation_notes', '')
                }
                trait_breakdowns.append(breakdown)
                
                self.logger.info(f"{trait_name}: {result['score']:.1f}")
                
            except Exception as e:
                self.logger.error(f"Error calculating {trait_name} for {driver_id}: {e}")
                dna_results[trait_name] = {
                    'score': 50.0,
                    'raw_value': None,
                    'contributing_stats': {},
                    'calculation_notes': f'Error: {str(e)}',
                    'races_analyzed': 0
                }
        
        # Create driver DNA profile
        career_span = self._get_career_span(driver_data['results'])
        races_analyzed = len(driver_data['results'])
        
        dna_profile = {
            'driverId': driver_id,
            'driverName': driver_info.get('name', f"{driver_info.get('forename', '')} {driver_info.get('surname', '')}").strip(),
            'aggressionScore': dna_results.get('aggression', {}).get('score', 50.0),
            'pressurePerformanceScore': dna_results.get('pressure_performance', {}).get('score', 50.0),
            'consistencyScore': dna_results.get('consistency', {}).get('score', 50.0),
            'racecraftScore': dna_results.get('racecraft', {}).get('score', 50.0),
            'weatherMasteryScore': dna_results.get('weather_mastery', {}).get('score'),  # Optional
            'clutchFactorScore': dna_results.get('clutch_factor', {}).get('score', 50.0),
            'raceStartScore': dna_results.get('race_start', {}).get('score'),  # Nullable
            'racesAnalyzed': races_analyzed,
            'careerSpan': career_span,
            'lastUpdated': datetime.now()
        }
        
        return {
            'profile': dna_profile,
            'breakdowns': trait_breakdowns,
            'results': dna_results
        }
    
    def _get_career_span(self, results: pd.DataFrame) -> str:
        """Get career span string for driver"""
        if 'year' not in results.columns or results.empty:
            return 'Unknown'
        
        start_year = results['year'].min()
        end_year = results['year'].max()
        
        if start_year == end_year:
            return str(start_year)
        else:
            return f"{start_year}-{end_year}"
    
    def _convert_numpy_types(self, data: dict) -> dict:
        """Convert NumPy types to native Python types for database compatibility"""
        import numpy as np
        import json
        converted = {}
        for key, value in data.items():
            if isinstance(value, np.floating):
                if np.isnan(value):
                    converted[key] = None
                else:
                    converted[key] = float(value)
            elif isinstance(value, np.integer):
                converted[key] = int(value)
            elif isinstance(value, np.ndarray):
                converted[key] = value.tolist()
            elif isinstance(value, str) and key == 'contributingStats':
                # Handle JSON string with NaN values
                try:
                    stats_dict = json.loads(value)
                    # Replace NaN with null in the dictionary
                    def replace_nan(obj):
                        if isinstance(obj, dict):
                            return {k: replace_nan(v) for k, v in obj.items()}
                        elif isinstance(obj, list):
                            return [replace_nan(item) for item in obj]
                        elif isinstance(obj, float) and np.isnan(obj):
                            return None
                        else:
                            return obj
                    clean_stats = replace_nan(stats_dict)
                    converted[key] = json.dumps(clean_stats)
                except (json.JSONDecodeError, TypeError):
                    converted[key] = value
            else:
                converted[key] = value
        return converted
    
    def save_dna_results(self, dna_data: dict) -> bool:
        """Save DNA calculation results to database using UPSERT"""
        try:
            from sqlalchemy import text
            engine = db_manager.connect()
            
            with engine.begin() as conn:
                # UPSERT DNA profile using PostgreSQL ON CONFLICT
                profile = self._convert_numpy_types(dna_data['profile'])
                upsert_profile_sql = text("""
                    INSERT INTO drivers_dna_profiles (
                        "driverId", "driverName", "aggressionScore", "pressurePerformanceScore",
                        "consistencyScore", "racecraftScore", "weatherMasteryScore", 
                        "clutchFactorScore", "raceStartScore", "racesAnalyzed", "careerSpan", "lastUpdated"
                    ) VALUES (
                        :driverId, :driverName, :aggressionScore, :pressurePerformanceScore,
                        :consistencyScore, :racecraftScore, :weatherMasteryScore,
                        :clutchFactorScore, :raceStartScore, :racesAnalyzed, :careerSpan, :lastUpdated
                    )
                    ON CONFLICT ("driverId") DO UPDATE SET
                        "driverName" = EXCLUDED."driverName",
                        "aggressionScore" = EXCLUDED."aggressionScore",
                        "pressurePerformanceScore" = EXCLUDED."pressurePerformanceScore",
                        "consistencyScore" = EXCLUDED."consistencyScore",
                        "racecraftScore" = EXCLUDED."racecraftScore",
                        "weatherMasteryScore" = EXCLUDED."weatherMasteryScore",
                        "clutchFactorScore" = EXCLUDED."clutchFactorScore",
                        "raceStartScore" = EXCLUDED."raceStartScore",
                        "racesAnalyzed" = EXCLUDED."racesAnalyzed",
                        "careerSpan" = EXCLUDED."careerSpan",
                        "lastUpdated" = EXCLUDED."lastUpdated"
                """)
                
                conn.execute(upsert_profile_sql, profile)
                
                # Delete existing breakdowns for this driver and insert new ones
                if dna_data['breakdowns']:
                    driver_id = profile['driverId']
                    conn.execute(text('DELETE FROM drivers_dna_breakdown WHERE "driverId" = :driverId'), 
                               {'driverId': driver_id})
                    
                    # Insert new breakdowns
                    for breakdown in dna_data['breakdowns']:
                        breakdown = self._convert_numpy_types(breakdown)
                        insert_breakdown_sql = text("""
                            INSERT INTO drivers_dna_breakdown (
                                "driverId", "traitName", "rawValue", "normalizedScore",
                                "contributingStats", "calculationNotes"
                            ) VALUES (
                                :driverId, :traitName, :rawValue, :normalizedScore,
                                :contributingStats, :calculationNotes
                            )
                        """)
                        conn.execute(insert_breakdown_sql, breakdown)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to save DNA results: {e}")
            return False
    
    def get_eligible_drivers(self, min_races: int = 15) -> list:
        """Get list of drivers eligible for DNA analysis"""
        if 'drivers' not in self.data_cache or 'results' not in self.data_cache:
            return []
        
        # Count races per driver
        race_counts = self.data_cache['results']['driverId'].value_counts()
        eligible_drivers = race_counts[race_counts >= min_races].index.tolist()
        
        # Get driver info
        drivers_info = self.data_cache['drivers'][
            self.data_cache['drivers']['driverId'].isin(eligible_drivers)
        ].copy()
        
        drivers_list = []
        for _, driver in drivers_info.iterrows():
            race_count = race_counts[driver['driverId']]
            drivers_list.append({
                'driverId': driver['driverId'],
                'name': f"{driver['forename']} {driver['surname']}",
                'forename': driver['forename'],
                'surname': driver['surname'],
                'race_count': race_count
            })
        
        # Sort by race count (most experienced first)
        drivers_list.sort(key=lambda x: x['race_count'], reverse=True)
        
        return drivers_list
    
    def process_all_drivers(self, min_races: int = 15, limit: int = None) -> bool:
        """Process DNA calculations for all eligible drivers"""
        
        # Get eligible drivers
        eligible_drivers = self.get_eligible_drivers(min_races)
        
        if not eligible_drivers:
            self.logger.error("No eligible drivers found")
            return False
        
        if limit:
            eligible_drivers = eligible_drivers[:limit]
        
        self.logger.info(f"Processing DNA for {len(eligible_drivers)} drivers")
        
        success_count = 0
        
        for driver_info in tqdm(eligible_drivers, desc="Processing drivers"):
            driver_id = driver_info['driverId']
            
            try:
                dna_data = self.calculate_driver_dna(driver_id, driver_info)
                
                if dna_data and self.save_dna_results(dna_data):
                    success_count += 1
                    self.logger.info(f"Successfully processed {driver_info['name']}")
                else:
                    self.logger.error(f"Failed to process {driver_info['name']}")
                    
            except Exception as e:
                self.logger.error(f"Error processing {driver_info['name']}: {e}")
                continue
        
        self.logger.success(f"Successfully processed {success_count}/{len(eligible_drivers)} drivers")
        return success_count > 0

def main():
    """Main processing function"""
    logger.info("Starting F1 Driver DNA calculation with Racecraft")
    
    # Initialize processor
    processor = DNAProcessor()
    
    # Load data
    if not processor.load_f1_data():
        logger.error("Failed to load F1 data. Exiting.")
        return False
    
    # Process all drivers (limited to first 50 for testing)
    success = processor.process_all_drivers(min_races=15, limit=50)
    
    if success:
        logger.success("DNA calculation completed successfully!")
    else:
        logger.error("DNA calculation failed")
    
    return success

if __name__ == "__main__":
    # Configure logging
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO"
    )
    
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.warning("Processing cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Processing failed with error: {e}")
        sys.exit(1)