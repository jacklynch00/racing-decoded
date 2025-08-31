# Racing Decoded - Data Processing

This directory contains the Python data processing pipeline for calculating F1 Driver DNA traits.

## Setup

1. Install Python dependencies:
```bash
cd data_processing
pip install -r requirements.txt
```

2. Ensure your `.env` file in the root directory has the correct `DATABASE_URL`

3. Make sure your F1 CSV data is in the `f1_data/` directory

## Usage

The main script provides a command-line interface for all data processing tasks:

```bash
python main.py <command> [options]
```

### Available Commands

#### 1. Import CSV Data
Import F1 CSV files into the PostgreSQL database:
```bash
python main.py import
```

#### 2. Calculate DNA Traits
Calculate DNA traits for all eligible drivers:
```bash
python main.py calculate
python main.py calculate --min-races 20    # Require minimum 20 races
python main.py calculate --limit 10         # Process only top 10 drivers
```

#### 3. Update Specific Driver
Recalculate DNA for a specific driver:
```bash
python main.py update hamilton
python main.py update verstappen
```

#### 4. List Drivers
Show available drivers and their race counts:
```bash
python main.py list
python main.py list --min-races 50         # Show only drivers with 50+ races
python main.py list --limit 20             # Show top 20 drivers
```

#### 5. Show Status
Display current processing status:
```bash
python main.py status
```

## DNA Traits Implemented

Currently implemented DNA traits:

### 1. Aggression Score (0-100)
- **Overtaking Rate**: Positions gained during races vs qualifying
- **First Lap Performance**: Position changes on lap 1
- **Late Race Moves**: Position changes in final 10 laps

### 2. Consistency Score (0-100)  
- **Finishing Reliability**: DNF rate vs teammates/era average
- **Qualifying Consistency**: Standard deviation of qualifying positions
- **Points Scoring Reliability**: Consistency in scoring points

### Coming Soon
- **Racecraft Score**: Sunday performance vs qualifying, tire management
- **Pressure Performance**: Performance in championship-deciding races
- **Clutch Factor**: Performance when team needs points most
- **Weather Mastery**: Performance in wet conditions (optional)

## File Structure

```
data_processing/
├── main.py                     # Main orchestrator script
├── requirements.txt            # Python dependencies
├── utils/
│   ├── database.py            # Database connection utilities
│   ├── data_loader.py         # CSV loading utilities  
│   └── helpers.py             # Common helper functions
├── scripts/
│   ├── import_csv_data.py     # CSV import script
│   └── calculate_dna_traits.py # DNA calculation script
└── calculators/
    ├── base_calculator.py     # Base class for all calculators
    ├── aggression_calculator.py # Aggression trait calculator
    └── consistency_calculator.py # Consistency trait calculator
```

## Data Flow

1. **CSV Import**: F1 CSV files → PostgreSQL database
2. **DNA Calculation**: Database data → Python analysis → DNA scores
3. **Results Storage**: DNA profiles and breakdowns stored in database
4. **Web App Access**: Next.js app queries database for DNA data

## Database Tables

The processing pipeline works with these main tables:

**F1 Core Data:**
- `drivers`, `races`, `results`, `qualifying`
- `lap_times`, `pit_stops`, `constructor_*`

**DNA Analysis Results:**
- `drivers_dna_profiles`: Final DNA scores per driver
- `drivers_dna_breakdown`: Detailed trait calculations
- `drivers_dna_timeline`: Historical DNA evolution (future)

## Configuration

Key configuration options:

- **Minimum races required**: Default 15 races for DNA calculation
- **Era weighting**: More recent seasons weighted more heavily
- **Teammate normalization**: Performance relative to teammates
- **Statistical thresholds**: Outlier detection and data validation

## Logging

All processing operations are logged with detailed information:
- Data loading progress
- Calculation steps and results  
- Error handling and warnings
- Performance metrics

Use `--verbose` flag for detailed debug logging.

## Error Handling

The pipeline includes robust error handling:
- Graceful handling of missing data
- Validation of data quality
- Rollback on calculation failures
- Detailed error reporting

## Performance

Processing performance depends on data size:
- CSV Import: ~1-2 minutes for full F1 dataset
- DNA Calculation: ~30 seconds per driver
- Full pipeline: ~10-15 minutes for 100+ drivers

For large datasets, use the `--limit` option to process in batches.