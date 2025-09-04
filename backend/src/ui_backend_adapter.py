"""
UI Backend Adapter - Bridge between frontend and backend services
Provides both function-based and FastAPI HTTP endpoints
"""
import os
import json
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
from dotenv import load_dotenv

from database import SessionLocal, init_database, seed_database
from models import Agent, Building, Policy, PolicyHistory, PolicyFile, Alert
from ingestion import FileIngestionService
from search import SearchService
from alerts import AlertService
from pdf_parser import PDFParser

load_dotenv()
logger = logging.getLogger(__name__)

class UIBackendAdapter:
    """Main adapter class providing backend functionality to the UI"""
    
    def __init__(self):
        self.db = SessionLocal()
        self.ingestion_service = FileIngestionService()
        self.search_service = SearchService()
        self.alert_service = AlertService()
        self.pdf_parser = PDFParser()
    
    # Agent Management
    def list_agents(self) -> List[Dict[str, Any]]:
        """Get all agents"""
        try:
            agents = self.db.query(Agent).all()
            return [
                {
                    "id": agent.id,
                    "name": agent.name,
                    "company": agent.company,
                    "email": agent.email,
                    "phone": agent.phone,
                    "created_at": agent.created_at.isoformat(),
                    "updated_at": agent.updated_at.isoformat()
                }
                for agent in agents
            ]
        except Exception as e:
            logger.error(f"Error listing agents: {e}")
            return []
    
    def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific agent by ID"""
        try:
            agent = self.db.query(Agent).filter(Agent.id == agent_id).first()
            if not agent:
                return None
            
            return {
                "id": agent.id,
                "name": agent.name,
                "company": agent.company,
                "email": agent.email,
                "phone": agent.phone,
                "created_at": agent.created_at.isoformat(),
                "updated_at": agent.updated_at.isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting agent {agent_id}: {e}")
            return None
    
    def add_agent(self, name: str, company: str, email: str, phone: str) -> Dict[str, Any]:
        """Add a new agent"""
        try:
            agent = Agent(
                name=name,
                company=company,
                email=email,
                phone=phone
            )
            self.db.add(agent)
            self.db.commit()
            self.db.refresh(agent)
            
            return {
                "success": True,
                "agent_id": agent.id,
                "message": "Agent added successfully"
            }
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error adding agent: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to add agent"
            }
    
    # Building Management
    def list_buildings(self, agent_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get buildings, optionally filtered by agent"""
        try:
            query = self.db.query(Building)
            if agent_id:
                query = query.filter(Building.primary_agent_id == agent_id)
            
            buildings = query.all()
            result = []
            
            for building in buildings:
                # Get primary agent info
                agent = None
                if building.primary_agent_id:
                    agent = self.db.query(Agent).filter(Agent.id == building.primary_agent_id).first()
                
                # Count policies for this building
                policy_count = self.db.query(Policy).filter(Policy.building_id == building.id).count()
                
                result.append({
                    "id": building.id,
                    "name": building.name,
                    "address": building.address,
                    "notes": building.notes,
                    "primary_agent_id": building.primary_agent_id,
                    "primary_agent": {
                        "id": agent.id if agent else None,
                        "name": agent.name if agent else None,
                        "company": agent.company if agent else None
                    } if agent else None,
                    "policy_count": policy_count,
                    "created_at": building.created_at.isoformat(),
                    "updated_at": building.updated_at.isoformat()
                })
            
            return result
        except Exception as e:
            logger.error(f"Error listing buildings: {e}")
            return []
    
    def add_building(self, name: str, address: str, notes: str = "", primary_agent_id: Optional[str] = None) -> Dict[str, Any]:
        """Add a new building"""
        try:
            building = Building(
                name=name,
                address=address,
                notes=notes,
                primary_agent_id=primary_agent_id
            )
            self.db.add(building)
            self.db.commit()
            self.db.refresh(building)
            
            return {
                "success": True,
                "building_id": building.id,
                "message": "Building added successfully"
            }
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error adding building: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to add building"
            }
    
    # Policy Management
    def get_policies(self, building_id: Optional[str] = None, agent_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get policies, optionally filtered by building or agent"""
        try:
            query = self.db.query(Policy)
            if building_id:
                query = query.filter(Policy.building_id == building_id)
            if agent_id:
                query = query.filter(Policy.agent_id == agent_id)
            
            policies = query.all()
            result = []
            
            for policy in policies:
                # Get building and agent info
                building = self.db.query(Building).filter(Building.id == policy.building_id).first()
                agent = self.db.query(Agent).filter(Agent.id == policy.agent_id).first()
                
                # Parse JSON fields
                limits = {}
                deductibles = {}
                try:
                    if policy.limits_json:
                        limits = json.loads(policy.limits_json)
                    if policy.deductibles_json:
                        deductibles = json.loads(policy.deductibles_json)
                except json.JSONDecodeError:
                    pass
                
                # Get document count
                doc_count = self.db.query(PolicyFile).filter(PolicyFile.policy_id == policy.id).count()
                
                result.append({
                    "id": policy.id,
                    "building_id": policy.building_id,
                    "agent_id": policy.agent_id,
                    "coverage_type": policy.coverage_type,
                    "policy_number": policy.policy_number,
                    "carrier": policy.carrier,
                    "effective_date": policy.effective_date,
                    "expiration_date": policy.expiration_date,
                    "limits": limits,
                    "deductibles": deductibles,
                    "premium_annual": policy.premium_annual,
                    "status": policy.status,
                    "building": {
                        "id": building.id if building else None,
                        "name": building.name if building else "",
                        "address": building.address if building else ""
                    },
                    "agent": {
                        "id": agent.id if agent else None,
                        "name": agent.name if agent else "",
                        "company": agent.company if agent else ""
                    },
                    "document_count": doc_count,
                    "created_at": policy.created_at.isoformat(),
                    "updated_at": policy.updated_at.isoformat()
                })
            
            return result
        except Exception as e:
            logger.error(f"Error getting policies: {e}")
            return []
    
    def add_policy(self, 
                  building_id: str,
                  agent_id: str,
                  coverage_type: str,
                  policy_number: str,
                  carrier: str,
                  effective_date: str,
                  expiration_date: str,
                  limits: Dict[str, float],
                  deductibles: Dict[str, float],
                  premium_annual: float,
                  status: str = "active") -> Dict[str, Any]:
        """Add a new policy"""
        try:
            policy = Policy(
                building_id=building_id,
                agent_id=agent_id,
                coverage_type=coverage_type,
                policy_number=policy_number,
                carrier=carrier,
                effective_date=effective_date,
                expiration_date=expiration_date,
                limits_json=json.dumps(limits),
                deductibles_json=json.dumps(deductibles),
                premium_annual=premium_annual,
                status=status
            )
            self.db.add(policy)
            self.db.commit()
            self.db.refresh(policy)
            
            return {
                "success": True,
                "policy_id": policy.id,
                "message": "Policy added successfully"
            }
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error adding policy: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to add policy"
            }
    
    def get_policy_history(self, policy_id: str) -> List[Dict[str, Any]]:
        """Get policy history including notes and file attachments"""
        try:
            history_items = self.db.query(PolicyHistory).filter(
                PolicyHistory.policy_id == policy_id
            ).order_by(PolicyHistory.created_at.desc()).all()
            
            result = []
            for item in history_items:
                # Get file info if attached
                file_info = None
                if item.file_id:
                    policy_file = self.db.query(PolicyFile).filter(PolicyFile.id == item.file_id).first()
                    if policy_file:
                        file_info = {
                            "id": policy_file.id,
                            "original_filename": policy_file.original_filename,
                            "file_size": policy_file.file_size,
                            "content_type": policy_file.content_type
                        }
                
                result.append({
                    "id": item.id,
                    "policy_id": item.policy_id,
                    "note": item.note,
                    "file_id": item.file_id,
                    "file": file_info,
                    "created_at": item.created_at.isoformat()
                })
            
            return result
        except Exception as e:
            logger.error(f"Error getting policy history: {e}")
            return []
    
    # File Management
    def upload_pdf(self, file_path: str, original_filename: str, building_id: str, policy_id: Optional[str] = None) -> Dict[str, Any]:
        """Upload and parse a PDF file"""
        try:
            result = self.ingestion_service.ingest_file(
                file_path=file_path,
                original_filename=original_filename,
                building_id=building_id,
                policy_id=policy_id
            )
            return result
        except Exception as e:
            logger.error(f"Error uploading PDF: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to upload PDF"
            }
    
    def add_policy_note(self, policy_id: str, note: str, file_path: Optional[str] = None) -> Dict[str, Any]:
        """Add a note to a policy with optional file attachment"""
        try:
            result = self.ingestion_service.add_policy_note(
                policy_id=policy_id,
                note=note,
                file_path=file_path
            )
            return result
        except Exception as e:
            logger.error(f"Error adding policy note: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to add note"
            }
    
    def get_file_path(self, file_id: str) -> Optional[str]:
        """Get file system path for a file ID"""
        return self.ingestion_service.get_file_path(file_id)
    
    # Search
    def search_policies(self, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Search across policies and policy history"""
        try:
            return self.search_service.search_policies(query, limit)
        except Exception as e:
            logger.error(f"Error searching policies: {e}")
            return []
    
    def get_search_suggestions(self, partial_query: str, limit: int = 10) -> List[str]:
        """Get search suggestions"""
        try:
            return self.search_service.get_search_suggestions(partial_query, limit)
        except Exception as e:
            logger.error(f"Error getting search suggestions: {e}")
            return []
    
    # Alerts
    def get_alerts(self, limit: int = 50, unread_only: bool = False) -> List[Dict[str, Any]]:
        """Get alerts"""
        try:
            return self.alert_service.get_alerts(limit, unread_only)
        except Exception as e:
            logger.error(f"Error getting alerts: {e}")
            return []
    
    def send_test_email(self, email: str) -> Dict[str, Any]:
        """Send a test email"""
        try:
            return self.alert_service.email_service.send_test_email(email)
        except Exception as e:
            logger.error(f"Error sending test email: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to send test email"
            }
    
    def check_renewals(self) -> List[Dict[str, Any]]:
        """Check for policies needing renewal"""
        try:
            return self.alert_service.check_policy_renewals()
        except Exception as e:
            logger.error(f"Error checking renewals: {e}")
            return []
    
    # System Management
    def initialize_system(self) -> Dict[str, Any]:
        """Initialize database and seed with sample data"""
        try:
            init_database()
            seed_database()
            
            # Rebuild search index
            search_result = self.search_service.rebuild_search_index()
            
            return {
                "success": True,
                "message": "System initialized successfully",
                "search_index": search_result
            }
        except Exception as e:
            logger.error(f"Error initializing system: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to initialize system"
            }
    
    def get_system_stats(self) -> Dict[str, Any]:
        """Get system statistics"""
        try:
            stats = {
                "agents_count": self.db.query(Agent).count(),
                "buildings_count": self.db.query(Building).count(),
                "policies_count": self.db.query(Policy).count(),
                "files_count": self.db.query(PolicyFile).count(),
                "history_entries_count": self.db.query(PolicyHistory).count(),
                "unread_alerts_count": self.db.query(Alert).filter(Alert.is_read == False).count()
            }
            
            # Policy status breakdown
            from sqlalchemy import func
            status_counts = self.db.query(
                Policy.status, func.count(Policy.id)
            ).group_by(Policy.status).all()
            
            stats["policy_status_breakdown"] = {status: count for status, count in status_counts}
            
            return {
                "success": True,
                "stats": stats
            }
        except Exception as e:
            logger.error(f"Error getting system stats: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def close(self):
        """Close all connections"""
        if hasattr(self, 'db') and self.db:
            self.db.close()
        if hasattr(self, 'search_service'):
            self.search_service.close()
        if hasattr(self, 'alert_service'):
            self.alert_service.close()

# Global adapter instance
_adapter = None

def get_adapter() -> UIBackendAdapter:
    """Get the global adapter instance"""
    global _adapter
    if _adapter is None:
        _adapter = UIBackendAdapter()
    return _adapter

# Convenience functions for direct use
def list_agents() -> List[Dict[str, Any]]:
    return get_adapter().list_agents()

def list_buildings(agent_id: Optional[str] = None) -> List[Dict[str, Any]]:
    return get_adapter().list_buildings(agent_id)

def get_policies(building_id: Optional[str] = None) -> List[Dict[str, Any]]:
    return get_adapter().get_policies(building_id)

def upload_pdf(file_path: str, original_filename: str, building_id: str) -> Dict[str, Any]:
    return get_adapter().upload_pdf(file_path, original_filename, building_id)

def add_policy_note(policy_id: str, note: str, file_path: Optional[str] = None) -> Dict[str, Any]:
    return get_adapter().add_policy_note(policy_id, note, file_path)

def search_policies(query: str) -> List[Dict[str, Any]]:
    return get_adapter().search_policies(query)

def send_test_email(email: str) -> Dict[str, Any]:
    return get_adapter().send_test_email(email)

if __name__ == "__main__":
    # CLI interface for testing
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python ui_backend_adapter.py <command> [args]")
        print("Commands:")
        print("  init                    - Initialize system")
        print("  stats                   - Show system statistics")
        print("  agents                  - List all agents")
        print("  buildings [agent_id]    - List buildings")
        print("  policies [building_id]  - List policies")
        print("  search <query>          - Search policies")
        print("  test_email <email>      - Send test email")
        sys.exit(1)
    
    adapter = UIBackendAdapter()
    command = sys.argv[1]
    
    try:
        if command == "init":
            result = adapter.initialize_system()
            print(f"Initialization result: {result}")
        
        elif command == "stats":
            result = adapter.get_system_stats()
            print(f"System stats: {result}")
        
        elif command == "agents":
            agents = adapter.list_agents()
            print(f"Found {len(agents)} agents:")
            for agent in agents:
                print(f"  - {agent['name']} ({agent['company']})")
        
        elif command == "buildings":
            agent_id = sys.argv[2] if len(sys.argv) > 2 else None
            buildings = adapter.list_buildings(agent_id)
            print(f"Found {len(buildings)} buildings:")
            for building in buildings:
                print(f"  - {building['name']}: {building['address']}")
        
        elif command == "policies":
            building_id = sys.argv[2] if len(sys.argv) > 2 else None
            policies = adapter.get_policies(building_id)
            print(f"Found {len(policies)} policies:")
            for policy in policies:
                print(f"  - {policy['policy_number']}: {policy['carrier']}")
        
        elif command == "search":
            if len(sys.argv) < 3:
                print("Usage: python ui_backend_adapter.py search <query>")
                sys.exit(1)
            query = " ".join(sys.argv[2:])
            results = adapter.search_policies(query)
            print(f"Found {len(results)} results for '{query}':")
            for result in results:
                print(f"  - {result['policy_number']}: {result['building']['name']}")
        
        elif command == "test_email":
            if len(sys.argv) < 3:
                print("Usage: python ui_backend_adapter.py test_email <email>")
                sys.exit(1)
            email = sys.argv[2]
            result = adapter.send_test_email(email)
            print(f"Test email result: {result}")
        
        else:
            print(f"Unknown command: {command}")
    
    finally:
        adapter.close()
