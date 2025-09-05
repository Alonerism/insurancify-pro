"""
Search Engine for Insurance Document Management System

Provides full-text search capabilities across policy documents using SQLite FTS.
Supports ranking, filtering, and semantic search features.
"""

import sqlite3
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
import re

logger = logging.getLogger(__name__)


class SearchEngine:
    """Full-text search engine using SQLite FTS (Full-Text Search)"""
    
    def __init__(self, db_path: str = "insurance.db"):
        self.db_path = db_path
        self._init_search_tables()
    
    def _init_search_tables(self):
        """Initialize FTS tables for search functionality"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Create FTS virtual table for document content
                conn.execute("""
                    CREATE VIRTUAL TABLE IF NOT EXISTS document_search 
                    USING fts5(
                        document_id,
                        title,
                        content,
                        metadata,
                        carrier,
                        policy_number,
                        coverage_type,
                        tokenize='porter'
                    )
                """)
                
                conn.commit()
                logger.info("Search tables initialized successfully")
                
        except Exception as e:
            logger.error(f"Error initializing search tables: {e}")
            raise
    
    def index_document(self, document_id: int, content: str, metadata: Optional[Dict] = None):
        """
        Index a document for full-text search
        
        Args:
            document_id: Unique identifier for the document
            content: Full text content of the document
            metadata: Additional metadata to index
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Extract searchable fields from metadata
                title = metadata.get("file_name", "") if metadata else ""
                carrier = metadata.get("carrier", "") if metadata else ""
                policy_number = metadata.get("policy_number", "") if metadata else ""
                coverage_type = metadata.get("coverage_type", "") if metadata else ""
                metadata_text = str(metadata) if metadata else ""
                
                # Clean content for indexing
                clean_content = self._clean_text_for_indexing(content)
                
                # Insert or replace document in search index
                conn.execute("""
                    INSERT OR REPLACE INTO document_search (
                        document_id, title, content, metadata, 
                        carrier, policy_number, coverage_type
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    document_id, title, clean_content, metadata_text,
                    carrier, policy_number, coverage_type
                ))
                
                conn.commit()
                logger.debug(f"Document {document_id} indexed successfully")
                
        except Exception as e:
            logger.error(f"Error indexing document {document_id}: {e}")
            raise
    
    def search(self, query: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Perform full-text search across indexed documents
        
        Args:
            query: Search query string
            limit: Maximum number of results to return
            offset: Number of results to skip (for pagination)
            
        Returns:
            List of search results with document_id, score, and snippet
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Prepare search query for FTS
                fts_query = self._prepare_fts_query(query)
                
                # Execute search with ranking
                cursor = conn.execute("""
                    SELECT 
                        document_id,
                        title,
                        carrier,
                        policy_number,
                        coverage_type,
                        bm25(document_search) as score,
                        snippet(document_search, 2, '<b>', '</b>', '...', 32) as snippet
                    FROM document_search 
                    WHERE document_search MATCH ?
                    ORDER BY score
                    LIMIT ? OFFSET ?
                """, (fts_query, limit, offset))
                
                results = []
                for row in cursor.fetchall():
                    result = {
                        "document_id": row[0],
                        "title": row[1],
                        "carrier": row[2],
                        "policy_number": row[3],
                        "coverage_type": row[4],
                        "score": row[5],
                        "snippet": row[6]
                    }
                    results.append(result)
                
                logger.debug(f"Search for '{query}' returned {len(results)} results")
                return results
                
        except Exception as e:
            logger.error(f"Error performing search for '{query}': {e}")
            return []
    
    def search_by_field(self, field: str, value: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Search documents by specific field
        
        Args:
            field: Field name (carrier, policy_number, coverage_type)
            value: Value to search for
            limit: Maximum number of results
            
        Returns:
            List of matching documents
        """
        try:
            if field not in ["carrier", "policy_number", "coverage_type", "title"]:
                raise ValueError(f"Invalid search field: {field}")
            
            with sqlite3.connect(self.db_path) as conn:
                # Use column-specific search
                cursor = conn.execute(f"""
                    SELECT 
                        document_id,
                        title,
                        carrier,
                        policy_number,
                        coverage_type,
                        1.0 as score
                    FROM document_search 
                    WHERE {field} MATCH ?
                    LIMIT ?
                """, (value, limit))
                
                results = []
                for row in cursor.fetchall():
                    result = {
                        "document_id": row[0],
                        "title": row[1],
                        "carrier": row[2],
                        "policy_number": row[3],
                        "coverage_type": row[4],
                        "score": row[5]
                    }
                    results.append(result)
                
                return results
                
        except Exception as e:
            logger.error(f"Error searching by field {field}: {e}")
            return []
    
    def remove_document(self, document_id: int):
        """Remove a document from the search index"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    "DELETE FROM document_search WHERE document_id = ?",
                    (document_id,)
                )
                conn.commit()
                logger.debug(f"Document {document_id} removed from search index")
                
        except Exception as e:
            logger.error(f"Error removing document {document_id} from search index: {e}")
            raise
    
    def get_search_stats(self) -> Dict[str, Any]:
        """Get statistics about the search index"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("SELECT COUNT(*) FROM document_search")
                total_documents = cursor.fetchone()[0]
                
                # Get index size (approximate)
                cursor = conn.execute("""
                    SELECT page_count * page_size as size 
                    FROM pragma_page_count('document_search'), 
                         pragma_page_size
                """)
                index_size = cursor.fetchone()[0] if cursor.fetchone() else 0
                
                return {
                    "total_documents": total_documents,
                    "index_size_bytes": index_size,
                    "index_size_mb": round(index_size / (1024 * 1024), 2)
                }
                
        except Exception as e:
            logger.error(f"Error getting search stats: {e}")
            return {"total_documents": 0, "index_size_bytes": 0, "index_size_mb": 0}
    
    def _clean_text_for_indexing(self, text: str) -> str:
        """Clean and prepare text for FTS indexing"""
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters that might interfere with FTS
        text = re.sub(r'[^\w\s\-.,]', ' ', text)
        
        # Limit length to prevent extremely large index entries
        if len(text) > 50000:  # 50KB limit per document
            text = text[:50000] + "..."
        
        return text.strip()
    
    def _prepare_fts_query(self, query: str) -> str:
        """Prepare user query for FTS syntax"""
        if not query:
            return ""
        
        # Clean query
        query = query.strip()
        
        # Handle phrase queries (quoted strings)
        if '"' in query:
            return query
        
        # Split into terms and add wildcards for partial matching
        terms = query.split()
        fts_terms = []
        
        for term in terms:
            # Clean term
            term = re.sub(r'[^\w\-]', '', term)
            if term:
                # Add wildcard for partial matching
                fts_terms.append(f"{term}*")
        
        # Join with OR for broader matching
        return " OR ".join(fts_terms) if fts_terms else query
    
    def reindex_all_documents(self, db_session):
        """
        Reindex all documents from the database
        
        This is useful for rebuilding the search index after schema changes
        """
        try:
            from .models import PolicyFile
            
            # Clear existing index
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("DELETE FROM document_search")
                conn.commit()
            
            # Reindex all active documents
            policies = db_session.query(PolicyFile).filter(
                PolicyFile.is_deleted == False
            ).all()
            
            indexed_count = 0
            for policy in policies:
                metadata = {
                    "file_name": policy.file_name,
                    "carrier": policy.carrier or "",
                    "policy_number": policy.policy_number or "",
                    "coverage_type": policy.coverage_type or ""
                }
                
                self.index_document(
                    document_id=policy.id,
                    content=policy.raw_text or "",
                    metadata=metadata
                )
                indexed_count += 1
            
            logger.info(f"Reindexed {indexed_count} documents successfully")
            return indexed_count
            
        except Exception as e:
            logger.error(f"Error reindexing documents: {e}")
            raise
