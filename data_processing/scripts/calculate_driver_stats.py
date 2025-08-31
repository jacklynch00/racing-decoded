#!/usr/bin/env python3
"""
Calculate Racing Statistics for Drivers
"""
import sys
from pathlib import Path
from sqlalchemy import text
from loguru import logger

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from utils.database import db_manager

def calculate_driver_racing_stats(driver_id: int):
    """Calculate comprehensive racing statistics for a driver"""
    engine = db_manager.connect()
    
    with engine.connect() as conn:
        # Get podium and race finish statistics
        result = conn.execute(text('''
            SELECT 
                COUNT(*) as total_races,
                SUM(CASE WHEN position = 1 THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN position = 2 THEN 1 ELSE 0 END) as second_places,
                SUM(CASE WHEN position = 3 THEN 1 ELSE 0 END) as third_places,
                SUM(CASE WHEN position IN (1,2,3) THEN 1 ELSE 0 END) as podiums,
                AVG(CASE WHEN position IS NOT NULL THEN position END) as avg_finish_position
            FROM results r
            WHERE r."driverId" = :driver_id
            AND r.position IS NOT NULL
        '''), {'driver_id': driver_id})
        
        race_stats = result.fetchone()
        
        # Get championship statistics
        result = conn.execute(text('''
            WITH final_standings AS (
                SELECT 
                    r.year,
                    ds.position as final_position,
                    ROW_NUMBER() OVER (PARTITION BY r.year ORDER BY r."raceId" DESC) as rn
                FROM driver_standings ds
                JOIN races r ON ds."raceId" = r."raceId"
                WHERE ds."driverId" = :driver_id
            )
            SELECT 
                MIN(final_position) as best_championship_finish,
                AVG(final_position) as avg_championship_finish,
                COUNT(*) as seasons_completed
            FROM final_standings
            WHERE rn = 1
        '''), {'driver_id': driver_id})
        
        championship_stats = result.fetchone()
        
        return {
            'total_races': race_stats[0] if race_stats else 0,
            'wins': race_stats[1] if race_stats else 0,
            'second_places': race_stats[2] if race_stats else 0,
            'third_places': race_stats[3] if race_stats else 0,
            'podiums': race_stats[4] if race_stats else 0,
            'avg_finish_position': round(race_stats[5], 1) if race_stats and race_stats[5] else None,
            'best_championship_finish': championship_stats[0] if championship_stats else None,
            'avg_championship_finish': round(championship_stats[1], 1) if championship_stats and championship_stats[1] else None,
            'seasons_completed': championship_stats[2] if championship_stats else 0
        }

def update_driver_profiles_with_stats():
    """Add racing statistics to all driver DNA profiles"""
    engine = db_manager.connect()
    
    # First add the new columns if they don't exist
    with engine.begin() as conn:
        conn.execute(text('''
            ALTER TABLE drivers_dna_profiles 
            ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "secondPlaces" INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "thirdPlaces" INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS podiums INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "avgFinishPosition" DECIMAL,
            ADD COLUMN IF NOT EXISTS "bestChampionshipFinish" INTEGER,
            ADD COLUMN IF NOT EXISTS "avgChampionshipFinish" DECIMAL
        '''))
    
    # Get all drivers with DNA profiles
    with engine.connect() as conn:
        result = conn.execute(text('''
            SELECT "driverId", "driverName" 
            FROM drivers_dna_profiles 
            ORDER BY "racesAnalyzed" DESC
        '''))
        
        drivers = result.fetchall()
    
    logger.info(f"Updating racing statistics for {len(drivers)} drivers")
    
    for driver_id, driver_name in drivers:
        stats = calculate_driver_racing_stats(driver_id)
        
        # Update the driver profile with calculated stats
        with engine.begin() as conn:
            conn.execute(text('''
                UPDATE drivers_dna_profiles 
                SET 
                    wins = :wins,
                    "secondPlaces" = :second_places,
                    "thirdPlaces" = :third_places,
                    podiums = :podiums,
                    "avgFinishPosition" = :avg_finish_position,
                    "bestChampionshipFinish" = :best_championship_finish,
                    "avgChampionshipFinish" = :avg_championship_finish
                WHERE "driverId" = :driver_id
            '''), {
                'driver_id': driver_id,
                'wins': stats['wins'],
                'second_places': stats['second_places'],
                'third_places': stats['third_places'],
                'podiums': stats['podiums'],
                'avg_finish_position': stats['avg_finish_position'],
                'best_championship_finish': stats['best_championship_finish'],
                'avg_championship_finish': stats['avg_championship_finish']
            })
        
        logger.info(f"Updated {driver_name}: {stats['wins']} wins, {stats['podiums']} podiums")

if __name__ == "__main__":
    logger.remove()
    logger.add(sys.stdout, level="INFO")
    
    try:
        update_driver_profiles_with_stats()
        logger.success("Successfully updated all driver racing statistics!")
    except Exception as e:
        logger.error(f"Failed to update driver racing statistics: {e}")
        sys.exit(1)