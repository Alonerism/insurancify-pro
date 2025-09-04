"""
Test database operations and models
"""
import pytest
import tempfile
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import json

# Add src to path
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from models import Base, Agent, Building, Policy, PolicyFile, PolicyHistory, Alert
from database import init_database, seed_database

@pytest.fixture
def temp_db():
    """Create a temporary test database"""
    temp_db_file = tempfile.mktemp(suffix='.db')
    db_url = f"sqlite:///{temp_db_file}"
    
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    
    yield session
    
    session.close()
    if os.path.exists(temp_db_file):
        os.unlink(temp_db_file)

def test_agent_creation(temp_db):
    """Test creating an agent"""
    agent = Agent(
        name="Test Agent",
        company="Test Company",
        email="test@example.com",
        phone="555-1234"
    )
    
    temp_db.add(agent)
    temp_db.commit()
    temp_db.refresh(agent)
    
    assert agent.id is not None
    assert agent.name == "Test Agent"
    assert agent.company == "Test Company"
    assert agent.email == "test@example.com"
    assert agent.phone == "555-1234"

def test_building_creation(temp_db):
    """Test creating a building"""
    # Create agent first
    agent = Agent(
        name="Test Agent",
        company="Test Company", 
        email="test@example.com",
        phone="555-1234"
    )
    temp_db.add(agent)
    temp_db.commit()
    temp_db.refresh(agent)
    
    # Create building
    building = Building(
        name="Test Building",
        address="123 Test St",
        notes="Test notes",
        primary_agent_id=agent.id
    )
    
    temp_db.add(building)
    temp_db.commit()
    temp_db.refresh(building)
    
    assert building.id is not None
    assert building.name == "Test Building"
    assert building.address == "123 Test St"
    assert building.notes == "Test notes"
    assert building.primary_agent_id == agent.id

def test_policy_creation(temp_db):
    """Test creating a policy"""
    # Create agent
    agent = Agent(
        name="Test Agent",
        company="Test Company",
        email="test@example.com", 
        phone="555-1234"
    )
    temp_db.add(agent)
    temp_db.commit()
    temp_db.refresh(agent)
    
    # Create building
    building = Building(
        name="Test Building",
        address="123 Test St",
        primary_agent_id=agent.id
    )
    temp_db.add(building)
    temp_db.commit()
    temp_db.refresh(building)
    
    # Create policy
    limits = {"aggregate": 1000000, "occurrence": 500000}
    deductibles = {"general": 5000}
    
    policy = Policy(
        building_id=building.id,
        agent_id=agent.id,
        coverage_type="general-liability",
        policy_number="TEST-2024-001",
        carrier="Test Insurance",
        effective_date="2024-01-01",
        expiration_date="2024-12-31",
        limits_json=json.dumps(limits),
        deductibles_json=json.dumps(deductibles),
        premium_annual=10000,
        status="active"
    )
    
    temp_db.add(policy)
    temp_db.commit()
    temp_db.refresh(policy)
    
    assert policy.id is not None
    assert policy.policy_number == "TEST-2024-001"
    assert policy.carrier == "Test Insurance"
    assert json.loads(policy.limits_json) == limits
    assert json.loads(policy.deductibles_json) == deductibles

def test_policy_file_creation(temp_db):
    """Test creating a policy file"""
    # Create basic entities
    agent = Agent(name="Test Agent", company="Test Company", email="test@example.com", phone="555-1234")
    temp_db.add(agent)
    temp_db.commit()
    temp_db.refresh(agent)
    
    building = Building(name="Test Building", address="123 Test St", primary_agent_id=agent.id)
    temp_db.add(building)
    temp_db.commit()
    temp_db.refresh(building)
    
    policy = Policy(
        building_id=building.id,
        agent_id=agent.id,
        coverage_type="general-liability",
        policy_number="TEST-2024-001",
        carrier="Test Insurance",
        effective_date="2024-01-01",
        expiration_date="2024-12-31",
        limits_json="{}",
        deductibles_json="{}",
        premium_annual=10000,
        status="active"
    )
    temp_db.add(policy)
    temp_db.commit()
    temp_db.refresh(policy)
    
    # Create policy file
    policy_file = PolicyFile(
        policy_id=policy.id,
        filename="test_file.pdf",
        original_filename="original_test.pdf",
        file_path="/tmp/test_file.pdf",
        file_size=1024,
        content_type="application/pdf",
        parsed_text="Test policy document content",
        parsed_metadata_json='{"carrier": "Test Insurance"}',
        confidence_score=0.8
    )
    
    temp_db.add(policy_file)
    temp_db.commit()
    temp_db.refresh(policy_file)
    
    assert policy_file.id is not None
    assert policy_file.policy_id == policy.id
    assert policy_file.filename == "test_file.pdf"
    assert policy_file.confidence_score == 0.8

