#!/usr/bin/env python3
"""
Populate Racing Statistics Table with Proper Data
"""
import sys
from pathlib import Path
from datetime import datetime
from loguru import logger
from sqlalchemy import text

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from utils.database import db_manager

def calculate_and_populate_racing_stats():
    """Calculate racing statistics from source tables and populate the new table"""
    engine = db_manager.connect()
    
    logger.info("Creating driver_racing_stats table if it doesn't exist")
    
    # Create the table (Prisma migration should handle this, but just in case)
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS driver_racing_stats (
                id SERIAL PRIMARY KEY,
                "driverId" INTEGER UNIQUE NOT NULL,
                "totalRaces" INTEGER NOT NULL,
                wins INTEGER NOT NULL,
                "secondPlaces" INTEGER NOT NULL,
                "thirdPlaces" INTEGER NOT NULL,
                podiums INTEGER NOT NULL,
                "avgFinishPosition" DECIMAL,
                "bestChampionshipFinish" INTEGER,
                "avgChampionshipFinish" DECIMAL,
                "seasonsCompleted" INTEGER NOT NULL,
                "lastUpdated" TIMESTAMP NOT NULL DEFAULT NOW(),
                FOREIGN KEY ("driverId") REFERENCES drivers("driverId")
            )
        """))
    
    # Get all drivers with DNA profiles
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT d."driverId", d.forename, d.surname 
            FROM drivers d
            JOIN drivers_dna_profiles ddp ON d."driverId" = ddp."driverId"
            ORDER BY ddp."racesAnalyzed" DESC
        """))
        
        drivers = result.fetchall()
    
    logger.info(f"Calculating racing statistics for {len(drivers)} drivers")
    
    for driver_id, forename, surname in drivers:
        driver_name = f"{forename} {surname}"
        
        # Calculate racing statistics
        with engine.connect() as conn:
            # Race statistics
            race_result = conn.execute(text("""
                SELECT 
                    COUNT(*) as total_races,
                    SUM(CASE WHEN position = 1 THEN 1 ELSE 0 END) as wins,
                    SUM(CASE WHEN position = 2 THEN 1 ELSE 0 END) as second_places,
                    SUM(CASE WHEN position = 3 THEN 1 ELSE 0 END) as third_places,
                    SUM(CASE WHEN position IN (1,2,3) THEN 1 ELSE 0 END) as podiums,
                    AVG(CASE WHEN position IS NOT NULL THEN position::decimal END) as avg_finish_position
                FROM results r
                WHERE r."driverId" = :driver_id
                AND r.position IS NOT NULL
            """), {'driver_id': driver_id})
            
            race_stats = race_result.fetchone()
            
            # Championship statistics
            championship_result = conn.execute(text("""
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
                    AVG(final_position::decimal) as avg_championship_finish,
                    COUNT(*) as seasons_completed
                FROM final_standings
                WHERE rn = 1
            """), {'driver_id': driver_id})
            
            championship_stats = championship_result.fetchone()
        
        # Prepare the statistics - handle null values properly
        stats = {
            'driver_id': driver_id,
            'total_races': int(race_stats[0]) if race_stats and race_stats[0] else 0,
            'wins': int(race_stats[1]) if race_stats and race_stats[1] else 0,
            'second_places': int(race_stats[2]) if race_stats and race_stats[2] else 0,
            'third_places': int(race_stats[3]) if race_stats and race_stats[3] else 0,
            'podiums': int(race_stats[4]) if race_stats and race_stats[4] else 0,
            'avg_finish_position': float(race_stats[5]) if race_stats and race_stats[5] else None,
            'best_championship_finish': int(championship_stats[0]) if championship_stats and championship_stats[0] else None,
            'avg_championship_finish': float(championship_stats[1]) if championship_stats and championship_stats[1] else None,
            'seasons_completed': int(championship_stats[2]) if championship_stats and championship_stats[2] else 0
        }
        
        # Insert or update the racing stats
        with engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO driver_racing_stats (
                    "driverId", "totalRaces", wins, "secondPlaces", "thirdPlaces", 
                    podiums, "avgFinishPosition", "bestChampionshipFinish", 
                    "avgChampionshipFinish", "seasonsCompleted", "lastUpdated"
                ) VALUES (
                    :driver_id, :total_races, :wins, :second_places, :third_places,
                    :podiums, :avg_finish_position, :best_championship_finish,
                    :avg_championship_finish, :seasons_completed, :last_updated
                )
                ON CONFLICT ("driverId") DO UPDATE SET
                    "totalRaces" = EXCLUDED."totalRaces",
                    wins = EXCLUDED.wins,
                    "secondPlaces" = EXCLUDED."secondPlaces", 
                    "thirdPlaces" = EXCLUDED."thirdPlaces",
                    podiums = EXCLUDED.podiums,
                    "avgFinishPosition" = EXCLUDED."avgFinishPosition",
                    "bestChampionshipFinish" = EXCLUDED."bestChampionshipFinish",
                    "avgChampionshipFinish" = EXCLUDED."avgChampionshipFinish",
                    "seasonsCompleted" = EXCLUDED."seasonsCompleted",
                    "lastUpdated" = EXCLUDED."lastUpdated"
            """), {
                **stats,
                'last_updated': datetime.now()
            })
        
        logger.info(f"Updated {driver_name}: {stats['wins']} wins, {stats['podiums']} podiums")

if __name__ == "__main__":
    logger.remove()
    logger.add(sys.stdout, level="INFO")
    
    try:
        calculate_and_populate_racing_stats()
        logger.success("Successfully populated racing statistics table!")
    except Exception as e:
        logger.error(f"Failed to populate racing statistics: {e}")
        sys.exit(1)