#!/usr/bin/env python3
"""
Fetch Driver Images from Wikipedia
"""
import sys
import os
from pathlib import Path
import pandas as pd
import requests
import time
from tqdm import tqdm
from loguru import logger
from sqlalchemy import text

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from utils.database import db_manager

class DriverImageFetcher:
    
    def __init__(self):
        self.logger = logger
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'RacingDecoded/1.0 (https://racing-decoded.com; contact@racing-decoded.com)'
        })
    
    def get_wikipedia_image_url(self, wikipedia_url: str) -> str:
        """Extract image URL from Wikipedia page"""
        try:
            # Extract page title from URL
            page_title = wikipedia_url.split('/')[-1]
            
            # Use Wikipedia REST API
            api_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{page_title}"
            
            response = self.session.get(api_url, timeout=10)
            if response.status_code != 200:
                return None
            
            data = response.json()
            thumbnail = data.get('thumbnail', {}).get('source')
            
            if thumbnail:
                # Get higher resolution by modifying the URL
                # Wikipedia thumbnails can be resized
                high_res = thumbnail.replace('/150px-', '/400px-').replace('/200px-', '/400px-')
                return high_res
            
            return None
            
        except Exception as e:
            self.logger.debug(f"Error fetching image for {wikipedia_url}: {e}")
            return None
    
    def update_driver_images(self, limit: int = None) -> bool:
        """Fetch and store image URLs for drivers"""
        engine = db_manager.connect()
        
        try:
            # Get drivers with Wikipedia URLs who have DNA profiles
            if limit:
                query = f"""
                    SELECT d."driverId", d.forename, d.surname, d.url
                    FROM drivers d
                    JOIN drivers_dna_profiles p ON d."driverId" = p."driverId"
                    WHERE d.url IS NOT NULL 
                    AND d.url LIKE '%wikipedia%'
                    AND (p."imageUrl" IS NULL OR p."imageUrl" = '')
                    ORDER BY p."racesAnalyzed" DESC
                    LIMIT {limit}
                """
            else:
                query = """
                    SELECT d."driverId", d.forename, d.surname, d.url
                    FROM drivers d
                    JOIN drivers_dna_profiles p ON d."driverId" = p."driverId"
                    WHERE d.url IS NOT NULL 
                    AND d.url LIKE '%wikipedia%'
                    AND (p."imageUrl" IS NULL OR p."imageUrl" = '')
                    ORDER BY p."racesAnalyzed" DESC
                """
                
            df = pd.read_sql(query, engine.connect())
            
            if df.empty:
                self.logger.info("No drivers need image URL updates")
                return True
                
            self.logger.info(f"Fetching image URLs for {len(df)} drivers")
            
            successful_updates = 0
            
            with tqdm(df.iterrows(), total=len(df), desc="Fetching images") as pbar:
                for _, row in pbar:
                    driver_id = row['driverId']
                    driver_name = f"{row['forename']} {row['surname']}"
                    wikipedia_url = row['url']
                    
                    pbar.set_description(f"Fetching {driver_name}")
                    
                    # Get image URL from Wikipedia
                    image_url = self.get_wikipedia_image_url(wikipedia_url)
                    
                    if image_url:
                        # Update database
                        with engine.begin() as conn:
                            update_sql = text("""
                                UPDATE drivers_dna_profiles 
                                SET "imageUrl" = :image_url 
                                WHERE "driverId" = :driver_id
                            """)
                            conn.execute(update_sql, 
                                {'image_url': image_url, 'driver_id': driver_id}
                            )
                        
                        successful_updates += 1
                        self.logger.debug(f"Updated {driver_name}: {image_url}")
                    else:
                        self.logger.debug(f"No image found for {driver_name}")
                    
                    # Be respectful to Wikipedia's servers
                    time.sleep(0.5)
            
            self.logger.success(f"Successfully updated {successful_updates}/{len(df)} driver images")
            return True
            
        except Exception as e:
            self.logger.error(f"Error updating driver images: {e}")
            return False

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Fetch driver images from Wikipedia")
    parser.add_argument("--limit", type=int, help="Limit number of drivers to process")
    
    args = parser.parse_args()
    
    # First, add imageUrl column to database if it doesn't exist
    engine = db_manager.connect()
    try:
        with engine.begin() as conn:
            conn.execute(text("""
                ALTER TABLE drivers_dna_profiles 
                ADD COLUMN IF NOT EXISTS "imageUrl" TEXT
            """))
        logger.info("Added imageUrl column to database")
    except Exception as e:
        logger.debug(f"Column may already exist: {e}")
    
    fetcher = DriverImageFetcher()
    success = fetcher.update_driver_images(args.limit)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    # Configure logging
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
        level="INFO"
    )
    
    try:
        main()
    except KeyboardInterrupt:
        logger.warning("Image fetching cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Image fetching failed: {e}")
        sys.exit(1)