"""
Aggression Score Calculator

Measures driver aggression through:
1. Overtaking rate (positions gained during races vs qualifying)
2. First lap performance (positions gained/lost on lap 1)
3. Late-race moves (position changes in final 10 laps)
"""
import pandas as pd
import numpy as np
from typing import Dict, List
from calculators.base_calculator import BaseDNACalculator

class AggressionCalculator(BaseDNACalculator):
    
    def __init__(self):
        super().__init__("Aggression", min_races_required=15)
    
    def calculate_trait(self, driver_id: str, driver_data: Dict[str, pd.DataFrame]) -> Dict:
        """Calculate aggression score for a driver"""
        
        if not self.validate_driver_data(driver_id, driver_data):
            return self._default_result(driver_id)
        
        results = driver_data['results']
        qualifying = driver_data.get('qualifying', pd.DataFrame())
        lap_times = driver_data.get('lap_times', pd.DataFrame())
        
        # Merge results with qualifying data
        if not qualifying.empty:
            merged_data = results.merge(
                qualifying[['raceId', 'driverId', 'position']].rename(columns={'position': 'quali_position'}),
                on=['raceId', 'driverId'],
                how='left'
            )
        else:
            merged_data = results.copy()
            merged_data['quali_position'] = merged_data['grid']  # Use grid as fallback
        
        contributing_stats = {}
        component_scores = []
        
        # 1. Overall Overtaking Rate (40% weight)
        overtaking_score = self._calculate_overtaking_rate(merged_data)
        contributing_stats['overtaking_rate'] = overtaking_score
        component_scores.append(('overtaking', overtaking_score, 0.4))
        
        # 2. First Lap Performance (35% weight)
        first_lap_score = self._calculate_first_lap_aggression(merged_data, lap_times)
        contributing_stats['first_lap_aggression'] = first_lap_score
        component_scores.append(('first_lap', first_lap_score, 0.35))
        
        # 3. Late Race Aggression (25% weight)
        late_race_score = self._calculate_late_race_moves(merged_data, lap_times)
        contributing_stats['late_race_moves'] = late_race_score
        component_scores.append(('late_race', late_race_score, 0.25))
        
        # Calculate weighted final score
        valid_scores = [(name, score, weight) for name, score, weight in component_scores if not pd.isna(score)]
        
        if not valid_scores:
            return self._default_result(driver_id)
        
        # Normalize weights for valid scores
        total_weight = sum(weight for _, _, weight in valid_scores)
        final_score = sum(score * (weight / total_weight) for _, score, weight in valid_scores)
        
        # Apply era weighting if year data available
        if 'year' in merged_data.columns:
            weighted_final = self._apply_era_weighting_to_score(final_score, merged_data)
            final_score = weighted_final
        
        return {
            'score': max(0, min(100, final_score)),
            'raw_value': final_score,
            'contributing_stats': contributing_stats,
            'calculation_notes': self._generate_calculation_notes(contributing_stats),
            'races_analyzed': len(merged_data),
            'component_breakdown': {name: score for name, score, _ in valid_scores}
        }
    
    def _calculate_overtaking_rate(self, merged_data: pd.DataFrame) -> float:
        """Calculate overall overtaking rate"""
        # Filter for races where both qualifying and race finish positions are available
        valid_races = merged_data.dropna(subset=['quali_position', 'position'])
        
        if valid_races.empty:
            return np.nan
        
        # Calculate positions gained (negative means lost positions)
        valid_races = valid_races.copy()
        valid_races['positions_gained'] = valid_races['quali_position'] - valid_races['position']
        
        # Focus on actual overtaking (positive gains)
        overtaking_races = valid_races[valid_races['positions_gained'] > 0]
        
        if len(valid_races) == 0:
            return np.nan
        
        # Metrics for overtaking aggression
        avg_positions_gained = valid_races['positions_gained'].mean()
        overtaking_frequency = len(overtaking_races) / len(valid_races)
        max_positions_gained = valid_races['positions_gained'].max()
        
        # Combine metrics into aggression score
        # Higher gains = more aggressive
        gain_score = min(100, max(0, avg_positions_gained * 10 + 50))  # Scale average gains
        frequency_score = overtaking_frequency * 100  # Percentage of races with overtaking
        peak_score = min(100, max_positions_gained * 5)  # Reward big overtaking performances
        
        # Weighted combination
        overtaking_score = (gain_score * 0.5 + frequency_score * 0.3 + peak_score * 0.2)
        
        return overtaking_score
    
    def _calculate_first_lap_aggression(self, merged_data: pd.DataFrame, lap_times: pd.DataFrame) -> float:
        """Calculate first lap aggression using position changes"""
        
        if lap_times.empty:
            # Fallback: use grid vs first scored position as proxy
            return self._calculate_first_lap_fallback(merged_data)
        
        # Get lap 1 data
        lap_1_data = lap_times[lap_times['lap'] == 1].copy()
        
        if lap_1_data.empty:
            return self._calculate_first_lap_fallback(merged_data)
        
        # Merge with race results to get starting positions
        lap_1_merged = lap_1_data.merge(
            merged_data[['raceId', 'driverId', 'grid', 'quali_position']],
            on=['raceId', 'driverId'],
            how='left'
        )
        
        if lap_1_merged.empty:
            return np.nan
        
        # Calculate first lap position changes
        lap_1_merged['first_lap_gains'] = lap_1_merged['grid'] - lap_1_merged['position']
        
        # Calculate aggression metrics
        avg_first_lap_gains = lap_1_merged['first_lap_gains'].mean()
        aggressive_first_laps = (lap_1_merged['first_lap_gains'] > 1).sum()  # Gained more than 1 position
        total_first_laps = len(lap_1_merged)
        
        if total_first_laps == 0:
            return np.nan
        
        # Score components
        gain_score = min(100, max(0, avg_first_lap_gains * 15 + 50))
        aggression_frequency = (aggressive_first_laps / total_first_laps) * 100
        
        first_lap_score = (gain_score * 0.7 + aggression_frequency * 0.3)
        
        return first_lap_score
    
    def _calculate_first_lap_fallback(self, merged_data: pd.DataFrame) -> float:
        """Fallback first lap calculation using grid vs race position"""
        valid_data = merged_data.dropna(subset=['grid', 'position']).copy()
        
        if valid_data.empty:
            return np.nan
        
        # Approximate first lap performance by looking at early race gains
        valid_data['early_gains'] = valid_data['grid'] - valid_data['position']
        
        # Weight races where driver finished (no DNFs skewing data)
        finished_races = valid_data[valid_data['position'].notna()]
        
        if finished_races.empty:
            return np.nan
        
        avg_gains = finished_races['early_gains'].mean()
        gain_score = min(100, max(0, avg_gains * 8 + 50))
        
        return gain_score
    
    def _calculate_late_race_moves(self, merged_data: pd.DataFrame, lap_times: pd.DataFrame) -> float:
        """Calculate late race aggression"""
        
        if lap_times.empty:
            return np.nan
        
        # For each race, look at position changes in final 10 laps
        late_race_scores = []
        
        for race_id in merged_data['raceId'].unique():
            race_lap_times = lap_times[lap_times['raceId'] == race_id]
            
            if race_lap_times.empty:
                continue
            
            # Get maximum lap number for this race
            max_lap = race_lap_times['lap'].max()
            
            if max_lap < 10:  # Need at least 10 laps for analysis
                continue
            
            # Define "late race" as final 10 laps or final 20% of race, whichever is larger
            late_race_threshold = max(max_lap - 9, int(max_lap * 0.8))
            
            # Get driver's lap times in late race period
            driver_late_laps = race_lap_times[
                (race_lap_times['driverId'] == merged_data['driverId'].iloc[0]) &
                (race_lap_times['lap'] >= late_race_threshold)
            ].sort_values('lap')
            
            if len(driver_late_laps) < 2:  # Need at least 2 laps to measure change
                continue
            
            # Calculate position changes in late race
            first_late_position = driver_late_laps['position'].iloc[0]
            final_late_position = driver_late_laps['position'].iloc[-1]
            
            late_race_gains = first_late_position - final_late_position
            late_race_scores.append(late_race_gains)
        
        if not late_race_scores:
            return np.nan
        
        # Calculate late race aggression score
        avg_late_gains = np.mean(late_race_scores)
        aggressive_finishes = sum(1 for score in late_race_scores if score > 0)
        total_races = len(late_race_scores)
        
        gain_score = min(100, max(0, avg_late_gains * 12 + 50))
        frequency_score = (aggressive_finishes / total_races) * 100
        
        late_race_score = (gain_score * 0.6 + frequency_score * 0.4)
        
        return late_race_score
    
    def _apply_era_weighting_to_score(self, score: float, merged_data: pd.DataFrame) -> float:
        """Apply era weighting to the final score"""
        if 'year' not in merged_data.columns:
            return score
        
        # Create a series of scores per year and apply weighting
        yearly_scores = merged_data.groupby('year').size()  # Races per year
        weighted_scores = self.apply_era_weighting(
            yearly_scores.reset_index().rename(columns={0: 'races', 'year': 'year'}),
            year_col='year',
            value_col='races'
        )
        
        # Return weighted average (simplified approach)
        return score  # For now, return original score - can enhance weighting logic
    
    def _default_result(self, driver_id: str) -> Dict:
        """Return default result when calculation fails"""
        return {
            'score': 50.0,  # Neutral score
            'raw_value': np.nan,
            'contributing_stats': {},
            'calculation_notes': 'Insufficient data for aggression calculation',
            'races_analyzed': 0,
            'component_breakdown': {}
        }
    
    def _generate_calculation_notes(self, contributing_stats: Dict) -> str:
        """Generate human-readable calculation notes"""
        notes = []
        
        if 'overtaking_rate' in contributing_stats and not pd.isna(contributing_stats['overtaking_rate']):
            notes.append(f"Overtaking rate score: {contributing_stats['overtaking_rate']:.1f}")
        
        if 'first_lap_aggression' in contributing_stats and not pd.isna(contributing_stats['first_lap_aggression']):
            notes.append(f"First lap aggression: {contributing_stats['first_lap_aggression']:.1f}")
        
        if 'late_race_moves' in contributing_stats and not pd.isna(contributing_stats['late_race_moves']):
            notes.append(f"Late race moves: {contributing_stats['late_race_moves']:.1f}")
        
        return "; ".join(notes) if notes else "Insufficient data for detailed analysis"
    
    def get_trait_description(self) -> str:
        """Return description of aggression trait"""
        return ("Measures racing aggression through overtaking frequency, first lap position gains, "
                "and late-race attacking moves. Higher scores indicate more aggressive racing style.")