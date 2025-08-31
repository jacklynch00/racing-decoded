#!/usr/bin/env python3
"""
Fetch Driver Images from Wikipedia - Simplified Version
"""
import sys
import os
from pathlib import Path
import requests
import time
from loguru import logger
from sqlalchemy import text
import json

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from utils.database import db_manager

def get_wikipedia_image_url(wikipedia_url: str) -> str:
    """Extract image URL from Wikipedia page"""
    try:
        # Extract page title from URL
        page_title = wikipedia_url.split('/')[-1]
        
        # Use Wikipedia REST API
        api_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{page_title}"
        
        headers = {
            'User-Agent': 'RacingDecoded/1.0 (https://racing-decoded.com)'
        }
        
        response = requests.get(api_url, headers=headers, timeout=10)
        if response.status_code != 200:
            logger.debug(f"Failed to fetch {api_url}: {response.status_code}")
            return None
        
        data = response.json()
        thumbnail = data.get('thumbnail', {}).get('source')
        
        if thumbnail:
            # Get higher resolution by modifying the URL
            high_res = thumbnail.replace('/150px-', '/400px-').replace('/200px-', '/400px-')
            return high_res
        
        return None
        
    except Exception as e:
        logger.debug(f"Error fetching image for {wikipedia_url}: {e}")
        return None

def main():
    engine = db_manager.connect()
    
    # Get drivers with Wikipedia URLs
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT d."driverId", d.forename, d.surname, d.url, p."imageUrl"
            FROM drivers d
            JOIN drivers_dna_profiles p ON d."driverId" = p."driverId"
            WHERE d.url IS NOT NULL 
            AND d.url LIKE '%wikipedia%'
            AND (p."imageUrl" IS NULL OR p."imageUrl" = '')
            ORDER BY p."racesAnalyzed" DESC
            LIMIT 50
        """))
        
        drivers = result.fetchall()
    
    if not drivers:
        logger.info("No drivers need image URL updates")
        return
    
    logger.info(f"Fetching image URLs for {len(drivers)} drivers")
    successful_updates = 0
    
    for driver in drivers:
        driver_id = driver[0]
        driver_name = f"{driver[1]} {driver[2]}"
        wikipedia_url = driver[3]
        
        logger.info(f"Processing {driver_name}")
        
        # Get image URL from Wikipedia
        image_url = get_wikipedia_image_url(wikipedia_url)
        
        if image_url:
            # Update database
            with engine.begin() as conn:
                conn.execute(text("""
                    UPDATE drivers_dna_profiles 
                    SET "imageUrl" = :image_url 
                    WHERE "driverId" = :driver_id
                """), {'image_url': image_url, 'driver_id': driver_id})
            
            successful_updates += 1
            logger.success(f"Updated {driver_name}: {image_url}")
        else:
            logger.warning(f"No image found for {driver_name}")
        
        # Be respectful to Wikipedia's servers
        time.sleep(1)
    
    logger.success(f"Successfully updated {successful_updates}/{len(drivers)} driver images")

if __name__ == "__main__":
    # Configure logging
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
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