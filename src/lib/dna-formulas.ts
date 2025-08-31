// Mathematical formulas and documentation for DNA trait calculations

export interface FormulaStep {
  description: string;
  formula: string;
  variables: Record<string, string>;
  result?: string;
}

export interface TraitFormula {
  description: string;
  components: {
    name: string;
    weight: number;
    steps: FormulaStep[];
  }[];
  finalCalculation: {
    formula: string;
    description: string;
  };
}

export const DNA_FORMULAS: Record<string, TraitFormula> = {
  aggression: {
    description: "Measures racing aggression through overtaking frequency, first lap performance, and late-race moves",
    components: [
      {
        name: "Overtaking Rate",
        weight: 0.4,
        steps: [
          {
            description: "Calculate average positions gained from qualifying to race finish",
            formula: "avg_gain = Σ(quali_pos - race_pos) / total_races",
            variables: {
              "quali_pos": "Qualifying position",
              "race_pos": "Final race position", 
              "total_races": "Number of races analyzed"
            }
          },
          {
            description: "Calculate overtaking frequency (percentage of races with position gains)",
            formula: "freq = (races_with_gains / total_races) × 100",
            variables: {
              "races_with_gains": "Races where positions were gained",
              "total_races": "Total races"
            }
          },
          {
            description: "Calculate gain score component",
            formula: "gain_score = min(100, max(0, avg_gain × 10 + 50))",
            variables: {
              "avg_gain": "Average positions gained per race"
            }
          },
          {
            description: "Calculate frequency score component", 
            formula: "freq_score = overtaking_frequency × 100",
            variables: {
              "overtaking_frequency": "Percentage of races with overtaking (0-1)"
            }
          },
          {
            description: "Calculate peak performance score",
            formula: "peak_score = min(100, max_gain × 5)",
            variables: {
              "max_gain": "Maximum positions gained in a single race"
            }
          },
          {
            description: "Combine components with weights",
            formula: "overtaking_rate = gain_score × 0.5 + freq_score × 0.3 + peak_score × 0.2",
            variables: {
              "gain_score": "Gain score (0-100)",
              "freq_score": "Frequency score (0-100)",
              "peak_score": "Peak score (0-100)"
            }
          }
        ]
      },
      {
        name: "First Lap Aggression", 
        weight: 0.35,
        steps: [
          {
            description: "Calculate average first lap position changes",
            formula: "avg_first_lap_gain = Σ(grid_pos - lap1_pos) / total_races",
            variables: {
              "grid_pos": "Starting grid position",
              "lap1_pos": "Position after lap 1",
              "total_races": "Races with lap 1 data"
            }
          },
          {
            description: "Calculate aggressive first lap frequency",
            formula: "aggr_freq = (laps_with_gains > 1) / total_races × 100",
            variables: {
              "laps_with_gains": "First laps with >1 position gained"
            }
          },
          {
            description: "Calculate first lap gain score",
            formula: "gain_score = min(100, max(0, avg_first_lap_gain × 15 + 50))",
            variables: {
              "avg_first_lap_gain": "Average positions gained on lap 1"
            }
          },
          {
            description: "Combine gain and frequency scores",
            formula: "first_lap_score = gain_score × 0.7 + aggr_freq × 0.3",
            variables: {
              "gain_score": "Gain score component",
              "aggr_freq": "Aggressive frequency component"
            }
          }
        ]
      },
      {
        name: "Late Race Moves",
        weight: 0.25,
        steps: [
          {
            description: "Calculate average position changes in final 10 laps",
            formula: "avg_late_gains = Σ(early_pos - late_pos) / races_analyzed",
            variables: {
              "early_pos": "Position at 80% race distance",
              "late_pos": "Final position",
              "races_analyzed": "Races with sufficient lap data"
            }
          },
          {
            description: "Calculate late race gain score",
            formula: "gain_score = min(100, max(0, avg_late_gains × 12 + 50))",
            variables: {
              "avg_late_gains": "Average positions gained in final laps"
            }
          },
          {
            description: "Calculate frequency of aggressive finishes",
            formula: "freq_score = (aggressive_finishes / total_races) × 100",
            variables: {
              "aggressive_finishes": "Races with late position gains"
            }
          },
          {
            description: "Combine late race components",
            formula: "late_race_score = gain_score × 0.6 + freq_score × 0.4",
            variables: {
              "gain_score": "Late race gain score",
              "freq_score": "Frequency score"
            }
          }
        ]
      }
    ],
    finalCalculation: {
      formula: "final_score = overtaking_rate × 0.4 + first_lap × 0.35 + late_race × 0.25",
      description: "Weighted average of all aggression components"
    }
  },

  consistency: {
    description: "Measures racing consistency through finishing reliability, qualifying consistency, and points scoring reliability",
    components: [
      {
        name: "Finishing Reliability",
        weight: 0.4,
        steps: [
          {
            description: "Calculate DNF (Did Not Finish) rate",
            formula: "dnf_rate = dnf_count / total_races",
            variables: {
              "dnf_count": "Number of races not finished",
              "total_races": "Total races entered"
            }
          },
          {
            description: "Calculate base reliability score", 
            formula: "base_score = (1 - dnf_rate) × 100",
            variables: {
              "dnf_rate": "DNF rate (0-1)"
            }
          },
          {
            description: "Calculate relative reliability vs teammates/era",
            formula: "relative_reliability = (teammate_dnf_rate - driver_dnf_rate) / teammate_dnf_rate",
            variables: {
              "teammate_dnf_rate": "Teammate's DNF rate",
              "driver_dnf_rate": "Driver's DNF rate"
            }
          },
          {
            description: "Apply reliability adjustment",
            formula: "reliability_score = base_score + (relative_reliability × 20)",
            variables: {
              "base_score": "Base reliability score",
              "relative_reliability": "Relative performance factor"
            }
          }
        ]
      },
      {
        name: "Qualifying Consistency",
        weight: 0.35,
        steps: [
          {
            description: "Calculate coefficient of variation for qualifying positions",
            formula: "cv = std_dev(quali_positions) / mean(quali_positions)",
            variables: {
              "std_dev": "Standard deviation of qualifying positions",
              "mean": "Average qualifying position"
            }
          },
          {
            description: "Convert CV to consistency score (lower CV = higher consistency)",
            formula: "consistency_score = max(0, 100 - (cv × 100))",
            variables: {
              "cv": "Coefficient of variation"
            }
          },
          {
            description: "Calculate consecutive performance consistency",
            formula: "consecutive_consistency = max(0, 100 - (avg_consecutive_diff × 5))",
            variables: {
              "avg_consecutive_diff": "Average difference between consecutive qualifying positions"
            }
          },
          {
            description: "Combine consistency components",
            formula: "final_consistency = consistency_score × 0.7 + consecutive_consistency × 0.3",
            variables: {
              "consistency_score": "Position variability score",
              "consecutive_consistency": "Consecutive performance score"
            }
          }
        ]
      },
      {
        name: "Points Scoring Reliability",
        weight: 0.25,
        steps: [
          {
            description: "Calculate points scoring rate",
            formula: "points_rate = races_with_points / races_finished",
            variables: {
              "races_with_points": "Races where points were scored",
              "races_finished": "Races completed"
            }
          },
          {
            description: "Determine expected points rate based on car competitiveness",
            formula: "expected_rate = car_competitiveness_factor",
            variables: {
              "car_competitiveness_factor": "Expected points rate: top_team=0.8, midfield=0.4, backmarker=0.1"
            }
          },
          {
            description: "Calculate reliability ratio",
            formula: "reliability_ratio = points_rate / expected_rate",
            variables: {
              "points_rate": "Actual points scoring rate",
              "expected_rate": "Expected points rate for car"
            }
          },
          {
            description: "Convert to reliability score",
            formula: "points_reliability = min(100, reliability_ratio × 50 + 25)",
            variables: {
              "reliability_ratio": "Ratio of actual vs expected points scoring"
            }
          }
        ]
      }
    ],
    finalCalculation: {
      formula: "final_score = finishing_reliability × 0.4 + qualifying_consistency × 0.35 + points_reliability × 0.25",
      description: "Weighted average of all consistency components"
    }
  },

  pressure_performance: {
    description: "Measures performance under high-pressure situations like championship battles and crucial moments",
    components: [
      {
        name: "Championship Pressure",
        weight: 0.4,
        steps: [
          {
            description: "Calculate average finishing position when in championship top 3",
            formula: "high_pressure_avg = Σ(finish_pos_when_top3) / races_in_top3",
            variables: {
              "finish_pos_when_top3": "Finishing positions when in championship top 3",
              "races_in_top3": "Number of races spent in championship top 3"
            }
          },
          {
            description: "Calculate average finishing position in normal races",
            formula: "normal_avg = Σ(finish_pos_when_not_top3) / normal_races",
            variables: {
              "finish_pos_when_not_top3": "Finishing positions when not in championship top 3",
              "normal_races": "Number of normal races"
            }
          },
          {
            description: "Calculate pressure effect (negative = better under pressure)",
            formula: "pressure_effect = high_pressure_avg - normal_avg",
            variables: {
              "high_pressure_avg": "Average finish when under pressure",
              "normal_avg": "Average finish in normal races"
            }
          },
          {
            description: "Convert pressure effect to score using conditional logic",
            formula: "score = conditional_scoring(pressure_effect)",
            variables: {
              "pressure_effect": "Performance difference under pressure",
              "conditional_scoring": "if effect < -2: 80+(abs(effect+2)*3), elif effect < 0: 60+(abs(effect)*10), elif effect < 2: 50-(effect*5), else: max(10, 40-((effect-2)*5))"
            }
          }
        ]
      },
      {
        name: "Season Ending Performance", 
        weight: 0.25,
        steps: [
          {
            description: "Calculate average finishing position in final 3 races of each season",
            formula: "final_races_avg = Σ(final_race_positions) / final_races_count",
            variables: {
              "final_race_positions": "Positions in final 3 races of each season",
              "final_races_count": "Number of season-ending races"
            }
          },
          {
            description: "Calculate performance difference vs season average",
            formula: "performance_diff = season_avg - final_races_avg",
            variables: {
              "season_avg": "Average finishing position during season",
              "final_races_avg": "Average in final races"
            }
          },
          {
            description: "Convert difference to score (positive = better in finals)",
            formula: "score = conditional_scoring(performance_diff)",
            variables: {
              "performance_diff": "Performance improvement in final races",
              "conditional_scoring": "if diff > 2: min(95, 70+diff*5), elif diff > 0: 50+diff*10, else: max(20, 50+diff*8)"
            }
          }
        ]
      },
      {
        name: "Must-Win Performance",
        weight: 0.2, 
        steps: [
          {
            description: "Calculate podium rate when in desperate championship situations (5th+ in standings)",
            formula: "desperate_podium_rate = podiums_when_desperate / races_when_desperate",
            variables: {
              "podiums_when_desperate": "Podium finishes when 5th+ in championship",
              "races_when_desperate": "Races spent 5th+ in championship"
            }
          },
          {
            description: "Calculate overall podium rate for comparison",
            formula: "overall_podium_rate = total_podiums / total_races",
            variables: {
              "total_podiums": "Total career podium finishes",
              "total_races": "Total career races"
            }
          },
          {
            description: "Calculate desperation factor",
            formula: "desperation_factor = desperate_podium_rate / overall_podium_rate",
            variables: {
              "desperate_podium_rate": "Podium rate when desperate",
              "overall_podium_rate": "Overall career podium rate"
            }
          },
          {
            description: "Convert to score based on improvement under pressure",
            formula: "score = conditional_scoring(desperation_factor)",
            variables: {
              "desperation_factor": "Ratio of desperate vs normal performance",
              "conditional_scoring": "if factor > 1.5: min(90, 60+(factor-1)*30), elif factor > 1.0: 50+(factor-1)*20, else: max(20, 50*factor)"
            }
          }
        ]
      },
      {
        name: "Recovery Performance",
        weight: 0.15,
        steps: [
          {
            description: "Calculate recovery rate from poor qualifying (15th+ on grid)",
            formula: "recovery_rate = points_finishes_from_back / poor_qualifying_races",
            variables: {
              "points_finishes_from_back": "Points finishes when starting 15th or lower",
              "poor_qualifying_races": "Races starting 15th or lower"
            }
          },
          {
            description: "Calculate average positions gained from poor starts",
            formula: "avg_positions_gained = Σ(qualifying_pos - race_pos) / poor_starts",
            variables: {
              "qualifying_pos": "Qualifying position (15th+)",
              "race_pos": "Final race position",
              "poor_starts": "Number of poor starting positions"
            }
          },
          {
            description: "Combine recovery components",
            formula: "recovery_score = (recovery_rate × 40) + min(40, max(0, avg_positions_gained × 2)) + 20",
            variables: {
              "recovery_rate": "Rate of scoring points from back",
              "avg_positions_gained": "Average positions gained"
            }
          }
        ]
      }
    ],
    finalCalculation: {
      formula: "final_score = championship × 0.4 + season_ending × 0.25 + must_win × 0.2 + recovery × 0.15",
      description: "Weighted average of all pressure performance components"
    }
  },

  racecraft: {
    description: "Measures racecraft skills including overtaking quality, defensive driving, wheel-to-wheel combat, and strategic race intelligence",
    components: [
      {
        name: "Overtaking Quality",
        weight: 0.35,
        steps: [
          {
            description: "For each race, count overtaking moves using lap-by-lap position data",
            formula: "overtakes_per_race = count(position_improvements_per_lap)",
            variables: {
              "position_improvements": "Lap-by-lap position gains (negative position changes)"
            }
          },
          {
            description: "Calculate race overtaking score with track difficulty adjustment",
            formula: "race_score = ((total_overtakes × 10) + (avg_gain × 15) + (max_gain × 5)) × track_difficulty",
            variables: {
              "total_overtakes": "Number of overtaking moves in race",
              "avg_gain": "Average positions gained per overtake",
              "max_gain": "Maximum positions gained in single move",
              "track_difficulty": "Track difficulty multiplier (Monaco=3.0, Monza=1.0)"
            }
          },
          {
            description: "Calculate average overtaking quality across all races",
            formula: "overtaking_quality = mean(race_scores) + consistency_bonus",
            variables: {
              "race_scores": "Individual race overtaking scores",
              "consistency_bonus": "max(0, 20 - std_dev(race_scores))"
            }
          }
        ]
      },
      {
        name: "Defensive Driving",
        weight: 0.25,
        steps: [
          {
            description: "Calculate defensive lap ratio (laps maintaining position under pressure)",
            formula: "defensive_ratio = laps_held_position / total_laps",
            variables: {
              "laps_held_position": "Laps where position was maintained despite pressure",
              "total_laps": "Total racing laps"
            }
          },
          {
            description: "Calculate pressure resistance (avoiding position losses)",
            formula: "pressure_resistance = max(0, 1 - (positions_lost / total_laps))",
            variables: {
              "positions_lost": "Number of times position was lost",
              "total_laps": "Total racing laps"
            }
          },
          {
            description: "Combine defensive components",
            formula: "defensive_score = (defensive_ratio × 50) + (pressure_resistance × 50)",
            variables: {
              "defensive_ratio": "Position holding ratio",
              "pressure_resistance": "Resistance to losing positions"
            }
          }
        ]
      },
      {
        name: "Wheel-to-Wheel Combat",
        weight: 0.25,
        steps: [
          {
            description: "Calculate reliability factor (avoiding incidents in close racing)",
            formula: "reliability_factor = 1 - (driver_dnf_rate / era_average_dnf_rate)",
            variables: {
              "driver_dnf_rate": "Driver's DNF rate",
              "era_average_dnf_rate": "Average DNF rate for driver's era"
            }
          },
          {
            description: "Calculate position factor (gaining vs losing in wheel-to-wheel)",
            formula: "position_factor = min(1, max(-1, avg_position_change / 5))",
            variables: {
              "avg_position_change": "Average grid to finish position change",
              "5": "Scaling factor to normalize to ±1"
            }
          },
          {
            description: "Combine combat factors",
            formula: "combat_score = 50 + (reliability_factor × 25) + (position_factor × 25)",
            variables: {
              "reliability_factor": "Incident avoidance factor",
              "position_factor": "Position gain/loss factor"
            }
          }
        ]
      },
      {
        name: "Strategic Race Intelligence",
        weight: 0.15,
        steps: [
          {
            description: "Calculate qualifying to race improvement consistency",
            formula: "avg_improvement = mean(qualifying_pos - race_pos)",
            variables: {
              "qualifying_pos": "Qualifying position",
              "race_pos": "Final race position"
            }
          },
          {
            description: "Calculate improvement consistency",
            formula: "consistency = 1 / (1 + std_dev(position_changes))",
            variables: {
              "position_changes": "Race-by-race position improvements",
              "std_dev": "Standard deviation of improvements"
            }
          },
          {
            description: "Calculate strategic timing score",
            formula: "strategic_score = 50 + (avg_improvement × 8) + (consistency × 20)",
            variables: {
              "avg_improvement": "Average positions gained",
              "consistency": "Consistency factor"
            }
          }
        ]
      }
    ],
    finalCalculation: {
      formula: "final_score = overtaking × 0.35 + defensive × 0.25 + combat × 0.25 + strategic × 0.15",
      description: "Weighted average of all racecraft components"
    }
  },

  race_start: {
    description: "Measures ability to gain or maintain position on the first lap using lap timing data",
    components: [
      {
        name: "First Lap Position Change",
        weight: 1.0,
        steps: [
          {
            description: "Calculate average position change from grid to lap 1",
            formula: "avg_position_change = Σ(lap1_pos - grid_pos) / total_races",
            variables: {
              "lap1_pos": "Position after completing lap 1",
              "grid_pos": "Starting grid position",
              "total_races": "Races with both grid and lap 1 data"
            }
          },
          {
            description: "Calculate gain rate (percentage of races with position gains)",
            formula: "gain_rate = races_with_gains / total_races",
            variables: {
              "races_with_gains": "Races where positions were gained on lap 1",
              "total_races": "Total races analyzed"
            }
          },
          {
            description: "Calculate loss rate (percentage of races with position losses)",
            formula: "loss_rate = races_with_losses / total_races", 
            variables: {
              "races_with_losses": "Races where positions were lost on lap 1",
              "total_races": "Total races analyzed"
            }
          },
          {
            description: "Calculate base score from average position change",
            formula: "base_score = 50 + (avg_position_change × -10)",
            variables: {
              "avg_position_change": "Average positions gained (negative values)",
              "-10": "Scaling factor (negative because position gains are negative numbers)"
            }
          },
          {
            description: "Calculate frequency bonus based on gain vs loss rates",
            formula: "frequency_bonus = (gain_rate - loss_rate) × 20",
            variables: {
              "gain_rate": "Rate of gaining positions",
              "loss_rate": "Rate of losing positions",
              "20": "Scaling factor for frequency impact"
            }
          },
          {
            description: "Combine components for final score",
            formula: "race_start_score = base_score + frequency_bonus",
            variables: {
              "base_score": "Score based on average position change",
              "frequency_bonus": "Bonus for consistent gains vs losses"
            }
          }
        ]
      }
    ],
    finalCalculation: {
      formula: "final_score = race_start_score (single component)",
      description: "Direct calculation from first lap position change analysis"
    }
  }
};

// Helper function to get formula documentation for a specific trait
export function getTraitFormula(traitKey: string): TraitFormula | null {
  return DNA_FORMULAS[traitKey] || null;
}

// Helper function to format component values in formulas
export function substituteFormulaValues(formula: string, values: Record<string, number>): string {
  let result = formula;
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    result = result.replace(regex, value.toFixed(2));
  });
  return result;
}