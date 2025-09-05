"""
Database migration system for Insurance Master
Handles schema versioning and incremental migrations
"""
import os
import sqlite3
import logging
from pathlib import Path
from typing import List, Tuple

logger = logging.getLogger(__name__)

class MigrationRunner:
    """Handles database schema migrations"""
    
    def __init__(self, db_path: str, migrations_dir: str = "migrations"):
        self.db_path = db_path
        self.migrations_dir = Path(migrations_dir)
        self.migrations_dir.mkdir(exist_ok=True)
    
    def get_current_version(self) -> int:
        """Get current schema version from database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Create schema_version table if it doesn't exist
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS schema_version (
                        version INTEGER PRIMARY KEY,
                        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Get latest version
                cursor.execute("SELECT MAX(version) FROM schema_version")
                result = cursor.fetchone()
                return result[0] if result[0] is not None else 0
                
        except Exception as e:
            logger.error(f"Error getting schema version: {e}")
            return 0
    
    def get_available_migrations(self) -> List[Tuple[int, Path]]:
        """Get list of available migration files"""
        migrations = []
        
        for file_path in sorted(self.migrations_dir.glob("*.sql")):
            try:
                # Extract version number from filename (e.g., 001_initial.sql -> 1)
                version_str = file_path.stem.split('_')[0]
                version = int(version_str)
                migrations.append((version, file_path))
            except (ValueError, IndexError):
                logger.warning(f"Skipping invalid migration file: {file_path}")
                continue
        
        return migrations
    
    def apply_migration(self, version: int, file_path: Path) -> bool:
        """Apply a single migration"""
        try:
            logger.info(f"Applying migration {version}: {file_path.name}")
            
            with open(file_path, 'r') as f:
                migration_sql = f.read()
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Execute migration
                cursor.executescript(migration_sql)
                
                # Record migration as applied
                cursor.execute(
                    "INSERT INTO schema_version (version) VALUES (?)",
                    (version,)
                )
                
                conn.commit()
                logger.info(f"Successfully applied migration {version}")
                return True
                
        except Exception as e:
            logger.error(f"Error applying migration {version}: {e}")
            return False
    
    def run_migrations(self) -> bool:
        """Run all pending migrations"""
        current_version = self.get_current_version()
        available_migrations = self.get_available_migrations()
        
        logger.info(f"Current schema version: {current_version}")
        
        # Filter to pending migrations
        pending_migrations = [
            (version, path) for version, path in available_migrations
            if version > current_version
        ]
        
        if not pending_migrations:
            logger.info("No pending migrations")
            return True
        
        logger.info(f"Found {len(pending_migrations)} pending migrations")
        
        # Apply migrations in order
        for version, file_path in pending_migrations:
            if not self.apply_migration(version, file_path):
                logger.error(f"Migration {version} failed, stopping")
                return False
        
        final_version = self.get_current_version()
        logger.info(f"Migrations complete. Schema version: {final_version}")
        return True

def run_migrations(db_path: str = "data/insurance.db") -> bool:
    """Convenience function to run migrations"""
    migrations_dir = os.path.join(os.path.dirname(__file__), "migrations")
    runner = MigrationRunner(db_path, migrations_dir)
    return runner.run_migrations()

if __name__ == "__main__":
    # Run migrations when called directly
    success = run_migrations()
    exit(0 if success else 1)
