"""
Database models for Insurance Management System
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class Agent(Base):
    __tablename__ = "agents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    company = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    buildings = relationship("Building", back_populates="primary_agent")
    policies = relationship("Policy", back_populates="agent")

class Building(Base):
    __tablename__ = "buildings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    notes = Column(Text)
    primary_agent_id = Column(String, ForeignKey("agents.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    primary_agent = relationship("Agent", back_populates="buildings")
    policies = relationship("Policy", back_populates="building")

class Policy(Base):
    __tablename__ = "policies"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    building_id = Column(String, ForeignKey("buildings.id"), nullable=False)
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    coverage_type = Column(String, nullable=False)  # 'general-liability', 'property', etc.
    policy_number = Column(String, nullable=False, unique=True)
    carrier = Column(String, nullable=False)
    effective_date = Column(String, nullable=False)  # ISO date string
    expiration_date = Column(String, nullable=False)  # ISO date string
    limits_json = Column(Text)  # JSON string of limits dict
    deductibles_json = Column(Text)  # JSON string of deductibles dict
    premium_annual = Column(Float, nullable=False)
    status = Column(String, nullable=False)  # 'active', 'expiring-soon', 'expired', 'missing'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    building = relationship("Building", back_populates="policies")
    agent = relationship("Agent", back_populates="policies")
    policy_files = relationship("PolicyFile", back_populates="policy")
    policy_history = relationship("PolicyHistory", back_populates="policy")

class PolicyFile(Base):
    __tablename__ = "policy_files"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_id = Column(String, ForeignKey("policies.id"))
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)
    content_type = Column(String)
    parsed_text = Column(Text)  # Full text extracted from PDF
    parsed_metadata_json = Column(Text)  # JSON string of extracted metadata
    confidence_score = Column(Float, default=0.0)  # Parser confidence 0.0-1.0
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    policy = relationship("Policy", back_populates="policy_files")

class PolicyHistory(Base):
    __tablename__ = "policy_history"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_id = Column(String, ForeignKey("policies.id"), nullable=False)
    note = Column(Text)  # User-added note
    file_id = Column(String, ForeignKey("policy_files.id"))  # Optional attached file
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    policy = relationship("Policy", back_populates="policy_history")
    file = relationship("PolicyFile")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_id = Column(String, ForeignKey("policies.id"))
    alert_type = Column(String, nullable=False)  # 'renewal', 'expiration', 'claim', etc.
    message = Column(Text, nullable=False)
    priority = Column(String, nullable=False)  # 'low', 'medium', 'high'
    is_read = Column(Boolean, default=False)
    is_sent = Column(Boolean, default=False)  # For email alerts
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    policy = relationship("Policy")

class Claim(Base):
    __tablename__ = "claims"
    
    id = Column(Integer, primary_key=True)
    policy_id = Column(String, ForeignKey("policies.id"), nullable=False)
    claim_number = Column(String, nullable=False)
    date = Column(String)  # ISO date string
    amount = Column(Float)
    status = Column(String, nullable=False, default='open')  # 'open', 'pending', 'closed'
    note = Column(Text)
    created_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat())
    updated_at = Column(String, nullable=False, default=lambda: datetime.utcnow().isoformat())
    
    # Relationships
    policy = relationship("Policy")

class CarrierMap(Base):
    __tablename__ = "carriers_map"
    
    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)

# Virtual table for full-text search (SQLite FTS5)
# This will be created manually via SQL since SQLAlchemy doesn't handle FTS5 well
SEARCH_TABLE_SQL = """
CREATE VIRTUAL TABLE IF NOT EXISTS policy_search USING fts5(
    policy_id,
    policy_number,
    carrier,
    building_name,
    agent_name,
    parsed_text,
    notes
);
"""
