#!/usr/bin/env python3
"""
Test Racecraft Calculator on a sample of drivers
"""
import sys
from pathlib import Path
import pandas as pd
from loguru import logger

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

from utils.database import db_manager
from calculators.racecraft_calculator import RacecraftCalculator

def test_racecraft_calculator():
    """Test racecraft calculator on a few drivers"""
    logger.info("Testing racecraft calculator...")
    
    try:
        engine = db_manager.connect()
        
        # Load core datasets
        datasets = {
            'drivers': "SELECT * FROM drivers",
            'results': "SELECT * FROM results", 
            'qualifying': "SELECT * FROM qualifying",
            'lap_times': "SELECT * FROM lap_times LIMIT 50000",  # Limit for testing
            'driver_standings': "SELECT * FROM driver_standings",
            'races': "SELECT * FROM races"
        }
        
        data_cache = {}
        for name, query in datasets.items():
            logger.info(f"Loading {name}...")
            data_cache[name] = pd.read_sql(query, engine)
            logger.info(f"Loaded {len(data_cache[name]):,} rows from {name}")
        
        # Merge race year data into results
        races_subset = data_cache['races'][['raceId', 'year', 'name', 'date']].copy()
        data_cache['results'] = data_cache['results'].merge(
            races_subset, on='raceId', how='left'
        )
        
        # Initialize racecraft calculator
        calculator = RacecraftCalculator()
        
        # Test on a few well-known drivers
        test_drivers = [
            ('hamilton', 'Lewis Hamilton'),
            ('alonso', 'Fernando Alonso'),
            ('max_verstappen', 'Max Verstappen'),
            ('michael_schumacher', 'Michael Schumacher'),
            ('vettel', 'Sebastian Vettel')
        ]
        
        results = []
        
        for driver_ref, driver_name in test_drivers:
            # Find driver ID
            driver_info = data_cache['drivers'][
                data_cache['drivers']['driverRef'] == driver_ref
            ]
            
            if driver_info.empty:
                logger.warning(f"Driver {driver_name} not found")
                continue
            
            driver_id = driver_info['driverId'].iloc[0]
            logger.info(f"Testing racecraft for {driver_name} (ID: {driver_id})")
            
            # Get driver data
            driver_data = {
                'results': data_cache['results'][data_cache['results']['driverId'] == driver_id].copy(),
                'qualifying': data_cache['qualifying'][data_cache['qualifying']['driverId'] == driver_id].copy(),
                'lap_times': data_cache['lap_times'][data_cache['lap_times']['driverId'] == driver_id].copy(),
                'all_results': data_cache['results'].copy()
            }
            
            if driver_data['results'].empty:
                logger.warning(f"No results data for {driver_name}")
                continue
            
            # Calculate racecraft score
            try:
                result = calculator.calculate_trait(driver_id, driver_data)
                results.append({
                    'driver': driver_name,
                    'score': result['score'],
                    'races': result['races_analyzed'],
                    'notes': result['calculation_notes']
                })
                logger.info(f"{driver_name}: {result['score']:.1f} (based on {result['races_analyzed']} races)")
                
            except Exception as e:
                logger.error(f"Error calculating racecraft for {driver_name}: {e}")
        
        # Display results
        print("\nRacecraft Calculator Test Results:")
        print("=" * 60)
        print(f"{'Driver':20} | {'Score':>6} | {'Races':>6} | {'Notes'}")
        print("-" * 60)
        
        for result in sorted(results, key=lambda x: x['score'], reverse=True):
            notes_short = result['notes'][:30] + "..." if len(result['notes']) > 30 else result['notes']
            print(f"{result['driver']:20} | {result['score']:6.1f} | {result['races']:6d} | {notes_short}")
        
        return True
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        return False

if __name__ == "__main__":
    # Configure logging
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO"
    )
    
    success = test_racecraft_calculator()
    sys.exit(0 if success else 1)