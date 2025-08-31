#!/usr/bin/env python3
"""
Import F1 CSV data into PostgreSQL database
"""
import sys
import os
from pathlib import Path
import pandas as pd
from tqdm import tqdm
from loguru import logger
from sqlalchemy import text

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from utils.database import db_manager
from utils.data_loader import F1DataLoader

def clean_data_for_db(df: pd.DataFrame, table_name: str) -> pd.DataFrame:
    """Clean DataFrame for database insertion"""
    df_clean = df.copy()
    
    # Replace NaN with None for proper NULL insertion
    df_clean = df_clean.replace({pd.NaT: None, pd.NA: None})
    df_clean = df_clean.where(pd.notna(df_clean), None)
    
    # Convert boolean columns to proper format
    bool_cols = df_clean.select_dtypes(include=['bool']).columns
    for col in bool_cols:
        df_clean[col] = df_clean[col].astype('boolean')
    
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

def create_table_mappings():
    """Define CSV to database table mappings"""
    return {
        'seasons': 'seasons',
        'circuits': 'circuits', 
        'constructors': 'constructors',
        'drivers': 'drivers',
        'races': 'races',
        'status': 'status',
        'results': 'results',
        'qualifying': 'qualifying',
        'lap_times': 'lap_times',
        'pit_stops': 'pit_stops',
        'driver_standings': 'driver_standings',
        'constructor_results': 'constructor_results',
        'constructor_standings': 'constructor_standings',
        'sprint_results': 'sprint_results'
    }

def import_csv_to_db(csv_name: str, df: pd.DataFrame, table_name: str, 
                    batch_size: int = 1000) -> None:
    """Import a single CSV DataFrame to database table"""
    logger.info(f"Importing {csv_name} to {table_name} ({len(df)} rows)")
    
    try:
        # Clean data
        df_clean = clean_data_for_db(df, table_name)
        
        # Import in batches to avoid memory issues
        total_batches = (len(df_clean) + batch_size - 1) // batch_size
        
        with tqdm(total=total_batches, desc=f"Importing {csv_name}") as pbar:
            for i in range(0, len(df_clean), batch_size):
                batch = df_clean.iloc[i:i + batch_size]
                batch_data = batch.to_dict('records')
                
                # Use pandas to_sql for efficient insertion
                engine = db_manager.connect()
                batch.to_sql(
                    name=table_name,
                    con=engine,
                    if_exists='append',
                    index=False,
                    method='multi'
                )
                
                pbar.update(1)
        
        logger.success(f"Successfully imported {len(df_clean)} rows to {table_name}")
        
    except Exception as e:
        logger.error(f"Failed to import {csv_name} to {table_name}: {e}")
        raise

def truncate_tables(table_mappings: dict) -> None:
    """Truncate all tables before import (optional)"""
    logger.info("Truncating existing tables...")
    
    try:
        engine = db_manager.connect()
        
        # Truncate tables in reverse dependency order to avoid foreign key issues
        # DNA tables first (no dependencies)
        dna_tables = ['drivers_dna_breakdown', 'drivers_dna_profiles']
        
        # Then F1 data tables in reverse dependency order
        f1_tables = [
            'sprint_results', 'constructor_standings', 'constructor_results',
            'driver_standings', 'pit_stops', 'lap_times', 'qualifying',
            'results', 'races', 'status', 'constructors', 'drivers', 
            'circuits', 'seasons'
        ]
        
        all_tables_to_truncate = dna_tables + f1_tables
        
        with engine.begin() as conn:
            for table_name in all_tables_to_truncate:
                try:
                    # Use CASCADE to handle any remaining foreign key dependencies
                    conn.execute(text(f"TRUNCATE TABLE {table_name} CASCADE;"))
                    logger.info(f"Truncated {table_name}")
                except Exception as e:
                    # Some tables might not exist or be empty - that's fine
                    logger.debug(f"Could not truncate {table_name}: {e}")
        
        logger.info("Table truncation completed")
        
    except Exception as e:
        logger.error(f"Error truncating tables: {e}")
        # Don't raise the error - we can continue with import even if truncation fails
        logger.warning("Continuing with import despite truncation error...")

def main():
    """Main import function"""
    logger.info("Starting F1 CSV data import")
    
    # Initialize data loader
    data_loader = F1DataLoader()
    
    # Load all CSV files
    logger.info("Loading CSV files...")
    csv_data = data_loader.load_all_csvs()
    
    if not csv_data:
        logger.error("No CSV data loaded. Exiting.")
        return False
    
    # Print data summary
    summary = data_loader.get_data_summary(csv_data)
    logger.info("Data Summary:")
    for name, stats in summary.items():
        logger.info(f"  {name}: {stats['rows']:,} rows, {stats['columns']} columns")
    
    # Get table mappings
    table_mappings = create_table_mappings()
    
    # Automatically truncate existing data
    logger.info("Truncating existing tables...")
    truncate_tables(table_mappings)
    
    # Import data in dependency order
    import_order = [
        'seasons', 'circuits', 'constructors', 'drivers', 
        'races', 'status', 'results', 'qualifying',
        'lap_times', 'pit_stops', 'driver_standings',
        'constructor_results', 'constructor_standings', 'sprint_results'
    ]
    
    success_count = 0
    total_rows_imported = 0
    
    for csv_name in import_order:
        if csv_name not in csv_data:
            logger.warning(f"Skipping missing CSV: {csv_name}")
            continue
        
        table_name = table_mappings[csv_name]
        df = csv_data[csv_name]
        
        try:
            import_csv_to_db(csv_name, df, table_name)
            success_count += 1
            total_rows_imported += len(df)
        except Exception as e:
            logger.error(f"Failed to import {csv_name}: {e}")
            continue
    
    logger.success(f"Import completed: {success_count}/{len(import_order)} tables imported")
    logger.success(f"Total rows imported: {total_rows_imported:,}")
    
    return success_count == len([name for name in import_order if name in csv_data])

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
        logger.warning("Import cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Import failed with error: {e}")
        sys.exit(1)