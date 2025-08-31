#!/usr/bin/env python3
"""
Validate Racecraft scores for notable F1 drivers
"""
import sys
import os
from pathlib import Path
import pandas as pd
from loguru import logger

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

from utils.database import db_manager

def validate_racecraft_scores():
    """Validate racecraft scores for well-known drivers"""
    logger.info("Validating racecraft scores...")
    
    try:
        engine = db_manager.connect()
        
        # Get notable drivers' racecraft scores
        query = '''
        SELECT dp."driverName", dp."racecraftScore", dp."racesAnalyzed", dp."careerSpan"
        FROM drivers_dna_profiles dp 
        WHERE dp."racecraftScore" IS NOT NULL 
        AND dp."driverName" IN (
            'Lewis Hamilton', 'Michael Schumacher', 'Sebastian Vettel', 
            'Fernando Alonso', 'Max Verstappen', 'Ayrton Senna',
            'Alain Prost', 'Nico Rosberg', 'Valtteri Bottas',
            'Kimi Raikkonen', 'Felipe Massa', 'Rubens Barrichello',
            'Daniel Ricciardo', 'Charles Leclerc', 'Lando Norris',
            'Jenson Button', 'David Coulthard', 'Mark Webber'
        )
        ORDER BY dp."racecraftScore" DESC
        '''
        
        results = pd.read_sql(query, engine)
        
        print('\nNotable Drivers Racecraft Scores:')
        print('=' * 70)
        print(f'{"Driver Name":20} | {"Score":>6} | {"Races":>6} | {"Career":>12}')
        print('-' * 70)
        
        for _, row in results.iterrows():
            print(f'{row["driverName"]:20} | {row["racecraftScore"]:6.1f} | {row["racesAnalyzed"]:6d} | {row["careerSpan"]:>12}')
        
        # Get top 10 racecraft masters
        top_query = '''
        SELECT dp."driverName", dp."racecraftScore", dp."racesAnalyzed"
        FROM drivers_dna_profiles dp 
        WHERE dp."racecraftScore" IS NOT NULL 
        AND dp."racesAnalyzed" >= 20
        ORDER BY dp."racecraftScore" DESC
        LIMIT 10
        '''
        
        top_results = pd.read_sql(top_query, engine)
        
        print('\n\nTop 10 Racecraft Masters (min 20 races):')
        print('=' * 50)
        print(f'{"Rank":>4} | {"Driver Name":20} | {"Score":>6} | {"Races":>6}')
        print('-' * 50)
        
        for i, row in top_results.iterrows():
            print(f'{i+1:4d} | {row["driverName"]:20} | {row["racecraftScore"]:6.1f} | {row["racesAnalyzed"]:6d}')
            
        # Get bottom 10 racecraft performers  
        bottom_query = '''
        SELECT dp."driverName", dp."racecraftScore", dp."racesAnalyzed"
        FROM drivers_dna_profiles dp 
        WHERE dp."racecraftScore" IS NOT NULL 
        AND dp."racesAnalyzed" >= 20
        ORDER BY dp."racecraftScore" ASC
        LIMIT 10
        '''
        
        bottom_results = pd.read_sql(bottom_query, engine)
        
        print('\n\nLowest 10 Racecraft Performers (min 20 races):')
        print('=' * 50)
        print(f'{"Rank":>4} | {"Driver Name":20} | {"Score":>6} | {"Races":>6}')
        print('-' * 50)
        
        for i, row in bottom_results.iterrows():
            print(f'{i+1:4d} | {row["driverName"]:20} | {row["racecraftScore"]:6.1f} | {row["racesAnalyzed"]:6d}')
            
        # Summary statistics
        stats_query = '''
        SELECT 
            COUNT(*) as total_drivers,
            AVG(dp."racecraftScore") as avg_score,
            MIN(dp."racecraftScore") as min_score,
            MAX(dp."racecraftScore") as max_score,
            STDDEV(dp."racecraftScore") as std_dev
        FROM drivers_dna_profiles dp 
        WHERE dp."racecraftScore" IS NOT NULL
        '''
        
        stats = pd.read_sql(stats_query, engine)
        
        print('\n\nRacecraft Score Statistics:')
        print('=' * 40)
        print(f'Total Drivers Analyzed: {stats["total_drivers"].iloc[0]}')
        print(f'Average Score: {stats["avg_score"].iloc[0]:.2f}')
        print(f'Score Range: {stats["min_score"].iloc[0]:.1f} - {stats["max_score"].iloc[0]:.1f}')
        print(f'Standard Deviation: {stats["std_dev"].iloc[0]:.2f}')
        
        # Compare racecraft vs other traits for top drivers
        comparison_query = '''
        SELECT dp."driverName", dp."racecraftScore", dp."aggressionScore", 
               dp."consistencyScore", dp."pressurePerformanceScore"
        FROM drivers_dna_profiles dp 
        WHERE dp."racecraftScore" IS NOT NULL 
        AND dp."driverName" IN (
            'Lewis Hamilton', 'Fernando Alonso', 'Michael Schumacher', 
            'Sebastian Vettel', 'Max Verstappen', 'Ayrton Senna'
        )
        ORDER BY dp."racecraftScore" DESC
        '''
        
        comparison = pd.read_sql(comparison_query, engine)
        
        print('\n\nRacecraft vs Other Traits (Top Drivers):')
        print('=' * 80)
        print(f'{"Driver":18} | {"Racecraft":>9} | {"Aggression":>9} | {"Consistency":>11} | {"Pressure":>8}')
        print('-' * 80)
        
        for _, row in comparison.iterrows():
            print(f'{row["driverName"]:18} | {row["racecraftScore"]:9.1f} | {row["aggressionScore"]:9.1f} | {row["consistencyScore"]:11.1f} | {row["pressurePerformanceScore"]:8.1f}')
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to validate racecraft scores: {e}")
        return False

if __name__ == "__main__":
    # Configure logging
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO"
    )
    
    success = validate_racecraft_scores()
    sys.exit(0 if success else 1)