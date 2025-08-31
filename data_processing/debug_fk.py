#!/usr/bin/env python3
"""
Debug foreign key constraint violations
"""
import pandas as pd
import sys
from pathlib import Path

def main():
    # Load circuits and races data
    circuits_df = pd.read_csv('f1_data/circuits.csv')
    races_df = pd.read_csv('f1_data/races.csv', na_values=['\\N', 'NULL', ''])
    
    print(f"Circuits: {len(circuits_df)} rows")
    print(f"Races: {len(races_df)} rows")
    
    # Get unique circuitIds from each
    circuit_ids = set(circuits_df['circuitId'].unique())
    race_circuit_ids = set(races_df['circuitId'].unique())
    
    print(f"\nCircuit IDs in circuits: {len(circuit_ids)}")
    print(f"Circuit IDs in races: {len(race_circuit_ids)}")
    
    # Find missing circuit IDs (in races but not in circuits)
    missing_circuits = race_circuit_ids - circuit_ids
    if missing_circuits:
        print(f"\nMISSING CIRCUITS (in races but not in circuits): {missing_circuits}")
        
        # Show example races with missing circuits
        missing_races = races_df[races_df['circuitId'].isin(missing_circuits)]
        print(f"Example races with missing circuits:")
        print(missing_races[['raceId', 'year', 'name', 'circuitId']].head(10))
    else:
        print("\nNo missing circuits - all race circuitIds exist in circuits table")
        
    # Check for null values
    null_circuits = races_df['circuitId'].isna().sum()
    if null_circuits > 0:
        print(f"\nNULL circuitId values in races: {null_circuits}")
    
    print(f"\nCircuit ID ranges:")
    print(f"  Circuits: {circuits_df['circuitId'].min()} - {circuits_df['circuitId'].max()}")
    print(f"  Races: {races_df['circuitId'].min()} - {races_df['circuitId'].max()}")

if __name__ == "__main__":
    main()