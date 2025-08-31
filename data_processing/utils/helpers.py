"""
Helper functions for F1 data processing
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from loguru import logger

def calculate_era_weights(year: int, current_year: int = None) -> float:
    """
    Calculate exponential decay weight for historical data
    More recent years get higher weight for DNA calculations
    """
    if current_year is None:
        current_year = datetime.now().year
    
    years_ago = current_year - year
    # Exponential decay: weight = e^(-lambda * years_ago)
    # Lambda = 0.1 gives reasonable decay over ~10 years
    decay_rate = 0.1
    weight = np.exp(-decay_rate * years_ago)
    return max(weight, 0.1)  # Minimum weight of 0.1

def normalize_to_percentile(values: pd.Series, min_score: int = 0, max_score: int = 100) -> pd.Series:
    """
    Normalize values to percentile rankings (0-100 scale)
    """
    if values.empty or values.isna().all():
        return pd.Series(dtype=float)
    
    # Remove NaN values for percentile calculation
    valid_values = values.dropna()
    if len(valid_values) == 0:
        return pd.Series([np.nan] * len(values))
    
    # Calculate percentile ranks
    percentiles = valid_values.rank(pct=True) * 100
    
    # Map back to original series
    result = pd.Series([np.nan] * len(values), index=values.index)
    result.loc[valid_values.index] = percentiles
    
    # Scale to desired range
    if min_score != 0 or max_score != 100:
        result = result * (max_score - min_score) / 100 + min_score
    
    return result

def calculate_teammate_baseline(df: pd.DataFrame, driver_col: str = 'driverId', 
                               constructor_col: str = 'constructorId',
                               metric_col: str = 'points') -> pd.DataFrame:
    """
    Calculate teammate performance baseline for normalization
    """
    # Group by constructor and race to get teammate comparisons
    baseline_data = []
    
    for (constructor, race), group in df.groupby([constructor_col, 'raceId']):
        if len(group) < 2:  # Need at least 2 drivers for comparison
            continue
            
        drivers = group[driver_col].tolist()
        metrics = group[metric_col].tolist()
        
        # Calculate relative performance for each driver
        mean_metric = np.mean(metrics)
        for driver, metric in zip(drivers, metrics):
            baseline_data.append({
                'driverId': driver,
                'raceId': race,
                'constructorId': constructor,
                'metric_value': metric,
                'teammate_avg': mean_metric,
                'relative_performance': metric - mean_metric
            })
    
    return pd.DataFrame(baseline_data)

def detect_outliers(series: pd.Series, method: str = 'iqr', threshold: float = 1.5) -> pd.Series:
    """
    Detect outliers in a data series
    """
    if method == 'iqr':
        Q1 = series.quantile(0.25)
        Q3 = series.quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - threshold * IQR
        upper_bound = Q3 + threshold * IQR
        return (series < lower_bound) | (series > upper_bound)
    
    elif method == 'zscore':
        z_scores = np.abs((series - series.mean()) / series.std())
        return z_scores > threshold
    
    else:
        raise ValueError("Method must be 'iqr' or 'zscore'")

def calculate_moving_average(df: pd.DataFrame, value_col: str, 
                           window: int = 5, groupby_cols: List[str] = None) -> pd.Series:
    """
    Calculate moving average with optional grouping
    """
    if groupby_cols:
        return df.groupby(groupby_cols)[value_col].transform(
            lambda x: x.rolling(window=window, min_periods=1).mean()
        )
    else:
        return df[value_col].rolling(window=window, min_periods=1).mean()

def parse_lap_time(time_str: str) -> Optional[float]:
    """
    Parse lap time string (e.g., '1:23.456') to total seconds
    """
    if pd.isna(time_str) or not isinstance(time_str, str):
        return None
    
    try:
        # Handle different time formats
        if ':' in time_str:
            # Format: M:SS.mmm or MM:SS.mmm
            parts = time_str.split(':')
            minutes = float(parts[0])
            seconds = float(parts[1])
            return minutes * 60 + seconds
        else:
            # Just seconds
            return float(time_str)
    except (ValueError, IndexError):
        return None

def calculate_position_changes(qualifying_df: pd.DataFrame, 
                             results_df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate position changes from qualifying to race finish
    """
    # Merge qualifying and results data
    merged = qualifying_df.merge(
        results_df,
        on=['raceId', 'driverId'],
        suffixes=('_quali', '_race')
    )
    
    # Calculate position changes
    merged['positions_gained'] = merged['position_quali'] - merged['position_race']
    merged['grid_to_finish'] = merged['grid'] - merged['position_race']
    
    return merged[['raceId', 'driverId', 'positions_gained', 'grid_to_finish']]

def identify_championship_decisive_races(driver_standings_df: pd.DataFrame, 
                                       year: int) -> List[str]:
    """
    Identify races where championship lead changed hands or was decided
    """
    season_standings = driver_standings_df[
        driver_standings_df['raceId'].str.contains(str(year), na=False)
    ].copy()
    
    if season_standings.empty:
        return []
    
    # Sort by race order and get championship leader after each race
    season_standings['race_order'] = season_standings.groupby('raceId')['raceId'].transform('first')
    season_standings = season_standings.sort_values(['race_order', 'position'])
    
    championship_changing_races = []
    previous_leader = None
    
    for race_id in season_standings['raceId'].unique():
        race_standings = season_standings[season_standings['raceId'] == race_id]
        current_leader = race_standings.iloc[0]['driverId']
        
        if previous_leader and current_leader != previous_leader:
            championship_changing_races.append(race_id)
        
        previous_leader = current_leader
    
    return championship_changing_races

def calculate_consistency_metrics(driver_results: pd.DataFrame) -> Dict[str, float]:
    """
    Calculate various consistency metrics for a driver
    """
    if driver_results.empty:
        return {}
    
    # Points scoring consistency
    points_std = driver_results['points'].std()
    points_mean = driver_results['points'].mean()
    points_cv = points_std / points_mean if points_mean > 0 else np.inf
    
    # Finishing position consistency
    finish_positions = driver_results['position'].dropna()
    position_std = finish_positions.std() if not finish_positions.empty else np.nan
    
    # DNF rate
    total_races = len(driver_results)
    dnf_count = driver_results['position'].isna().sum()
    dnf_rate = dnf_count / total_races if total_races > 0 else 0
    
    # Points scoring rate
    points_scoring_races = (driver_results['points'] > 0).sum()
    points_scoring_rate = points_scoring_races / total_races if total_races > 0 else 0
    
    return {
        'points_coefficient_of_variation': points_cv,
        'position_std_dev': position_std,
        'dnf_rate': dnf_rate,
        'points_scoring_rate': points_scoring_rate,
        'total_races': total_races
    }

def safe_divide(numerator: pd.Series, denominator: pd.Series, 
                default_value: float = 0.0) -> pd.Series:
    """
    Safely divide two series, handling division by zero
    """
    result = numerator / denominator
    result = result.replace([np.inf, -np.inf], default_value)
    result = result.fillna(default_value)
    return result