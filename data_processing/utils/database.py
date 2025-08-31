"""
Database utilities for F1 data processing
"""
import os
from typing import Optional
from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
from loguru import logger

load_dotenv()

class DatabaseManager:
    """Manages database connections and operations"""
    
    def __init__(self, database_url: Optional[str] = None):
        self.database_url = database_url or os.getenv("DATABASE_URL")
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        self.engine: Optional[Engine] = None
        self.SessionLocal = None
        
    def connect(self) -> Engine:
        """Create database engine and session factory"""
        if not self.engine:
            self.engine = create_engine(
                self.database_url,
                echo=False,  # Set to True for SQL debugging
                pool_pre_ping=True,
                pool_recycle=300
            )
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
            logger.info("Database connection established")
        
        return self.engine
    
    def get_session(self) -> Session:
        """Get a database session"""
        if not self.SessionLocal:
            self.connect()
        return self.SessionLocal()
    
    def execute_raw_sql(self, sql: str, params: Optional[dict] = None):
        """Execute raw SQL query"""
        with self.get_session() as session:
            result = session.execute(sql, params or {})
            session.commit()
            return result
    
    def bulk_insert(self, table_name: str, data: list[dict]):
        """Perform bulk insert operation"""
        if not data:
            logger.warning(f"No data to insert into {table_name}")
            return
        
        engine = self.connect()
        with engine.begin() as conn:
            # Use pandas for efficient bulk insert
            import pandas as pd
            df = pd.DataFrame(data)
            df.to_sql(
                name=table_name,
                con=conn,
                if_exists='append',
                index=False,
                method='multi'
            )
            logger.info(f"Bulk inserted {len(data)} records into {table_name}")


# Global database manager instance
db_manager = DatabaseManager()