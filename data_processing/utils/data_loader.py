"""
CSV data loading utilities
"""
import pandas as pd
from pathlib import Path
from typing import Dict, Optional
from loguru import logger

class F1DataLoader:
    """Loads and validates F1 CSV data"""
    
    def __init__(self, data_dir: str = "f1_data"):
        self.data_dir = Path(data_dir)
        if not self.data_dir.exists():
            raise FileNotFoundError(f"Data directory {data_dir} not found")
        
        # Define expected CSV files and their key columns
        self.csv_files = {
            'circuits': ['circuitId', 'circuitRef', 'name', 'location', 'country'],
            'constructors': ['constructorId', 'constructorRef', 'name', 'nationality'],
            'drivers': ['driverId', 'driverRef', 'forename', 'surname'],
            'races': ['raceId', 'year', 'round', 'circuitId', 'name', 'date'],
            'results': ['resultId', 'raceId', 'driverId', 'constructorId', 'grid', 'position'],
            'qualifying': ['qualifyId', 'raceId', 'driverId', 'constructorId', 'position'],
            'lap_times': ['raceId', 'driverId', 'lap', 'position', 'time'],
            'pit_stops': ['raceId', 'driverId', 'stop', 'lap', 'duration'],
            'driver_standings': ['driverStandingsId', 'raceId', 'driverId', 'points', 'position'],
            'constructor_results': ['constructorResultsId', 'raceId', 'constructorId', 'points'],
            'constructor_standings': ['constructorStandingsId', 'raceId', 'constructorId', 'points', 'position'],
            'sprint_results': ['resultId', 'raceId', 'driverId', 'constructorId', 'position'],
            'status': ['statusId', 'status'],
            'seasons': ['year', 'url']
        }
    
    def load_csv(self, filename: str, validate: bool = True) -> pd.DataFrame:
        """Load a single CSV file with optional validation"""
        file_path = self.data_dir / f"{filename}.csv"
        
        if not file_path.exists():
            raise FileNotFoundError(f"CSV file {file_path} not found")
        
        logger.info(f"Loading {filename}.csv...")
        
        try:
            # Load with appropriate data types, handling F1 data NULL values
            df = pd.read_csv(
                file_path, 
                low_memory=False,
                na_values=['\\N', 'NULL', '']  # Handle F1 data NULL format
            )
            
            # Basic validation
            if validate and filename in self.csv_files:
                expected_cols = self.csv_files[filename]
                missing_cols = [col for col in expected_cols if col not in df.columns]
                if missing_cols:
                    logger.warning(f"Missing expected columns in {filename}: {missing_cols}")
            
            # Data type conversions
            df = self._convert_data_types(df, filename)
            
            logger.info(f"Loaded {len(df)} rows from {filename}.csv")
            return df
            
        except Exception as e:
            logger.error(f"Error loading {filename}.csv: {e}")
            raise
    
    def _convert_data_types(self, df: pd.DataFrame, filename: str) -> pd.DataFrame:
        """Convert data types for better performance and accuracy"""
        
        # Convert date columns
        if filename == 'races':
            date_cols = ['date', 'fp1_date', 'fp2_date', 'fp3_date', 'quali_date', 'sprint_date']
            for col in date_cols:
                if col in df.columns:
                    df[col] = pd.to_datetime(df[col], errors='coerce')
        
        if filename == 'drivers':
            if 'dob' in df.columns:
                df['dob'] = pd.to_datetime(df['dob'], errors='coerce')
        
        # Convert numeric columns
        numeric_conversions = {
            'races': ['year', 'round'],
            'results': ['grid', 'position', 'positionOrder', 'points', 'laps', 'milliseconds', 'fastestLap', 'rank'],
            'qualifying': ['number', 'position'],
            'lap_times': ['lap', 'position', 'milliseconds'],
            'pit_stops': ['stop', 'lap', 'milliseconds'],
            'driver_standings': ['points', 'position', 'wins'],
            'constructor_standings': ['points', 'position', 'wins'],
            'constructor_results': ['points'],
            'sprint_results': ['number', 'grid', 'position', 'positionOrder', 'points', 'laps', 'milliseconds', 'fastestLap'],
            'circuits': ['lat', 'lng', 'alt'],
            'drivers': ['number'],
            'seasons': ['year']
        }
        
        if filename in numeric_conversions:
            for col in numeric_conversions[filename]:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
        
        return df
    
    def load_all_csvs(self) -> Dict[str, pd.DataFrame]:
        """Load all CSV files and return as dictionary"""
        data = {}
        
        for filename in self.csv_files.keys():
            try:
                data[filename] = self.load_csv(filename)
            except FileNotFoundError:
                logger.warning(f"Skipping missing file: {filename}.csv")
                continue
            except Exception as e:
                logger.error(f"Failed to load {filename}.csv: {e}")
                continue
        
        logger.info(f"Successfully loaded {len(data)} CSV files")
        return data
    
    def get_data_summary(self, data: Dict[str, pd.DataFrame]) -> Dict[str, dict]:
        """Generate summary statistics for loaded data"""
        summary = {}
        
        for name, df in data.items():
            summary[name] = {
                'rows': len(df),
                'columns': len(df.columns),
                'memory_usage_mb': df.memory_usage(deep=True).sum() / 1024 / 1024,
                'null_counts': df.isnull().sum().to_dict(),
                'date_range': None
            }
            
            # Add date range for time-series data
            if name == 'races' and 'date' in df.columns:
                summary[name]['date_range'] = {
                    'start': df['date'].min().strftime('%Y-%m-%d') if pd.notna(df['date'].min()) else None,
                    'end': df['date'].max().strftime('%Y-%m-%d') if pd.notna(df['date'].max()) else None
                }
        
        return summary