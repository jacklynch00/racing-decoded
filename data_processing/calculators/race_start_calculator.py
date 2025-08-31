import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
from .base_calculator import BaseDNACalculator

class RaceStartCalculator(BaseDNACalculator):
    """
    Calculates Race Start Performance DNA trait.
    
    Measures a driver's ability to gain or maintain position on the first lap.
    Based on position changes from grid to end of lap 1, accounting for grid position bias.
    """
    
    def __init__(self):
        super().__init__("Race Start Performance", min_races_required=5)
    
    def get_trait_name(self) -> str:
        return "Race Start Performance"
    
    def get_trait_description(self) -> str:
        return "Measures a driver's ability to gain or maintain position on the first lap of a race"
    
    def calculate_trait(self, driver_id: str, driver_data: Dict) -> Dict[str, Any]:
        """
        Calculate race start performance score.
        
        Args:
            driver_id: Driver identifier
            driver_data: Dictionary containing 'results' and 'lap_times' DataFrames
            
        Returns:
            Dictionary with score and contributing statistics
        """
        try:
            results_df = driver_data.get('results', pd.DataFrame())
            lap_times_df = driver_data.get('lap_times', pd.DataFrame())
            
            if results_df.empty or lap_times_df.empty:
                return {
                    'score': 50.0,
                    'confidence': 'low',
                    'reason': 'No race results or lap times data available',
                    'contributingStats': {}
                }
            
            # Get lap 1 positions for this driver
            lap1_positions = lap_times_df[lap_times_df['lap'] == 1][['raceId', 'position']].copy()
            lap1_positions.rename(columns={'position': 'lap1_position'}, inplace=True)
            
            # Merge results with lap 1 positions
            merged_data = results_df.merge(lap1_positions, on='raceId', how='inner')
            
            # Filter for races with both grid position and lap 1 position data
            valid_data = merged_data.dropna(subset=['grid', 'lap1_position'])
            
            if len(valid_data) < 5:
                return {
                    'score': 50.0,
                    'confidence': 'low',
                    'reason': f'Insufficient data: only {len(valid_data)} races with grid/lap1 data',
                    'contributingStats': {}
                }
            
            # Calculate position changes (negative = positions gained)
            valid_data = valid_data.copy()
            valid_data['position_change'] = valid_data['lap1_position'] - valid_data['grid']
            
            # Filter out races with major incidents (position changes > 10 are likely crashes/incidents)
            clean_data = valid_data[abs(valid_data['position_change']) <= 10]
            
            if len(clean_data) < 3:
                return {
                    'score': 50.0,
                    'confidence': 'low', 
                    'reason': f'Too few clean starts: only {len(clean_data)} races without major incidents',
                    'contributingStats': {}
                }
            
            # Calculate metrics
            avg_position_change = clean_data['position_change'].mean()
            positions_gained_pct = (clean_data['position_change'] < 0).mean() * 100
            avg_grid_position = clean_data['grid'].mean()
            
            # Normalize score accounting for grid position bias
            # It's harder to gain positions from the front of the grid
            grid_adjustment = self._calculate_grid_adjustment(avg_grid_position)
            
            # Base score calculation
            # Negative position change (gaining positions) increases score
            # Positive position change (losing positions) decreases score
            base_score = 50 - (avg_position_change * 5)  # Each position = 5 points
            
            # Apply grid position adjustment
            adjusted_score = base_score + grid_adjustment
            
            # Clamp to 0-100 range
            final_score = max(0, min(100, adjusted_score))
            
            # Calculate confidence based on sample size and consistency
            position_change_std = clean_data['position_change'].std()
            confidence = self._calculate_confidence(len(clean_data), position_change_std)
            
            contributing_stats = {
                'averagePositionChange': float(avg_position_change),
                'positionsGainedPercentage': float(positions_gained_pct),
                'averageGridPosition': float(avg_grid_position),
                'cleanStartsAnalyzed': int(len(clean_data)),
                'totalRacesWithData': int(len(valid_data)),
                'standardDeviation': float(position_change_std),
                'gridAdjustment': float(grid_adjustment)
            }
            
            return {
                'score': float(final_score),
                'confidence': confidence,
                'contributingStats': self._convert_numpy_types(contributing_stats)
            }
            
        except Exception as e:
            return {
                'score': 50.0,
                'confidence': 'error',
                'reason': f'Calculation error: {str(e)}',
                'contributingStats': {}
            }
    
    def _calculate_grid_adjustment(self, avg_grid_pos: float) -> float:
        """
        Calculate adjustment based on average grid position.
        Drivers starting further back have more opportunity to gain positions.
        """
        if avg_grid_pos <= 5:  # Front runners
            return 5  # Bonus for maintaining position from front
        elif avg_grid_pos <= 10:  # Mid-field
            return 2
        else:  # Back markers
            return -2  # Slight penalty as they have more opportunity to gain
    
    def _calculate_confidence(self, sample_size: int, std_dev: float) -> str:
        """Calculate confidence level based on sample size and consistency."""
        if sample_size >= 30 and std_dev <= 2.0:
            return 'high'
        elif sample_size >= 15 and std_dev <= 3.0:
            return 'medium'
        else:
            return 'low'
    
    def _convert_numpy_types(self, obj):
        """Convert numpy types to native Python types for JSON serialization."""
        if isinstance(obj, dict):
            return {key: self._convert_numpy_types(value) for key, value in obj.items()}
        elif isinstance(obj, (np.integer, np.floating)):
            return obj.item()
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif pd.isna(obj) or (isinstance(obj, float) and np.isnan(obj)):
            return None
        else:
            return obj