"""
Consistency Score Calculator

Measures driver consistency through:
1. Finishing reliability (DNF rate compared to teammates and era average)
2. Qualifying consistency (standard deviation of qualifying positions relative to teammate gap)
3. Points scoring reliability (percentage of races finishing in points when car was capable)
"""
import pandas as pd
import numpy as np
from typing import Dict, List
from calculators.base_calculator import BaseDNACalculator

class ConsistencyCalculator(BaseDNACalculator):
    
    def __init__(self):
        super().__init__("Consistency", min_races_required=15)
    
    def calculate_trait(self, driver_id: str, driver_data: Dict[str, pd.DataFrame]) -> Dict:
        """Calculate consistency score for a driver"""
        
        if not self.validate_driver_data(driver_id, driver_data):
            return self._default_result(driver_id)
        
        results = driver_data['results']
        qualifying = driver_data.get('qualifying', pd.DataFrame())
        all_results = driver_data.get('all_results', results)  # For teammate comparison
        
        contributing_stats = {}
        component_scores = []
        
        # 1. Finishing Reliability (40% weight)
        reliability_score = self._calculate_finishing_reliability(results, all_results)
        contributing_stats['finishing_reliability'] = reliability_score
        component_scores.append(('reliability', reliability_score, 0.4))
        
        # 2. Qualifying Consistency (35% weight)
        quali_consistency = self._calculate_qualifying_consistency(qualifying, driver_id)
        contributing_stats['qualifying_consistency'] = quali_consistency
        component_scores.append(('qualifying', quali_consistency, 0.35))
        
        # 3. Points Scoring Reliability (25% weight)
        points_reliability = self._calculate_points_reliability(results, all_results)
        contributing_stats['points_reliability'] = points_reliability
        component_scores.append(('points', points_reliability, 0.25))
        
        # Calculate weighted final score
        valid_scores = [(name, score, weight) for name, score, weight in component_scores if not pd.isna(score)]
        
        if not valid_scores:
            return self._default_result(driver_id)
        
        # Normalize weights for valid scores
        total_weight = sum(weight for _, _, weight in valid_scores)
        final_score = sum(score * (weight / total_weight) for _, score, weight in valid_scores)
        
        # Apply era weighting if year data available
        if 'year' in results.columns:
            era_weighted_score = self._apply_era_weighting_to_consistency(final_score, results)
            final_score = era_weighted_score
        
        return {
            'score': max(0, min(100, final_score)),
            'raw_value': final_score,
            'contributing_stats': contributing_stats,
            'calculation_notes': self._generate_calculation_notes(contributing_stats),
            'races_analyzed': len(results),
            'component_breakdown': {name: score for name, score, _ in valid_scores}
        }
    
    def _calculate_finishing_reliability(self, results: pd.DataFrame, all_results: pd.DataFrame) -> float:
        """Calculate finishing reliability score"""
        
        total_races = len(results)
        if total_races == 0:
            return np.nan
        
        # Calculate DNF rate
        dnf_count = results['position'].isna().sum()
        dnf_rate = dnf_count / total_races
        
        # Compare to teammate DNF rate for normalization
        teammate_dnf_rate = self._get_teammate_dnf_rate(results, all_results)
        
        # Calculate relative reliability
        if teammate_dnf_rate is not None and teammate_dnf_rate > 0:
            relative_reliability = (teammate_dnf_rate - dnf_rate) / teammate_dnf_rate
        else:
            # Fallback to era-based comparison
            era_avg_dnf_rate = self._get_era_average_dnf_rate(results, all_results)
            if era_avg_dnf_rate > 0:
                relative_reliability = (era_avg_dnf_rate - dnf_rate) / era_avg_dnf_rate
            else:
                relative_reliability = 1 - dnf_rate  # Simple reliability score
        
        # Convert to 0-100 score (lower DNF rate = higher score)
        # Perfect reliability (0% DNF) = 100, Average reliability = 50
        base_score = (1 - dnf_rate) * 100
        
        # Adjust based on relative performance
        if not pd.isna(relative_reliability):
            adjustment = relative_reliability * 20  # ±20 points based on relative performance
            reliability_score = base_score + adjustment
        else:
            reliability_score = base_score
        
        return max(0, min(100, reliability_score))
    
    def _calculate_qualifying_consistency(self, qualifying: pd.DataFrame, driver_id: str) -> float:
        """Calculate qualifying consistency score"""
        
        if qualifying.empty:
            return np.nan
        
        # Get qualifying positions
        quali_positions = qualifying['position'].dropna()
        
        if len(quali_positions) < 5:  # Need minimum races for consistency calculation
            return np.nan
        
        # Calculate position variability
        position_std = quali_positions.std()
        position_mean = quali_positions.mean()
        
        # Calculate coefficient of variation (CV)
        if position_mean > 0:
            cv = position_std / position_mean
        else:
            cv = position_std  # Fallback
        
        # Convert CV to consistency score (lower CV = higher consistency)
        # CV of 0 = perfect consistency (100), CV of 1 = poor consistency (0)
        consistency_score = max(0, 100 - (cv * 100))
        
        # Additional consistency metrics
        # Look at consecutive qualifying performance
        consecutive_consistency = self._calculate_consecutive_consistency(quali_positions)
        
        # Weight the components
        final_consistency = (consistency_score * 0.7 + consecutive_consistency * 0.3)
        
        return max(0, min(100, final_consistency))
    
    def _calculate_points_reliability(self, results: pd.DataFrame, all_results: pd.DataFrame) -> float:
        """Calculate points scoring reliability"""
        
        finished_races = results.dropna(subset=['position'])
        
        if finished_races.empty:
            return np.nan
        
        # Calculate points scoring rate
        points_races = (finished_races['points'] > 0).sum()
        total_finished = len(finished_races)
        points_scoring_rate = points_races / total_finished
        
        # Determine car competitiveness to set realistic expectations
        car_competitiveness = self._assess_car_competitiveness(results, all_results)
        
        # Adjust expectations based on car performance
        if car_competitiveness == 'top_team':
            expected_points_rate = 0.8  # Should score points in 80% of races
        elif car_competitiveness == 'midfield':
            expected_points_rate = 0.4  # Should score points in 40% of races
        else:  # backmarker
            expected_points_rate = 0.1  # Should score points in 10% of races
        
        # Calculate reliability score based on meeting expectations
        if expected_points_rate > 0:
            reliability_ratio = points_scoring_rate / expected_points_rate
            points_reliability_score = min(100, reliability_ratio * 50 + 25)  # Scale to 25-100
        else:
            points_reliability_score = points_scoring_rate * 100
        
        # Factor in consistency of points scoring (not just quantity)
        points_values = finished_races[finished_races['points'] > 0]['points']
        if len(points_values) > 1:
            points_consistency = self._calculate_points_consistency(points_values)
            final_score = (points_reliability_score * 0.8 + points_consistency * 0.2)
        else:
            final_score = points_reliability_score
        
        return max(0, min(100, final_score))
    
    def _get_teammate_dnf_rate(self, driver_results: pd.DataFrame, all_results: pd.DataFrame) -> float:
        """Calculate teammate DNF rate for comparison"""
        
        if all_results.empty:
            return None
        
        # Get races where this driver competed
        driver_races = set(driver_results['raceId'].unique())
        driver_constructors = set(driver_results['constructorId'].unique())
        
        # Find teammate results (same constructor, same races, different driver)
        teammate_results = all_results[
            (all_results['raceId'].isin(driver_races)) &
            (all_results['constructorId'].isin(driver_constructors)) &
            (all_results['driverId'] != driver_results['driverId'].iloc[0])
        ]
        
        if teammate_results.empty:
            return None
        
        # Calculate teammate DNF rate
        teammate_dnfs = teammate_results['position'].isna().sum()
        teammate_races = len(teammate_results)
        
        return teammate_dnfs / teammate_races if teammate_races > 0 else None
    
    def _get_era_average_dnf_rate(self, driver_results: pd.DataFrame, all_results: pd.DataFrame) -> float:
        """Calculate era average DNF rate"""
        
        if 'year' not in driver_results.columns or all_results.empty:
            return 0.15  # Historical F1 average
        
        # Get years when driver was active
        driver_years = driver_results['year'].unique()
        
        # Calculate DNF rate for those years
        era_results = all_results[all_results['year'].isin(driver_years)]
        
        if era_results.empty:
            return 0.15
        
        era_dnfs = era_results['position'].isna().sum()
        era_races = len(era_results)
        
        return era_dnfs / era_races if era_races > 0 else 0.15
    
    def _calculate_consecutive_consistency(self, positions: pd.Series) -> float:
        """Calculate consistency in consecutive performances"""
        
        if len(positions) < 3:
            return 50.0  # Default neutral score
        
        # Calculate consecutive position differences
        consecutive_diffs = positions.diff().dropna().abs()
        
        # Lower average difference = higher consistency
        avg_consecutive_diff = consecutive_diffs.mean()
        
        # Convert to 0-100 score (0 difference = 100, large differences = 0)
        # Scale based on typical grid size (~20 positions)
        consistency_score = max(0, 100 - (avg_consecutive_diff * 5))
        
        return consistency_score
    
    def _assess_car_competitiveness(self, driver_results: pd.DataFrame, all_results: pd.DataFrame) -> str:
        """Assess the competitiveness of the driver's car"""
        
        if 'constructorId' not in driver_results.columns:
            return 'midfield'  # Default assumption
        
        # Get driver's constructor
        constructor = driver_results['constructorId'].iloc[0]
        
        # Calculate constructor's average finishing position
        constructor_results = all_results[all_results['constructorId'] == constructor]
        
        if constructor_results.empty:
            return 'midfield'
        
        # Calculate average points per race for constructor
        avg_points = constructor_results['points'].mean()
        
        # Classify based on points (rough thresholds)
        if avg_points >= 6:  # Regularly scoring high points
            return 'top_team'
        elif avg_points >= 1:  # Occasionally scoring points
            return 'midfield'
        else:  # Rarely scoring points
            return 'backmarker'
    
    def _calculate_points_consistency(self, points_values: pd.Series) -> float:
        """Calculate consistency of points scoring"""
        
        if len(points_values) < 2:
            return 50.0
        
        # Calculate coefficient of variation
        points_std = points_values.std()
        points_mean = points_values.mean()
        
        if points_mean > 0:
            cv = points_std / points_mean
            consistency_score = max(0, 100 - (cv * 50))  # Scale CV to consistency score
        else:
            consistency_score = 50.0
        
        return consistency_score
    
    def _apply_era_weighting_to_consistency(self, score: float, results: pd.DataFrame) -> float:
        """Apply era weighting to consistency score"""
        # For consistency, we might want to weight recent performance more heavily
        # as rule changes can affect reliability
        
        if 'year' not in results.columns:
            return score
        
        # Weight recent years more heavily for consistency
        yearly_data = results.groupby('year').agg({
            'position': lambda x: x.isna().sum() / len(x),  # DNF rate
            'points': 'mean'
        }).reset_index()
        yearly_data.rename(columns={'position': 'dnf_rate'}, inplace=True)
        
        # Apply era weighting (more sophisticated approach could be implemented)
        return score  # Simplified - return original for now
    
    def _default_result(self, driver_id: str) -> Dict:
        """Return default result when calculation fails"""
        return {
            'score': 50.0,  # Neutral score
            'raw_value': np.nan,
            'contributing_stats': {},
            'calculation_notes': 'Insufficient data for consistency calculation',
            'races_analyzed': 0,
            'component_breakdown': {}
        }
    
    def _generate_calculation_notes(self, contributing_stats: Dict) -> str:
        """Generate human-readable calculation notes"""
        notes = []
        
        if 'finishing_reliability' in contributing_stats and not pd.isna(contributing_stats['finishing_reliability']):
            notes.append(f"Finishing reliability: {contributing_stats['finishing_reliability']:.1f}")
        
        if 'qualifying_consistency' in contributing_stats and not pd.isna(contributing_stats['qualifying_consistency']):
            notes.append(f"Qualifying consistency: {contributing_stats['qualifying_consistency']:.1f}")
        
        if 'points_reliability' in contributing_stats and not pd.isna(contributing_stats['points_reliability']):
            notes.append(f"Points reliability: {contributing_stats['points_reliability']:.1f}")
        
        return "; ".join(notes) if notes else "Insufficient data for detailed analysis"
    
    def get_trait_description(self) -> str:
        """Return description of consistency trait"""
        return ("Measures racing consistency through finishing reliability, qualifying consistency, "
                "and points scoring reliability. Higher scores indicate more predictable and reliable performance.")