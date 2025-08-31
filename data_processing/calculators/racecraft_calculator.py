"""
Racecraft Score Calculator

Measures driver racecraft through:
1. Overtaking Quality (35% weight) - Clean passes, difficulty-adjusted overtakes
2. Defensive Driving (25% weight) - Position holding, clean defensive moves  
3. Wheel-to-Wheel Combat (25% weight) - Incident rates, damage avoidance
4. Strategic Race Intelligence (15% weight) - Timing, DRS efficiency, risk assessment
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from .base_calculator import BaseDNACalculator

class RacecraftCalculator(BaseDNACalculator):
    
    def __init__(self):
        super().__init__("Racecraft", min_races_required=20)
        
        # Track difficulty multipliers for overtaking (higher = harder to overtake)
        self.track_difficulty = {
            'monaco': 3.0, 'hungaroring': 2.5, 'singapore': 2.3,
            'albert_park': 2.0, 'barcelona': 1.8, 'imola': 1.7,
            'silverstone': 1.3, 'spa': 1.2, 'monza': 1.0,
            'bahrain': 1.1, 'saudi_arabia': 1.4, 'miami': 1.5
        }
    
    def get_trait_description(self) -> str:
        return "Measures racecraft skills including overtaking quality, defensive driving, wheel-to-wheel combat, and strategic race intelligence"
    
    def calculate_trait(self, driver_id: str, driver_data: Dict) -> Dict:
        """Calculate racecraft score for a driver"""
        
        if not self.validate_driver_data(driver_id, driver_data):
            return self._default_result(driver_id)
        
        results = driver_data.get('results', pd.DataFrame())
        lap_times = driver_data.get('lap_times', pd.DataFrame())
        all_results = driver_data.get('all_results', pd.DataFrame())
        qualifying = driver_data.get('qualifying', pd.DataFrame())
        
        if results.empty:
            return self._default_result(driver_id)
        
        contributing_stats = {}
        component_scores = []
        
        # 1. Overtaking Quality (35% weight)
        overtaking_quality = self._calculate_overtaking_quality(results, lap_times, all_results)
        contributing_stats['overtaking_quality'] = overtaking_quality
        component_scores.append(('overtaking', overtaking_quality, 0.35))
        
        # 2. Defensive Driving (25% weight)
        defensive_driving = self._calculate_defensive_driving(results, lap_times, all_results)
        contributing_stats['defensive_driving'] = defensive_driving
        component_scores.append(('defensive', defensive_driving, 0.25))
        
        # 3. Wheel-to-Wheel Combat (25% weight)
        combat_score = self._calculate_wheel_to_wheel_combat(results, all_results)
        contributing_stats['wheel_to_wheel_combat'] = combat_score
        component_scores.append(('combat', combat_score, 0.25))
        
        # 4. Strategic Race Intelligence (15% weight)
        strategic_intelligence = self._calculate_strategic_intelligence(results, qualifying, lap_times)
        contributing_stats['strategic_intelligence'] = strategic_intelligence
        component_scores.append(('strategic', strategic_intelligence, 0.15))
        
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
            'calculation_notes': f'Based on {len(valid_scores)} racecraft components',
            'races_analyzed': len(results)
        }
    
    def _calculate_overtaking_quality(self, results: pd.DataFrame, lap_times: pd.DataFrame, all_results: pd.DataFrame) -> float:
        """Calculate overtaking quality score"""
        try:
            if lap_times.empty:
                return self._calculate_overtaking_fallback(results, all_results)
            
            overtaking_situations = []
            
            # Analyze each race for overtaking opportunities
            for race_id in results['raceId'].unique():
                race_results = results[results['raceId'] == race_id]
                race_lap_times = lap_times[lap_times['raceId'] == race_id]
                
                if race_results.empty or race_lap_times.empty:
                    continue
                
                # Get driver's lap-by-lap positions for this race
                driver_laps = race_lap_times[race_lap_times['driverId'] == race_results['driverId'].iloc[0]]
                
                if len(driver_laps) < 5:  # Need minimum laps for analysis
                    continue
                
                driver_laps = driver_laps.sort_values('lap')
                
                # Calculate position changes (negative = gained position)
                position_changes = driver_laps['position'].diff()
                
                # Identify overtaking laps (position improved)
                overtakes = position_changes[position_changes < 0]
                
                if len(overtakes) > 0:
                    # Calculate overtaking metrics for this race
                    total_overtakes = len(overtakes)
                    avg_positions_gained = abs(overtakes.mean())
                    max_position_gain = abs(overtakes.min())
                    
                    # Get track difficulty multiplier (simplified)
                    track_difficulty = 1.5  # Default moderate difficulty
                    
                    race_overtaking_score = (
                        (total_overtakes * 10) +  # Raw overtaking frequency
                        (avg_positions_gained * 15) +  # Average gain per overtake
                        (max_position_gain * 5)  # Reward big overtakes
                    ) * track_difficulty
                    
                    overtaking_situations.append(race_overtaking_score)
            
            if not overtaking_situations:
                return 40.0  # Below average for no overtaking data
            
            # Calculate final overtaking quality score
            avg_race_score = np.mean(overtaking_situations)
            consistency_bonus = max(0, 20 - np.std(overtaking_situations))  # Reward consistency
            
            overtaking_quality = min(100, max(0, avg_race_score + consistency_bonus))
            return overtaking_quality
            
        except Exception as e:
            self.logger.warning(f"Overtaking quality calculation failed: {e}")
            return 50.0
    
    def _calculate_overtaking_fallback(self, results: pd.DataFrame, all_results: pd.DataFrame) -> float:
        """Fallback overtaking calculation using race positions"""
        try:
            # Use grid vs finishing position as proxy for overtaking
            valid_races = results.dropna(subset=['grid', 'position']).copy()
            
            if valid_races.empty:
                return 50.0
            
            # Calculate positions gained from grid
            valid_races['positions_gained'] = valid_races['grid'] - valid_races['position']
            
            # Focus on races where driver gained positions
            overtaking_races = valid_races[valid_races['positions_gained'] > 0]
            
            if len(overtaking_races) == 0:
                return 35.0  # Poor overtaking record
            
            # Calculate overtaking metrics
            overtaking_frequency = len(overtaking_races) / len(valid_races)
            avg_positions_gained = overtaking_races['positions_gained'].mean()
            
            # Score based on frequency and magnitude
            frequency_score = overtaking_frequency * 60
            magnitude_score = min(40, avg_positions_gained * 8)
            
            return min(95, frequency_score + magnitude_score)
            
        except Exception as e:
            self.logger.warning(f"Overtaking fallback calculation failed: {e}")
            return 50.0
    
    def _calculate_defensive_driving(self, results: pd.DataFrame, lap_times: pd.DataFrame, all_results: pd.DataFrame) -> float:
        """Calculate defensive driving ability"""
        try:
            if lap_times.empty:
                return self._calculate_defensive_fallback(results)
            
            defensive_situations = []
            
            # Analyze races for defensive situations
            for race_id in results['raceId'].unique():
                race_results = results[results['raceId'] == race_id]
                race_lap_times = lap_times[lap_times['raceId'] == race_id]
                
                if race_results.empty or race_lap_times.empty:
                    continue
                
                # Get driver's positions throughout race
                driver_laps = race_lap_times[race_lap_times['driverId'] == race_results['driverId'].iloc[0]]
                
                if len(driver_laps) < 5:
                    continue
                
                driver_laps = driver_laps.sort_values('lap')
                
                # Identify defensive situations (position under threat)
                position_changes = driver_laps['position'].diff()
                
                # Count times position was held despite pressure
                defensive_laps = position_changes[position_changes == 0]  # Position maintained
                pressure_situations = len(position_changes[position_changes > 0])  # Times lost position
                
                if len(driver_laps) > 10:
                    defensive_ratio = len(defensive_laps) / len(driver_laps)
                    pressure_resistance = max(0, 1 - (pressure_situations / len(driver_laps)))
                    
                    race_defensive_score = (defensive_ratio * 50) + (pressure_resistance * 50)
                    defensive_situations.append(race_defensive_score)
            
            if not defensive_situations:
                return 50.0
            
            return min(100, max(20, np.mean(defensive_situations)))
            
        except Exception as e:
            self.logger.warning(f"Defensive driving calculation failed: {e}")
            return 50.0
    
    def _calculate_defensive_fallback(self, results: pd.DataFrame) -> float:
        """Fallback defensive calculation"""
        try:
            # Use qualifying vs race position as proxy
            valid_races = results.dropna(subset=['grid', 'position']).copy()
            
            if valid_races.empty:
                return 50.0
            
            # Calculate how often driver maintained/improved from grid
            valid_races['position_change'] = valid_races['position'] - valid_races['grid']
            defensive_races = valid_races[valid_races['position_change'] <= 0]  # Held or improved position
            
            defensive_rate = len(defensive_races) / len(valid_races)
            return min(90, defensive_rate * 100)
            
        except Exception as e:
            self.logger.warning(f"Defensive fallback failed: {e}")
            return 50.0
    
    def _calculate_wheel_to_wheel_combat(self, results: pd.DataFrame, all_results: pd.DataFrame) -> float:
        """Calculate wheel-to-wheel combat effectiveness"""
        try:
            # This is simplified due to data limitations
            # In reality, we'd need incident/penalty data
            
            total_races = len(results)
            if total_races < 5:
                return 50.0
            
            # Use DNF rate and finishing positions as proxy for clean racing
            dnf_rate = results['position'].isna().sum() / total_races
            
            # Compare DNF rate to era average
            if not all_results.empty and 'year' in results.columns:
                driver_years = results['year'].unique()
                era_results = all_results[all_results['year'].isin(driver_years)]
                era_dnf_rate = era_results['position'].isna().sum() / len(era_results) if len(era_results) > 0 else 0.15
            else:
                era_dnf_rate = 0.15  # Historical average
            
            # Calculate reliability score (lower DNF = better combat skills)
            if era_dnf_rate > 0:
                reliability_factor = 1 - (dnf_rate / era_dnf_rate)
            else:
                reliability_factor = 1 - dnf_rate
            
            # Use average finishing position relative to grid as combat proxy
            valid_races = results.dropna(subset=['grid', 'position'])
            if not valid_races.empty:
                avg_position_change = (valid_races['grid'] - valid_races['position']).mean()
                position_factor = min(1, max(-1, avg_position_change / 5))
            else:
                position_factor = 0
            
            # Combine factors
            combat_score = 50 + (reliability_factor * 25) + (position_factor * 25)
            
            return min(100, max(20, combat_score))
            
        except Exception as e:
            self.logger.warning(f"Wheel-to-wheel combat calculation failed: {e}")
            return 50.0
    
    def _calculate_strategic_intelligence(self, results: pd.DataFrame, qualifying: pd.DataFrame, lap_times: pd.DataFrame) -> float:
        """Calculate strategic race intelligence"""
        try:
            # This is simplified - ideal would analyze pit stop timing, DRS usage, etc.
            
            strategic_scores = []
            
            # Analyze qualifying vs race performance differential
            if not qualifying.empty:
                merged_data = results.merge(
                    qualifying[['raceId', 'driverId', 'position']].rename(columns={'position': 'quali_pos'}),
                    on=['raceId', 'driverId'],
                    how='inner'
                )
                
                if not merged_data.empty:
                    # Reward consistent race-day improvement over qualifying
                    valid_data = merged_data.dropna(subset=['quali_pos', 'position'])
                    if not valid_data.empty:
                        avg_improvement = (valid_data['quali_pos'] - valid_data['position']).mean()
                        consistency = 1 / (1 + (valid_data['quali_pos'] - valid_data['position']).std())
                        
                        strategic_scores.append(50 + (avg_improvement * 8) + (consistency * 20))
            
            # Analyze late-race performance (strategic timing)
            if not lap_times.empty:
                for race_id in results['raceId'].unique()[:10]:  # Sample races to avoid overprocessing
                    race_lap_times = lap_times[lap_times['raceId'] == race_id]
                    driver_laps = race_lap_times[race_lap_times['driverId'] == results['driverId'].iloc[0]]
                    
                    if len(driver_laps) > 20:  # Need sufficient laps
                        driver_laps = driver_laps.sort_values('lap')
                        
                        # Analyze final third performance
                        total_laps = len(driver_laps)
                        final_third = driver_laps.iloc[int(total_laps * 0.67):]
                        
                        if len(final_third) > 5:
                            # Check for strategic late-race moves
                            late_position_changes = final_third['position'].diff().dropna()
                            strategic_moves = (late_position_changes < 0).sum()  # Position improvements
                            
                            if len(final_third) > 0:
                                strategic_ratio = strategic_moves / len(final_third)
                                strategic_scores.append(40 + (strategic_ratio * 60))
            
            if not strategic_scores:
                return 50.0
            
            return min(100, max(20, np.mean(strategic_scores)))
            
        except Exception as e:
            self.logger.warning(f"Strategic intelligence calculation failed: {e}")
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