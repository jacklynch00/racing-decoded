#!/usr/bin/env python3
"""
Test importing just a few races to isolate the issue
"""
import pandas as pd
import sys
from pathlib import Path
from utils.database import db_manager

def clean_data_for_db(df):
    """Clean DataFrame for database insertion"""
    df_clean = df.copy()
    
    # Replace NaN with None for proper NULL insertion
    df_clean = df_clean.replace({pd.NaT: None, pd.NA: None})
    df_clean = df_clean.where(pd.notna(df_clean), None)
    
    # Handle string columns carefully - don't convert None to string
    str_cols = df_clean.select_dtypes(include=['object']).columns
    for col in str_cols:
        if df_clean[col].dtype == 'object':
            # Only process non-null values to avoid converting None to "None"
            mask = df_clean[col].notna()
            if mask.any():
                df_clean.loc[mask, col] = df_clean.loc[mask, col].astype(str).str.strip()
                # Replace "nan" strings with None, but preserve actual None values
                df_clean.loc[mask, col] = df_clean.loc[mask, col].replace('nan', None)
    
    return df_clean

def main():
    # Load races data
    races_df = pd.read_csv('f1_data/races.csv', na_values=['\\N', 'NULL', ''])
    print(f"Loaded {len(races_df)} races")
    
    # Take just first 3 races for testing
    test_races = races_df.head(3).copy()
    print(f"Testing with {len(test_races)} races")
    
    # Show the data
    print("\nTest data:")
    print(test_races[['raceId', 'year', 'name', 'circuitId', 'date']])
    
    # Clean the data
    test_races_clean = clean_data_for_db(test_races)
    print(f"\nCleaned data dtypes:")
    print(test_races_clean.dtypes)
    
    # Check for any problematic values
    print(f"\nNull values per column:")
    print(test_races_clean.isna().sum())
    
    # Try to import
    try:
        engine = db_manager.connect()
        
        # First clear any existing test data
        with engine.begin() as conn:
            from sqlalchemy import text
            conn.execute(text("DELETE FROM races WHERE \"raceId\" IN (1, 2, 3)"))
        
        print(f"\nAttempting import...")
        test_races_clean.to_sql('races', engine, if_exists='append', index=False, method='multi')
        print(f"SUCCESS: Imported {len(test_races_clean)} races")
        
    except Exception as e:
        print(f"FAILED: {e}")
        # Show more details
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()