def test_policy_history_creation(temp_db):
    """Test creating policy history"""
    # Create basic entities
    agent = Agent(name="Test Agent", company="Test Company", email="test@example.com", phone="555-1234")
    temp_db.add(agent)
    temp_db.commit()
    temp_db.refresh(agent)
    
    building = Building(name="Test Building", address="123 Test St", primary_agent_id=agent.id)
    temp_db.add(building)
    temp_db.commit()
    temp_db.refresh(building)
    
    policy = Policy(
        building_id=building.id,
        agent_id=agent.id,
        coverage_type="general-liability",
        policy_number="TEST-2024-001",
        carrier="Test Insurance",
        effective_date="2024-01-01",
        expiration_date="2024-12-31",
        limits_json="{}",
        deductibles_json="{}",
        premium_annual=10000,
        status="active"
    )
    temp_db.add(policy)
    temp_db.commit()
    temp_db.refresh(policy)
    
    # Create history entry
    history = PolicyHistory(
        policy_id=policy.id,
        note="Test note about policy renewal"
    )
    
    temp_db.add(history)
    temp_db.commit()
    temp_db.refresh(history)
    
    assert history.id is not None
    assert history.policy_id == policy.id
    assert history.note == "Test note about policy renewal"

def test_alert_creation(temp_db):
    """Test creating an alert"""
    # Create basic entities
    agent = Agent(name="Test Agent", company="Test Company", email="test@example.com", phone="555-1234")
    temp_db.add(agent)
    temp_db.commit()
    temp_db.refresh(agent)
    
    building = Building(name="Test Building", address="123 Test St", primary_agent_id=agent.id)
    temp_db.add(building)
    temp_db.commit()
    temp_db.refresh(building)
    
    policy = Policy(
        building_id=building.id,
        agent_id=agent.id,
        coverage_type="general-liability",
        policy_number="TEST-2024-001",
        carrier="Test Insurance",
        effective_date="2024-01-01",
        expiration_date="2024-12-31",
        limits_json="{}",
        deductibles_json="{}",
        premium_annual=10000,
        status="active"
    )
    temp_db.add(policy)
    temp_db.commit()
    temp_db.refresh(policy)
    
    # Create alert
    alert = Alert(
        policy_id=policy.id,
        alert_type="renewal",
        message="Policy expires in 30 days",
        priority="high"
    )
    
    temp_db.add(alert)
    temp_db.commit()
    temp_db.refresh(alert)
    
    assert alert.id is not None
    assert alert.policy_id == policy.id
    assert alert.alert_type == "renewal"
    assert alert.message == "Policy expires in 30 days"
    assert alert.priority == "high"
    assert alert.is_read == False
    assert alert.is_sent == False

def test_relationships(temp_db):
    """Test model relationships"""
    # Create entities
    agent = Agent(name="Test Agent", company="Test Company", email="test@example.com", phone="555-1234")
    temp_db.add(agent)
    temp_db.commit()
    temp_db.refresh(agent)
    
    building = Building(name="Test Building", address="123 Test St", primary_agent_id=agent.id)
    temp_db.add(building)
    temp_db.commit()
    temp_db.refresh(building)
    
    policy = Policy(
        building_id=building.id,
        agent_id=agent.id,
        coverage_type="general-liability",
        policy_number="TEST-2024-001",
        carrier="Test Insurance",
        effective_date="2024-01-01",
        expiration_date="2024-12-31",
        limits_json="{}",
        deductibles_json="{}",
        premium_annual=10000,
        status="active"
    )
    temp_db.add(policy)
    temp_db.commit()
    temp_db.refresh(policy)
    
    # Test relationships
    assert building.primary_agent.id == agent.id
    assert policy.building.id == building.id
    assert policy.agent.id == agent.id
    assert len(agent.buildings) == 1
    assert len(agent.policies) == 1
    assert len(building.policies) == 1
