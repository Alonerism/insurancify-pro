"""
Search functionality using SQLite FTS5
"""
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from database import SessionLocal
from models import Policy, Building, Agent, PolicyHistory, PolicyFile

logger = logging.getLogger(__name__)

class SearchService:
    """Full-text search service using SQLite FTS5"""
    
    def __init__(self):
        self.db = SessionLocal()
    
    def search_policies(self, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Search across policies and policy history using FTS5
        
        Args:
            query: Search query string
            limit: Maximum results to return
            
        Returns:
            List of search results with policy and building information
        """
        try:
            if not query.strip():
                return []
            
            # Prepare FTS5 query - escape special characters
            fts_query = self._prepare_fts_query(query)
            
            # Search using FTS5
            search_sql = text("""
                SELECT 
                    policy_search.policy_id,
                    policy_search.policy_number,
                    policy_search.carrier,
                    policy_search.building_name,
                    bm25(policy_search) as rank
                FROM policy_search 
                WHERE policy_search MATCH :query
                ORDER BY rank
                LIMIT :limit
            """)
            
            search_results = self.db.execute(search_sql, {
                "query": fts_query,
                "limit": limit
            }).fetchall()
            
            if not search_results:
                return []
            
            # Get detailed information for found policies
            policy_ids = [row.policy_id for row in search_results]
            policies = self.db.query(Policy).filter(Policy.id.in_(policy_ids)).all()
            
            # Create result objects
            results = []
            for policy in policies:
                building = self.db.query(Building).filter(Building.id == policy.building_id).first()
                agent = self.db.query(Agent).filter(Agent.id == policy.agent_id).first()
                
                # Find the rank for this policy
                rank = next((row.rank for row in search_results if row.policy_id == policy.id), 0)
                
                result = {
                    "policy_id": policy.id,
                    "policy_number": policy.policy_number,
                    "coverage_type": policy.coverage_type,
                    "carrier": policy.carrier,
                    "status": policy.status,
                    "effective_date": policy.effective_date,
                    "expiration_date": policy.expiration_date,
                    "premium_annual": policy.premium_annual,
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
                    "rank": rank,
                    "type": "policy"
                }
                results.append(result)
            
            # Also search policy history for notes
            history_results = self._search_policy_history(query, limit)
            results.extend(history_results)
            
            # Sort by rank and remove duplicates
            seen_policies = set()
            unique_results = []
            for result in sorted(results, key=lambda x: x["rank"], reverse=True):
                if result["policy_id"] not in seen_policies:
                    unique_results.append(result)
                    seen_policies.add(result["policy_id"])
            
            return unique_results[:limit]
            
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []
    
    def _search_policy_history(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """Search policy history notes"""
        try:
            # Simple text search in notes (since FTS5 table might not include all history)
            history_items = self.db.query(PolicyHistory).filter(
                PolicyHistory.note.contains(query)
            ).limit(limit).all()
            
            results = []
            for history in history_items:
                policy = self.db.query(Policy).filter(Policy.id == history.policy_id).first()
                if not policy:
                    continue
                
                building = self.db.query(Building).filter(Building.id == policy.building_id).first()
                agent = self.db.query(Agent).filter(Agent.id == policy.agent_id).first()
                
                result = {
                    "policy_id": policy.id,
                    "policy_number": policy.policy_number,
                    "coverage_type": policy.coverage_type,
                    "carrier": policy.carrier,
                    "status": policy.status,
                    "effective_date": policy.effective_date,
                    "expiration_date": policy.expiration_date,
                    "premium_annual": policy.premium_annual,
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
                    "rank": 0.5,  # Lower rank for history matches
                    "type": "history",
                    "note_preview": history.note[:200] + "..." if len(history.note) > 200 else history.note,
                    "note_date": history.created_at.isoformat()
                }
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"History search error: {e}")
            return []
    
    def _prepare_fts_query(self, query: str) -> str:
        """Prepare query for FTS5 - handle special characters and operators"""
        # Remove special FTS5 characters that could cause syntax errors
        special_chars = ['(', ')', '"', '*', '^', ':', '~']
        clean_query = query
        for char in special_chars:
            clean_query = clean_query.replace(char, ' ')
        
        # Split into terms and create OR query for better matching
        terms = [term.strip() for term in clean_query.split() if term.strip()]
        if not terms:
            return '""'  # Empty query
        
        # Create FTS5 query with OR between terms
        fts_terms = []
        for term in terms:
            if len(term) > 2:  # Skip very short terms
                fts_terms.append(f'"{term}"')
        
        if not fts_terms:
            return '""'
        
        return ' OR '.join(fts_terms)
    
    def rebuild_search_index(self) -> Dict[str, Any]:
        """Rebuild the entire FTS5 search index"""
        try:
            # Clear existing index
            self.db.execute(text("DELETE FROM policy_search"))
            
            # Get all policies
            policies = self.db.query(Policy).all()
            rebuild_count = 0
            
            for policy in policies:
                try:
                    # Get related data
                    building = self.db.query(Building).filter(Building.id == policy.building_id).first()
                    agent = self.db.query(Agent).filter(Agent.id == policy.agent_id).first()
                    
                    # Get all text from policy files
                    policy_files = self.db.query(PolicyFile).filter(PolicyFile.policy_id == policy.id).all()
                    all_text_parts = []
                    for pf in policy_files:
                        if pf.parsed_text:
                            all_text_parts.append(pf.parsed_text)
                    
                    # Get all notes from policy history
                    history_items = self.db.query(PolicyHistory).filter(PolicyHistory.policy_id == policy.id).all()
                    notes_parts = []
                    for history in history_items:
                        if history.note:
                            notes_parts.append(history.note)
                    
                    # Combine all text
                    parsed_text = " ".join(all_text_parts)[:10000]  # Limit size
                    notes_text = " ".join(notes_parts)[:5000]  # Limit size
                    
                    # Insert into FTS5 table
                    insert_sql = text("""
                        INSERT INTO policy_search (
                            policy_id, policy_number, carrier, building_name,
                            agent_name, parsed_text, notes
                        ) VALUES (
                            :policy_id, :policy_number, :carrier, :building_name,
                            :agent_name, :parsed_text, :notes
                        )
                    """)
                    
                    self.db.execute(insert_sql, {
                        "policy_id": policy.id,
                        "policy_number": policy.policy_number,
                        "carrier": policy.carrier,
                        "building_name": building.name if building else "",
                        "agent_name": agent.name if agent else "",
                        "parsed_text": parsed_text,
                        "notes": notes_text
                    })
                    
                    rebuild_count += 1
                    
                except Exception as e:
                    logger.error(f"Error indexing policy {policy.id}: {e}")
                    continue
            
            self.db.commit()
            
            return {
                "success": True,
                "indexed_policies": rebuild_count,
                "message": f"Search index rebuilt with {rebuild_count} policies"
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error rebuilding search index: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to rebuild search index"
            }
    
    def get_search_suggestions(self, partial_query: str, limit: int = 10) -> List[str]:
        """Get search suggestions based on partial query"""
        try:
            if len(partial_query) < 2:
                return []
            
            # Get suggestions from various fields
            suggestions = set()
            
            # Policy numbers
            policies = self.db.query(Policy.policy_number).filter(
                Policy.policy_number.contains(partial_query)
            ).limit(limit).all()
            suggestions.update([p.policy_number for p in policies])
            
            # Carriers
            carriers = self.db.query(Policy.carrier).filter(
                Policy.carrier.contains(partial_query)
            ).distinct().limit(limit).all()
            suggestions.update([c.carrier for c in carriers])
            
            # Building names
            buildings = self.db.query(Building.name).filter(
                Building.name.contains(partial_query)
            ).limit(limit).all()
            suggestions.update([b.name for b in buildings])
            
            # Agent names
            agents = self.db.query(Agent.name).filter(
                Agent.name.contains(partial_query)
            ).limit(limit).all()
            suggestions.update([a.name for a in agents])
            
            return sorted(list(suggestions))[:limit]
            
        except Exception as e:
            logger.error(f"Error getting search suggestions: {e}")
            return []
    
    def close(self):
        """Close database connection"""
        if self.db:
            self.db.close()

# CLI tool for testing search
def search_cli():
    """CLI tool for testing search functionality"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python search.py <search_query>")
        print("       python search.py --rebuild (to rebuild index)")
        sys.exit(1)
    
    search_service = SearchService()
    
    try:
        if sys.argv[1] == "--rebuild":
            print("Rebuilding search index...")
            result = search_service.rebuild_search_index()
            print(f"Result: {result}")
        else:
            query = " ".join(sys.argv[1:])
            print(f"Searching for: '{query}'")
            
            results = search_service.search_policies(query)
            print(f"\nFound {len(results)} results:")
            
            for i, result in enumerate(results, 1):
                print(f"\n{i}. {result['policy_number']} - {result['carrier']}")
                print(f"   Building: {result['building']['name']}")
                print(f"   Agent: {result['agent']['name']}")
                print(f"   Status: {result['status']}")
                print(f"   Rank: {result['rank']:.4f}")
                if result['type'] == 'history' and 'note_preview' in result:
                    print(f"   Note: {result['note_preview']}")
    
    finally:
        search_service.close()

if __name__ == "__main__":
    search_cli()
