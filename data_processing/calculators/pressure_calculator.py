"""
Pressure Performance Calculator

Measures driver performance under high-pressure situations through:
1. Championship pressure performance (performance when in title contention)
2. Season-ending performance (final races when championships are decided)
3. Must-win situation performance (desperate comeback attempts)
4. Recovery performance (comeback drives from poor qualifying/early incidents)
"""
import pandas as pd
import numpy as np
from typing import Dict, List
from .base_calculator import BaseDNACalculator

class PressureCalculator(BaseDNACalculator):
    
    def __init__(self):
        super().__init__("Pressure Performance", min_races_required=20)
    
    def get_trait_description(self) -> str:
        return "Measures performance under high-pressure situations like championship battles and crucial moments"
    
    def calculate_trait(self, driver_id: str, driver_data: Dict) -> Dict:
        """Calculate pressure performance score for a driver"""
        
        if not self.validate_driver_data(driver_id, driver_data):
            return self._default_result(driver_id)
        
        results = driver_data.get('results', pd.DataFrame())
        standings = driver_data.get('standings', pd.DataFrame())
        qualifying = driver_data.get('qualifying', pd.DataFrame())
        races = driver_data.get('races', pd.DataFrame()) if 'races' in driver_data else pd.DataFrame()
        
        if results.empty or standings.empty:
            return self._default_result(driver_id)
        
        contributing_stats = {}
        component_scores = []
        
        # 1. Championship Pressure Performance (40% weight)
        championship_pressure = self._calculate_championship_pressure(results, standings, races)
        contributing_stats['championship_pressure'] = championship_pressure
        component_scores.append(('championship', championship_pressure, 0.4))
        
        # 2. Season-Ending Performance (25% weight)
        season_ending = self._calculate_season_ending_performance(results, qualifying, races)
        contributing_stats['season_ending_performance'] = season_ending
        component_scores.append(('season_ending', season_ending, 0.25))
        
        # 3. Must-Win Situation Performance (20% weight)
        must_win = self._calculate_must_win_performance(results, standings)
        contributing_stats['must_win_performance'] = must_win
        component_scores.append(('must_win', must_win, 0.2))
        
        # 4. Recovery Performance (15% weight)
        recovery = self._calculate_recovery_performance(results, qualifying)
        contributing_stats['recovery_performance'] = recovery
        component_scores.append(('recovery', recovery, 0.15))
        
        # Calculate weighted final score
        valid_scores = [(name, score, weight) for name, score, weight in component_scores if not pd.isna(score)]
        
        if not valid_scores:
            return self._default_result(driver_id)
        
        # Normalize weights for missing components
        total_weight = sum(weight for _, _, weight in valid_scores)
        weighted_sum = sum(score * (weight/total_weight) for _, score, weight in valid_scores)
        
        final_score = max(0, min(100, weighted_sum))
        
        return {
            'score': float(final_score),
            'raw_value': float(weighted_sum),
            'contributing_stats': self._convert_numpy_types(contributing_stats),
            'calculation_notes': f'Based on {len(valid_scores)} pressure components',
            'races_analyzed': len(results)
        }
    
    def _calculate_championship_pressure(self, results: pd.DataFrame, standings: pd.DataFrame, races: pd.DataFrame) -> float:
        """Calculate performance when in championship contention (top 3 in standings)"""
        try:
            # Merge results with standings to get championship position at each race
            merged_data = results.merge(standings, on=['raceId', 'driverId'], how='inner')
            
            # Identify high-pressure races (when driver was in top 3 of championship)
            high_pressure_races = merged_data[merged_data['position_y'] <= 3]  # position_y is championship position
            
            if len(high_pressure_races) < 3:
                return 50.0  # Not enough championship pressure situations
            
            # Calculate average performance in high-pressure vs normal races
            normal_races = merged_data[merged_data['position_y'] > 3]
            
            if len(normal_races) < 5:
                return 50.0  # Need baseline for comparison
            
            # Use finishing position as performance metric (lower is better)
            high_pressure_avg_finish = high_pressure_races['positionOrder'].mean()
            normal_avg_finish = normal_races['positionOrder'].mean()
            
            # Calculate performance improvement under pressure
            # Negative means they performed better under pressure
            pressure_effect = high_pressure_avg_finish - normal_avg_finish
            
            # Convert to 0-100 score (better under pressure = higher score)
            if pressure_effect < -2:  # Significantly better under pressure
                return 80.0 + min(20.0, abs(pressure_effect + 2) * 3)
            elif pressure_effect < 0:  # Slightly better under pressure  
                return 60.0 + abs(pressure_effect) * 10
            elif pressure_effect < 2:  # Slightly worse under pressure
                return 50.0 - pressure_effect * 5
            else:  # Significantly worse under pressure
                return max(10.0, 40.0 - (pressure_effect - 2) * 5)
                
        except Exception as e:
            self.logger.warning(f"Championship pressure calculation failed: {e}")
            return 50.0
    
    def _calculate_season_ending_performance(self, results: pd.DataFrame, qualifying: pd.DataFrame, races: pd.DataFrame) -> float:
        """Calculate performance in final races of seasons"""
        try:
            if races.empty:
                return 50.0
            
            # Group races by year and identify final races of each season
            races_with_year = races.copy()
            season_final_races = races_with_year.groupby('year')['round'].max().reset_index()
            
            final_race_ids = []
            for _, season in season_final_races.iterrows():
                # Include final 3 races of each season
                season_races = races_with_year[races_with_year['year'] == season['year']]['raceId'].tolist()
                final_race_ids.extend(season_races[-3:] if len(season_races) >= 3 else season_races)
            
            # Get driver's performance in final races
            final_race_results = results[results['raceId'].isin(final_race_ids)]
            normal_race_results = results[~results['raceId'].isin(final_race_ids)]
            
            if len(final_race_results) < 3 or len(normal_race_results) < 5:
                return 50.0
            
            # Compare average finishing position
            final_avg_finish = final_race_results['positionOrder'].mean()
            normal_avg_finish = normal_race_results['positionOrder'].mean()
            
            performance_diff = normal_avg_finish - final_avg_finish  # Positive = better in finals
            
            # Convert to score
            if performance_diff > 2:
                return min(95.0, 70.0 + performance_diff * 5)
            elif performance_diff > 0:
                return 50.0 + performance_diff * 10
            else:
                return max(20.0, 50.0 + performance_diff * 8)
                
        except Exception as e:
            self.logger.warning(f"Season ending calculation failed: {e}")
            return 50.0
    
    def _calculate_must_win_performance(self, results: pd.DataFrame, standings: pd.DataFrame) -> float:
        """Calculate performance when mathematically nearly eliminated from championship"""
        try:
            merged_data = results.merge(standings, on=['raceId', 'driverId'], how='inner')
            
            # Identify desperate situations (more than 50 points behind leader)
            # This requires more complex logic to identify leader points, simplified for now
            desperate_races = merged_data[merged_data['position_y'] >= 5]  # 5th+ in championship
            
            if len(desperate_races) < 5:
                return 50.0
            
            # Count exceptional results (podiums) when desperate
            desperate_podiums = desperate_races[desperate_races['positionOrder'] <= 3]
            podium_rate_desperate = len(desperate_podiums) / len(desperate_races)
            
            # Compare to overall podium rate
            overall_podiums = merged_data[merged_data['positionOrder'] <= 3]
            overall_podium_rate = len(overall_podiums) / len(merged_data)
            
            if overall_podium_rate == 0:
                return 50.0
            
            # Rate of exceptional performance when desperate vs normal
            desperation_factor = podium_rate_desperate / overall_podium_rate if overall_podium_rate > 0 else 1
            
            # Convert to score
            if desperation_factor > 1.5:
                return min(90.0, 60.0 + (desperation_factor - 1) * 30)
            elif desperation_factor > 1.0:
                return 50.0 + (desperation_factor - 1) * 20
            else:
                return max(20.0, 50.0 * desperation_factor)
                
        except Exception as e:
            self.logger.warning(f"Must-win calculation failed: {e}")
            return 50.0
    
    def _calculate_recovery_performance(self, results: pd.DataFrame, qualifying: pd.DataFrame) -> float:
        """Calculate ability to recover from poor qualifying positions"""
        try:
            if qualifying.empty:
                # Use grid position as fallback
                poor_starts = results[results['grid'] >= 15]
            else:
                # Merge with qualifying data
                merged_data = results.merge(
                    qualifying[['raceId', 'driverId', 'position']].rename(columns={'position': 'quali_pos'}),
                    on=['raceId', 'driverId'],
                    how='left'
                )
                poor_starts = merged_data[merged_data['quali_pos'] >= 15]
            
            if len(poor_starts) < 3:
                return 50.0  # Not enough poor starting positions
            
            # Count recovery drives (finishing in points from poor qualifying)
            points_finishes = poor_starts[poor_starts['positionOrder'] <= 10]  # Top 10 = points in most eras
            recovery_rate = len(points_finishes) / len(poor_starts)
            
            # Average positions gained
            if qualifying.empty:
                positions_gained = (poor_starts['grid'] - poor_starts['positionOrder']).mean()
            else:
                positions_gained = (poor_starts['quali_pos'] - poor_starts['positionOrder']).mean()
            
            # Combine recovery rate and positions gained
            recovery_score = (recovery_rate * 40) + min(40, max(0, positions_gained * 2)) + 20
            
            return min(95.0, max(10.0, recovery_score))
            
        except Exception as e:
            self.logger.warning(f"Recovery performance calculation failed: {e}")
            return 50.0
    
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