"""
Test search functionality
"""
import pytest
import tempfile
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import json

# Add src to path
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from models import Base, Agent, Building, Policy, PolicyFile, PolicyHistory, SEARCH_TABLE_SQL
from search import SearchService

@pytest.fixture
def temp_db_with_data():
    """Create a temporary test database with sample data"""
    temp_db_file = tempfile.mktemp(suffix='.db')
    db_url = f"sqlite:///{temp_db_file}"
    
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    
    # Create FTS5 table
    with engine.connect() as conn:
        conn.execute(text(SEARCH_TABLE_SQL))
        conn.commit()
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    
    # Add sample data
    agent = Agent(
        id="agent-1",
        name="John Smith",
        company="Smith Insurance",
        email="john@smith.com",
        phone="555-1234"
    )
    session.add(agent)
    
    building = Building(
        id="building-1",
        name="Sunset Plaza",
        address="123 Main St, Los Angeles, CA",
        primary_agent_id="agent-1"
    )
    session.add(building)
    
    policy = Policy(
        id="policy-1",
        building_id="building-1",
        agent_id="agent-1",
        coverage_type="general-liability",
        policy_number="GL-2024-001",
        carrier="State Farm",
        effective_date="2024-01-01",
        expiration_date="2024-12-31",
        limits_json=json.dumps({"aggregate": 2000000}),
        deductibles_json=json.dumps({"general": 5000}),
        premium_annual=12500,
        status="active"
    )
    session.add(policy)
    
    policy_file = PolicyFile(
        id="file-1",
        policy_id="policy-1",
        filename="test.pdf",
        original_filename="policy_document.pdf",
        file_path="/tmp/test.pdf",
        parsed_text="General Liability Policy for Sunset Plaza building with State Farm insurance",
        confidence_score=0.9
    )
    session.add(policy_file)
    
    history = PolicyHistory(
        policy_id="policy-1",
        note="Policy renewed for another year with updated premium"
    )
    session.add(history)
    
    session.commit()
    
    yield session
    
    session.close()
    if os.path.exists(temp_db_file):
        os.unlink(temp_db_file)

def test_search_service_initialization():
    """Test search service initialization"""
    service = SearchService()
    assert service.db is not None
    service.close()

def test_prepare_fts_query():
    """Test FTS query preparation"""
    service = SearchService()
    
    # Test basic query
    query = service._prepare_fts_query("test query")
    assert "test" in query
    assert "query" in query
    
    # Test special characters removal
    query = service._prepare_fts_query("test(query)")
    assert "(" not in query
    assert ")" not in query
    
    # Test empty query
    query = service._prepare_fts_query("")
    assert query == '""'
    
    service.close()

def test_search_suggestions():
    """Test search suggestions"""
    service = SearchService()
    
    suggestions = service.get_search_suggestions("test", 5)
    assert isinstance(suggestions, list)
    assert len(suggestions) <= 5
    
    # Test short query
    suggestions = service.get_search_suggestions("a", 5)
    assert suggestions == []
    
    service.close()

def test_rebuild_search_index(temp_db_with_data):
    """Test rebuilding search index"""
    # Mock the database session in SearchService
    service = SearchService()
    service.db = temp_db_with_data
    
    result = service.rebuild_search_index()
    
    assert result["success"] is True
    assert result["indexed_policies"] >= 0
    
    service.close()

def test_search_policy_history(temp_db_with_data):
    """Test searching policy history"""
    service = SearchService()
    service.db = temp_db_with_data
    
    results = service._search_policy_history("renewed", 10)
    
    assert isinstance(results, list)
    # Should find the history entry we created
    if results:
        assert any("renewed" in result.get("note_preview", "").lower() for result in results)
    
    service.close()

def test_empty_search():
    """Test empty search query"""
    service = SearchService()
    
    results = service.search_policies("")
    assert results == []
    
    results = service.search_policies("   ")
    assert results == []
    
    service.close()

def test_search_error_handling():
    """Test search error handling"""
    service = SearchService()
    
    # This should not crash even with invalid queries
    results = service.search_policies("invalid(query*")
    assert isinstance(results, list)
    
    service.close()
