"""
Base class for DNA trait calculators
"""
from abc import ABC, abstractmethod
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from loguru import logger

class BaseDNACalculator(ABC):
    """Abstract base class for all DNA trait calculators"""
    
    def __init__(self, name: str, min_races_required: int = 10):
        self.name = name
        self.min_races_required = min_races_required
        self.logger = logger.bind(calculator=name)
        
    @abstractmethod
    def calculate_trait(self, driver_id: str, driver_data: Dict[str, pd.DataFrame]) -> Dict:
        """
        Calculate the DNA trait score for a specific driver
        
        Args:
            driver_id: The driver's unique identifier
            driver_data: Dictionary containing relevant data for the driver
                - 'results': Driver's race results
                - 'qualifying': Driver's qualifying data  
                - 'lap_times': Driver's lap times (if available)
                - 'pit_stops': Driver's pit stop data (if available)
                - 'standings': Driver's championship standings
                
        Returns:
            Dictionary containing:
                - 'score': Final trait score (0-100)
                - 'raw_value': Unnormalized metric value
                - 'contributing_stats': Dictionary of statistics that contributed to score
                - 'calculation_notes': String explaining the calculation
                - 'races_analyzed': Number of races used in calculation
        """
        pass
    
    def validate_driver_data(self, driver_id: str, driver_data: Dict[str, pd.DataFrame]) -> bool:
        """
        Validate that driver has sufficient data for analysis
        """
        if 'results' not in driver_data:
            self.logger.warning(f"No results data for driver {driver_id}")
            return False
            
        results = driver_data['results']
        if len(results) < self.min_races_required:
            self.logger.warning(f"Insufficient races for {driver_id}: {len(results)} < {self.min_races_required}")
            return False
            
        return True
    
    def apply_era_weighting(self, df: pd.DataFrame, year_col: str = 'year', 
                           value_col: str = 'value') -> pd.Series:
        """
        Apply exponential decay weighting based on year
        """
        from utils.helpers import calculate_era_weights
        
        if year_col not in df.columns:
            self.logger.warning(f"Year column '{year_col}' not found, skipping era weighting")
            return df[value_col] if value_col in df.columns else pd.Series()
        
        weights = df[year_col].apply(calculate_era_weights)
        if value_col in df.columns:
            return df[value_col] * weights
        else:
            return weights
    
    def calculate_teammate_relative_performance(self, driver_results: pd.DataFrame, 
                                              all_results: pd.DataFrame, 
                                              metric_col: str = 'points') -> pd.Series:
        """
        Calculate driver performance relative to teammates
        """
        from ..utils.helpers import calculate_teammate_baseline
        
        # Get baseline data for this driver
        baseline_df = calculate_teammate_baseline(
            all_results, 
            metric_col=metric_col
        )
        
        # Filter for this driver's data
        driver_baseline = baseline_df[
            baseline_df['driverId'] == driver_results['driverId'].iloc[0]
        ]
        
        if driver_baseline.empty:
            self.logger.warning("No teammate comparison data available")
            return pd.Series()
        
        return driver_baseline['relative_performance']
    
    def normalize_score(self, raw_values: pd.Series, method: str = 'percentile') -> float:
        """
        Normalize raw values to 0-100 score
        """
        from ..utils.helpers import normalize_to_percentile
        
        if raw_values.empty:
            return 50.0  # Default neutral score
        
        if method == 'percentile':
            percentile_scores = normalize_to_percentile(raw_values)
            return percentile_scores.iloc[-1] if not percentile_scores.empty else 50.0
        
        elif method == 'zscore':
            # Convert z-score to 0-100 scale
            mean_val = raw_values.mean()
            std_val = raw_values.std()
            if std_val == 0:
                return 50.0
            
            z_score = (raw_values.iloc[-1] - mean_val) / std_val
            # Map z-score to 0-100 (z=0 -> 50, z=2 -> 84, z=-2 -> 16)
            normalized = 50 + (z_score * 17)  # Approximately
            return max(0, min(100, normalized))
        
        else:
            raise ValueError(f"Unknown normalization method: {method}")
    
    def get_calculation_metadata(self, driver_id: str, driver_data: Dict[str, pd.DataFrame]) -> Dict:
        """
        Get metadata about the calculation
        """
        results = driver_data.get('results', pd.DataFrame())
        
        metadata = {
            'driver_id': driver_id,
            'total_races': len(results),
            'trait_name': self.name,
            'min_races_required': self.min_races_required
        }
        
        if not results.empty and 'year' in results.columns:
            metadata.update({
                'career_start': int(results['year'].min()),
                'career_end': int(results['year'].max()),
                'years_active': int(results['year'].nunique())
            })
        
        return metadata
    
    @abstractmethod
    def get_trait_description(self) -> str:
        """Return a description of what this trait measures"""
        pass