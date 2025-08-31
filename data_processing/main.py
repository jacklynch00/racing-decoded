#!/usr/bin/env python3
"""
Main orchestrator script for Racing Decoded data processing

This script provides a command-line interface to run the various data processing tasks:
1. Import CSV data into database
2. Calculate driver DNA traits  
3. Generate analysis reports
4. Update specific drivers
"""

import sys
import argparse
from pathlib import Path
from loguru import logger

# Add current directory to path for imports
sys.path.append(str(Path(__file__).parent))

def setup_logging(verbose: bool = False):
    """Configure logging"""
    logger.remove()
    
    level = "DEBUG" if verbose else "INFO"
    format_string = ("<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
                    "<level>{level: <8}</level> | "
                    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
                    "<level>{message}</level>")
    
    logger.add(sys.stdout, format=format_string, level=level)

def import_csv_data(args):
    """Import F1 CSV data into database"""
    logger.info("Importing CSV data into database...")
    
    try:
        from scripts.import_csv_data import main as import_main
        success = import_main()
        
        if success:
            logger.success("CSV data import completed successfully")
        else:
            logger.error("CSV data import failed")
            sys.exit(1)
            
    except ImportError as e:
        logger.error(f"Could not import CSV import script: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"CSV import failed: {e}")
        sys.exit(1)

def calculate_dna(args):
    """Calculate driver DNA traits"""
    logger.info("Calculating driver DNA traits...")
    
    try:
        from scripts.calculate_dna_traits import DNAProcessor
        
        processor = DNAProcessor()
        
        # Load data
        if not processor.load_f1_data():
            logger.error("Failed to load F1 data")
            sys.exit(1)
        
        # Process drivers
        min_races = args.min_races or 15
        limit = args.limit
        
        success = processor.process_all_drivers(min_races=min_races, limit=limit)
        
        if success:
            logger.success("DNA calculation completed successfully")
        else:
            logger.error("DNA calculation failed")
            sys.exit(1)
            
    except ImportError as e:
        logger.error(f"Could not import DNA calculation script: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"DNA calculation failed: {e}")
        sys.exit(1)

def calculate_timeline(args):
    """Calculate driver DNA timeline data"""
    logger.info("Calculating driver DNA timeline data...")
    
    try:
        from scripts.calculate_timeline import main as timeline_main
        
        success = timeline_main(args.limit)
        
        if success:
            logger.success("DNA timeline calculation completed successfully")
        else:
            logger.error("DNA timeline calculation failed")
            sys.exit(1)
            
    except ImportError as e:
        logger.error(f"Could not import DNA timeline script: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"DNA timeline calculation failed: {e}")
        sys.exit(1)

def update_driver(args):
    """Update DNA calculation for specific driver"""
    logger.info(f"Updating DNA for driver: {args.driver_id}")
    
    try:
        from scripts.calculate_dna_traits import DNAProcessor
        
        processor = DNAProcessor()
        
        # Load data
        if not processor.load_f1_data():
            logger.error("Failed to load F1 data")
            sys.exit(1)
        
        # Get driver info
        drivers_data = processor.data_cache.get('drivers', None)
        if drivers_data is None:
            logger.error("No drivers data available")
            sys.exit(1)
        
        driver_info = drivers_data[drivers_data['driverId'] == args.driver_id]
        if driver_info.empty:
            logger.error(f"Driver {args.driver_id} not found")
            sys.exit(1)
        
        driver_info_dict = {
            'driverId': driver_info['driverId'].iloc[0],
            'name': f"{driver_info['forename'].iloc[0]} {driver_info['surname'].iloc[0]}",
            'forename': driver_info['forename'].iloc[0],
            'surname': driver_info['surname'].iloc[0]
        }
        
        # Calculate DNA
        dna_data = processor.calculate_driver_dna(args.driver_id, driver_info_dict)
        
        if dna_data and processor.save_dna_results(dna_data):
            logger.success(f"Successfully updated DNA for {driver_info_dict['name']}")
            
            # Print results
            profile = dna_data['profile']
            print(f"\nDNA Profile for {profile['driverName']}:")
            print(f"  Aggression: {profile['aggressionScore']:.1f}")
            print(f"  Consistency: {profile['consistencyScore']:.1f}")
            if profile.get('raceStartScore') is not None:
                print(f"  Race Start: {profile['raceStartScore']:.1f}")
            print(f"  Pressure Performance: {profile['pressurePerformanceScore']:.1f}")
            print(f"  Racecraft: {profile['racecraftScore']:.1f}")
            print(f"  Clutch Factor: {profile['clutchFactorScore']:.1f}")
            print(f"  Races Analyzed: {profile['racesAnalyzed']}")
            print(f"  Career Span: {profile['careerSpan']}")
        else:
            logger.error(f"Failed to update DNA for {driver_info_dict['name']}")
            sys.exit(1)
            
    except ImportError as e:
        logger.error(f"Could not import DNA calculation script: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Driver update failed: {e}")
        sys.exit(1)

def list_drivers(args):
    """List drivers and their race counts"""
    try:
        from utils.database import db_manager
        import pandas as pd
        
        engine = db_manager.connect()
        
        # Get drivers with race counts
        query = """
        SELECT 
            d.driverId,
            d.forename,
            d.surname,
            COUNT(r.resultId) as race_count,
            MIN(ra.year) as career_start,
            MAX(ra.year) as career_end
        FROM drivers d
        LEFT JOIN results r ON d.driverId = r.driverId  
        LEFT JOIN races ra ON r.raceId = ra.raceId
        GROUP BY d.driverId, d.forename, d.surname
        HAVING COUNT(r.resultId) >= %s
        ORDER BY race_count DESC
        LIMIT %s
        """ 
        
        min_races = args.min_races or 0
        limit = args.limit or 50
        
        drivers_df = pd.read_sql(query, engine, params=[min_races, limit])
        
        if drivers_df.empty:
            print("No drivers found")
            return
        
        print(f"\nDrivers with at least {min_races} races (showing top {limit}):")
        print("-" * 80)
        print(f"{'Driver':<25} {'Driver ID':<15} {'Races':<8} {'Career Span':<15}")
        print("-" * 80)
        
        for _, driver in drivers_df.iterrows():
            name = f"{driver['forename']} {driver['surname']}"
            career_span = f"{driver['career_start']}-{driver['career_end']}" if driver['career_start'] else "Unknown"
            print(f"{name:<25} {driver['driverId']:<15} {driver['race_count']:<8} {career_span:<15}")
        
    except Exception as e:
        logger.error(f"Failed to list drivers: {e}")
        sys.exit(1)

def show_status(args):
    """Show processing status"""
    try:
        from utils.database import db_manager
        import pandas as pd
        
        engine = db_manager.connect()
        
        # Check data availability
        tables = ['seasons', 'circuits', 'constructors', 'drivers', 'races', 'status', 
                 'results', 'qualifying', 'lap_times', 'pit_stops', 'driver_standings',
                 'constructor_results', 'constructor_standings', 'sprint_results', 'drivers_dna_profiles']
        
        print("\\nRacing Decoded - Data Processing Status")
        print("=" * 50)
        
        for table in tables:
            try:
                count_query = f"SELECT COUNT(*) as count FROM {table}"
                result = pd.read_sql(count_query, engine)
                count = result['count'].iloc[0]
                print(f"{table:<25}: {count:,} records")
            except Exception as e:
                print(f"{table:<25}: Not available ({e})")
        
        # Show latest DNA calculations
        try:
            latest_query = """
            SELECT COUNT(*) as count, MAX("lastUpdated") as latest_update
            FROM drivers_dna_profiles
            """
            latest_result = pd.read_sql(latest_query, engine)
            
            if latest_result['count'].iloc[0] > 0:
                latest_update = latest_result['latest_update'].iloc[0]
                print(f"\\nLatest DNA calculation: {latest_update}")
                print(f"Total drivers with DNA profiles: {latest_result['count'].iloc[0]}")
            else:
                print("\\nNo DNA profiles calculated yet")
                
        except Exception as e:
            print(f"\\nCould not check DNA status: {e}")
        
        # Show sample DNA profiles
        try:
            sample_query = """
            SELECT 
                "driverName",
                "aggressionScore",
                "consistencyScore",
                "raceStartScore",
                "racecraftScore",
                "racesAnalyzed",
                "careerSpan"
            FROM drivers_dna_profiles
            ORDER BY "racesAnalyzed" DESC
            LIMIT 5
            """
            
            sample_df = pd.read_sql(sample_query, engine)
            
            if not sample_df.empty:
                print("\\nSample DNA Profiles (Top 5 by races analyzed):")
                print("-" * 90)
                for _, profile in sample_df.iterrows():
                    race_start_str = f"{profile['raceStartScore']:5.1f}" if profile['raceStartScore'] is not None else "  N/A"
                    print(f"{profile['driverName']:<20} | "
                          f"Aggr: {profile['aggressionScore']:5.1f} | "
                          f"Cons: {profile['consistencyScore']:5.1f} | "
                          f"Start: {race_start_str} | "
                          f"Race: {profile['racecraftScore']:5.1f} | "
                          f"Races: {profile['racesAnalyzed']:3d} | "
                          f"Career: {profile['careerSpan']}")
        
        except Exception as e:
            logger.warning(f"Could not show sample profiles: {e}")
        
    except Exception as e:
        logger.error(f"Failed to show status: {e}")
        sys.exit(1)

def main():
    """Main function with argument parsing"""
    parser = argparse.ArgumentParser(
        description="Racing Decoded - F1 Driver DNA Analysis Data Processing",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s import                          # Import CSV data
  %(prog)s calculate                       # Calculate DNA for all drivers
  %(prog)s calculate --min-races 20       # Calculate DNA for drivers with 20+ races
  %(prog)s calculate --limit 10            # Calculate DNA for top 10 drivers only
  %(prog)s update hamilton                 # Update DNA for specific driver
  %(prog)s list --min-races 50             # List drivers with 50+ races
  %(prog)s status                          # Show processing status
        """
    )
    
    parser.add_argument('-v', '--verbose', action='store_true',
                       help='Enable verbose logging')
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Import command
    import_parser = subparsers.add_parser('import', help='Import CSV data into database')
    
    # Calculate command
    calc_parser = subparsers.add_parser('calculate', help='Calculate driver DNA traits')
    calc_parser.add_argument('--min-races', type=int, default=15,
                            help='Minimum races required for analysis (default: 15)')
    calc_parser.add_argument('--limit', type=int,
                            help='Limit number of drivers to process')
    
    # Timeline command
    timeline_parser = subparsers.add_parser('timeline', help='Calculate driver DNA timeline data')
    timeline_parser.add_argument('--limit', type=int,
                                help='Limit number of drivers to process')
    
    # Update command
    update_parser = subparsers.add_parser('update', help='Update specific driver DNA')
    update_parser.add_argument('driver_id', help='Driver ID to update')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List available drivers')
    list_parser.add_argument('--min-races', type=int, default=0,
                            help='Minimum races to show (default: 0)')
    list_parser.add_argument('--limit', type=int, default=50,
                            help='Maximum drivers to show (default: 50)')
    
    # Status command
    status_parser = subparsers.add_parser('status', help='Show processing status')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Setup logging
    setup_logging(args.verbose)
    
    # Route to appropriate function
    command_functions = {
        'import': import_csv_data,
        'calculate': calculate_dna,
        'timeline': calculate_timeline,
        'update': update_driver,
        'list': list_drivers,
        'status': show_status
    }
    
    if args.command in command_functions:
        command_functions[args.command](args)
    else:
        logger.error(f"Unknown command: {args.command}")
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.warning("Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)