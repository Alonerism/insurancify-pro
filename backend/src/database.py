"""
Database connection and session management
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from models import Base, SEARCH_TABLE_SQL
from migrations import run_migrations
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/insurance.db")

# Create engine with appropriate settings for SQLite
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        poolclass=StaticPool,
        connect_args={
            "check_same_thread": False,
            "timeout": 20
        },
        echo=False
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """Initialize database with tables and FTS5 search"""
    # Ensure data directory exists
    os.makedirs("data", exist_ok=True)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Run database migrations
    db_path = DATABASE_URL.replace("sqlite:///", "").replace("./", "")
    logger.info(f"Running migrations on database: {db_path}")
    migration_success = run_migrations(db_path)
    
    if not migration_success:
        logger.error("Migration failed")
        raise Exception("Database migration failed")
    
    # Create FTS5 virtual table for search
    with engine.connect() as conn:
        conn.execute(text(SEARCH_TABLE_SQL))
        conn.commit()
    
    print("Database initialized successfully")

def seed_database():
    """Seed database with sample data matching the UI mock data"""
    from models import Agent, Building, Policy
    import json
    
    db = SessionLocal()
    try:
        # Check if data already exists
        if db.query(Agent).count() > 0:
            print("Database already contains data. Skipping seed.")
            return
        
        # Create agents
        agents_data = [
            {
                "id": "agent-1",
                "name": "Sarah Johnson",
                "company": "Premier Insurance Partners",
                "email": "sarah@premierinsurance.com",
                "phone": "(555) 123-4567"
            },
            {
                "id": "agent-2", 
                "name": "Mike Chen",
                "company": "West Coast Insurance Group",
                "email": "mike@westcoastins.com",
                "phone": "(555) 234-5678"
            },
            {
                "id": "agent-3",
                "name": "Lisa Rodriguez", 
                "company": "California Property Shield",
                "email": "lisa@capropshield.com",
                "phone": "(555) 345-6789"
            },
            {
                "id": "agent-4",
                "name": "David Park",
                "company": "Metro Insurance Solutions", 
                "email": "david@metroins.com",
                "phone": "(555) 456-7890"
            }
        ]
        
        for agent_data in agents_data:
            agent = Agent(**agent_data)
            db.add(agent)
        
        # Create buildings
        buildings_data = [
            {
                "id": "bld-1",
                "name": "Sunset Plaza",
                "address": "123 Main St, Los Angeles, CA 90210",
                "notes": "24-unit apartment complex",
                "primary_agent_id": "agent-1"
            },
            {
                "id": "bld-2",
                "name": "Ocean View Towers", 
                "address": "456 Pacific Ave, Santa Monica, CA 90401",
                "notes": "High-rise residential building",
                "primary_agent_id": "agent-2"
            },
            {
                "id": "bld-3",
                "name": "Downtown Lofts",
                "address": "789 Spring St, Los Angeles, CA 90014", 
                "notes": "Historic converted warehouse",
                "primary_agent_id": "agent-2"
            },
            {
                "id": "bld-4",
                "name": "Beverly Gardens",
                "address": "321 Rodeo Dr, Beverly Hills, CA 90210",
                "notes": "Luxury apartment complex",
                "primary_agent_id": "agent-4"
            }
        ]
        
        for building_data in buildings_data:
            building = Building(**building_data)
            db.add(building)
        
        # Create policies
        policies_data = [
            {
                "id": "pol-1",
                "building_id": "bld-1",
                "agent_id": "agent-1",
                "coverage_type": "general-liability",
                "policy_number": "GL-2024-001",
                "carrier": "State Farm",
                "effective_date": "2024-01-01",
                "expiration_date": "2024-12-31", 
                "limits_json": json.dumps({"aggregate": 2000000, "occurrence": 1000000}),
                "deductibles_json": json.dumps({"general": 5000}),
                "premium_annual": 12500,
                "status": "active"
            },
            {
                "id": "pol-2",
                "building_id": "bld-1",
                "agent_id": "agent-1",
                "coverage_type": "property",
                "policy_number": "PROP-2024-001",
                "carrier": "Allstate", 
                "effective_date": "2024-03-01",
                "expiration_date": "2025-03-01",
                "limits_json": json.dumps({"building": 5000000, "contents": 500000}),
                "deductibles_json": json.dumps({"windstorm": 25000, "other": 10000}),
                "premium_annual": 45000,
                "status": "active"
            },
            {
                "id": "pol-3",
                "building_id": "bld-2",
                "agent_id": "agent-2", 
                "coverage_type": "general-liability",
                "policy_number": "GL-2024-002",
                "carrier": "Travelers",
                "effective_date": "2024-06-01",
                "expiration_date": "2025-06-01",
                "limits_json": json.dumps({"aggregate": 3000000, "occurrence": 1500000}),
                "deductibles_json": json.dumps({"general": 10000}),
                "premium_annual": 18500,
                "status": "active"
            },
            {
                "id": "pol-4",
                "building_id": "bld-2", 
                "agent_id": "agent-3",
                "coverage_type": "umbrella",
                "policy_number": "UMB-2024-001",
                "carrier": "Liberty Mutual",
                "effective_date": "2024-04-01",
                "expiration_date": "2025-04-01",
                "limits_json": json.dumps({"umbrella": 10000000}),
                "deductibles_json": json.dumps({}),
                "premium_annual": 8200,
                "status": "active"
            },
            {
                "id": "pol-5",
                "building_id": "bld-3",
                "agent_id": "agent-2",
                "coverage_type": "property",
                "policy_number": "PROP-2024-002",
                "carrier": "Farmers",
                "effective_date": "2024-02-15",
                "expiration_date": "2024-12-15",
                "limits_json": json.dumps({"building": 3500000, "contents": 350000}),
                "deductibles_json": json.dumps({"windstorm": 15000, "other": 7500}), 
                "premium_annual": 32000,
                "status": "expiring-soon"
            },
            {
                "id": "pol-6",
                "building_id": "bld-4",
                "agent_id": "agent-4",
                "coverage_type": "general-liability",
                "policy_number": "GL-2024-003",
                "carrier": "CSAA",
                "effective_date": "2024-08-01", 
                "expiration_date": "2025-08-01",
                "limits_json": json.dumps({"aggregate": 2500000, "occurrence": 1250000}),
                "deductibles_json": json.dumps({"general": 7500}),
                "premium_annual": 15200,
                "status": "active"
            }
        ]
        
        for policy_data in policies_data:
            policy = Policy(**policy_data)
            db.add(policy)
        
        db.commit()
        print("Database seeded successfully with sample data")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
    seed_database()
