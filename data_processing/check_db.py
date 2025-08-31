#!/usr/bin/env python3
"""
Check what's actually in the database
"""
import sys
import os
from pathlib import Path
import pandas as pd
from utils.database import db_manager

def main():
    engine = db_manager.connect()
    
    # Check circuits in database
    print("Checking circuits in database:")
    circuits_db = pd.read_sql("SELECT * FROM circuits ORDER BY \"circuitId\" LIMIT 10", engine)
    print(circuits_db)
    
    circuits_count = pd.read_sql('SELECT COUNT(*) as cnt FROM circuits', engine)['cnt'].iloc[0]
    print(f"\nCircuits in DB: {circuits_count}")
    
    # Check circuit ID range in DB
    circuit_range = pd.read_sql('SELECT MIN("circuitId") as min_id, MAX("circuitId") as max_id FROM circuits', engine)
    print(f"Circuit ID range in DB: {circuit_range['min_id'].iloc[0]} - {circuit_range['max_id'].iloc[0]}")
    
    # Try a simple race insert test
    print("\nTesting race constraint...")
    try:
        # Try to insert a single race with a known good circuitId
        test_race = pd.DataFrame({
            'raceId': [99999],
            'year': [2009],
            'round': [1],
            'circuitId': [1],  # Should exist in circuits table
            'name': ['Test Race'],
            'date': ['2009-03-29'],
            'time': ['06:00:00'],
            'url': ['http://test.com'],
            'fp1_date': [None], 'fp1_time': [None],
            'fp2_date': [None], 'fp2_time': [None],
            'fp3_date': [None], 'fp3_time': [None],
            'quali_date': [None], 'quali_time': [None],
            'sprint_date': [None], 'sprint_time': [None]
        })
        
        test_race.to_sql('races', engine, if_exists='append', index=False)
        print("Test race insert: SUCCESS")
        
        # Clean up
        with engine.begin() as conn:
            conn.execute(pd.io.sql.text("DELETE FROM races WHERE \"raceId\" = 99999"))
        
    except Exception as e:
        print(f"Test race insert: FAILED - {e}")

if __name__ == "__main__":
    main()