"""
File ingestion and storage management
"""
import os
import shutil
import uuid
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path
import json

from models import PolicyFile, Policy, Building
from pdf_parser import PDFParser
from database import SessionLocal

logger = logging.getLogger(__name__)

class FileIngestionService:
    """Handles file upload, parsing, and storage"""
    
    def __init__(self, upload_directory: str = "./data/policies/"):
        self.upload_directory = Path(upload_directory)
        self.upload_directory.mkdir(parents=True, exist_ok=True)
        self.pdf_parser = PDFParser()
        self.max_file_size = 50 * 1024 * 1024  # 50MB
    
    def ingest_file(self, 
                   file_path: str, 
                   original_filename: str,
                   building_id: Optional[str] = None,
                   policy_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Ingest a file into the system
        
        Args:
            file_path: Path to the uploaded file
            original_filename: Original name of the file
            building_id: Optional building ID to link to
            policy_id: Optional policy ID to link to
            
        Returns:
            Dictionary with ingestion results
        """
        try:
            # Validate file
            if not os.path.exists(file_path):
                raise ValueError(f"File not found: {file_path}")
            
            file_size = os.path.getsize(file_path)
            if file_size > self.max_file_size:
                raise ValueError(f"File too large: {file_size} bytes")
            
            # Generate unique filename
            file_extension = Path(original_filename).suffix.lower()
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            storage_path = self.upload_directory / unique_filename
            
            # Copy file to storage
            shutil.copy2(file_path, storage_path)
            
            # Parse if PDF
            parsed_data = {"text": "", "metadata": {}, "confidence": 0.0}
            if file_extension == ".pdf":
                parsed_data = self.pdf_parser.parse_pdf(str(storage_path))
            
            # Save to database
            db = SessionLocal()
            try:
                policy_file = PolicyFile(
                    policy_id=policy_id,
                    filename=unique_filename,
                    original_filename=original_filename,
                    file_path=str(storage_path),
                    file_size=file_size,
                    content_type=self._get_content_type(file_extension),
                    parsed_text=parsed_data["text"],
                    parsed_metadata_json=json.dumps(parsed_data["metadata"]),
                    confidence_score=parsed_data["confidence"]
                )
                
                db.add(policy_file)
                db.commit()
                db.refresh(policy_file)
                
                # Try to auto-link to policy/building if not provided
                if not policy_id and building_id:
                    suggested_policy = self._suggest_policy_link(
                        db, parsed_data["metadata"], building_id
                    )
                    if suggested_policy:
                        policy_file.policy_id = suggested_policy.id
                        db.commit()
                
                # Update search index
                self._update_search_index(db, policy_file)
                
                return {
                    "success": True,
                    "file_id": policy_file.id,
                    "parsed_metadata": parsed_data["metadata"],
                    "confidence": parsed_data["confidence"],
                    "suggested_policy_id": policy_file.policy_id,
                    "message": "File ingested successfully"
                }
                
            except Exception as e:
                db.rollback()
                # Clean up file on database error
                if storage_path.exists():
                    storage_path.unlink()
                raise e
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error ingesting file {original_filename}: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to ingest file"
            }
    
    def _get_content_type(self, file_extension: str) -> str:
        """Get content type from file extension"""
        content_types = {
            ".pdf": "application/pdf",
            ".doc": "application/msword",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".txt": "text/plain",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
        }
        return content_types.get(file_extension, "application/octet-stream")
    
    def _suggest_policy_link(self, db, metadata: Dict[str, Any], building_id: str) -> Optional[Policy]:
        """Suggest a policy to link the file to based on parsed metadata"""
        try:
            # Get policies for the building
            policies = db.query(Policy).filter(Policy.building_id == building_id).all()
            
            if not policies:
                return None
            
            # Try to match by policy number
            if "policy_number" in metadata:
                policy_num = metadata["policy_number"]
                for policy in policies:
                    if policy.policy_number.lower() == policy_num.lower():
                        return policy
            
            # Try to match by carrier
            if "carrier" in metadata:
                carrier = metadata["carrier"].lower()
                for policy in policies:
                    if carrier in policy.carrier.lower():
                        return policy
            
            # Try to match by coverage type
            if "coverage_type" in metadata:
                coverage = metadata["coverage_type"]
                for policy in policies:
                    if coverage == policy.coverage_type:
                        return policy
            
            # Default to first active policy
            active_policies = [p for p in policies if p.status == "active"]
            return active_policies[0] if active_policies else policies[0]
            
        except Exception as e:
            logger.error(f"Error suggesting policy link: {e}")
            return None
    
    def _update_search_index(self, db, policy_file: PolicyFile):
        """Update the FTS5 search index with the new file"""
        try:
            if not policy_file.policy_id or not policy_file.parsed_text:
                return
            
            # Get related data for search index
            policy = db.query(Policy).filter(Policy.id == policy_file.policy_id).first()
            if not policy:
                return
            
            building = db.query(Building).filter(Building.id == policy.building_id).first()
            building_name = building.name if building else ""
            
            from sqlalchemy import text
            
            # Insert into FTS5 table
            search_sql = text("""
                INSERT INTO policy_search (
                    policy_id, policy_number, carrier, building_name, 
                    agent_name, parsed_text, notes
                ) VALUES (
                    :policy_id, :policy_number, :carrier, :building_name,
                    :agent_name, :parsed_text, :notes
                )
            """)
            
            db.execute(search_sql, {
                "policy_id": policy.id,
                "policy_number": policy.policy_number,
                "carrier": policy.carrier,
                "building_name": building_name,
                "agent_name": "",  # Will be populated by search service
                "parsed_text": policy_file.parsed_text[:10000],  # Limit text size
                "notes": ""
            })
            
        except Exception as e:
            logger.error(f"Error updating search index: {e}")
    
    def add_policy_note(self, 
                       policy_id: str, 
                       note: str, 
                       file_path: Optional[str] = None) -> Dict[str, Any]:
        """Add a note to a policy with optional file attachment"""
        try:
            db = SessionLocal()
            
            # Verify policy exists
            policy = db.query(Policy).filter(Policy.id == policy_id).first()
            if not policy:
                return {
                    "success": False,
                    "error": "Policy not found",
                    "message": "Cannot add note to non-existent policy"
                }
            
            file_id = None
            if file_path:
                # Ingest the attached file
                original_filename = os.path.basename(file_path)
                ingestion_result = self.ingest_file(
                    file_path, original_filename, policy_id=policy_id
                )
                if ingestion_result["success"]:
                    file_id = ingestion_result["file_id"]
                else:
                    return {
                        "success": False,
                        "error": "Failed to attach file",
                        "message": ingestion_result["message"]
                    }
            
            # Create history entry
            from models import PolicyHistory
            history_entry = PolicyHistory(
                policy_id=policy_id,
                note=note,
                file_id=file_id
            )
            
            db.add(history_entry)
            db.commit()
            
            return {
                "success": True,
                "history_id": history_entry.id,
                "file_id": file_id,
                "message": "Note added successfully"
            }
            
        except Exception as e:
            logger.error(f"Error adding policy note: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to add note"
            }
        finally:
            db.close()
    
    def get_file_path(self, file_id: str) -> Optional[str]:
        """Get the file system path for a file ID"""
        try:
            db = SessionLocal()
            policy_file = db.query(PolicyFile).filter(PolicyFile.id == file_id).first()
            return policy_file.file_path if policy_file else None
        except Exception as e:
            logger.error(f"Error getting file path: {e}")
            return None
        finally:
            db.close()
    
    def cleanup_orphaned_files(self):
        """Clean up files that are not referenced in the database"""
        try:
            db = SessionLocal()
            
            # Get all files in storage
            storage_files = set()
            for file_path in self.upload_directory.glob("*"):
                if file_path.is_file():
                    storage_files.add(file_path.name)
            
            # Get all files in database
            db_files = set()
            policy_files = db.query(PolicyFile).all()
            for pf in policy_files:
                db_files.add(Path(pf.file_path).name)
            
            # Remove orphaned files
            orphaned_files = storage_files - db_files
            removed_count = 0
            
            for orphaned_file in orphaned_files:
                file_path = self.upload_directory / orphaned_file
                try:
                    file_path.unlink()
                    removed_count += 1
                    logger.info(f"Removed orphaned file: {orphaned_file}")
                except Exception as e:
                    logger.error(f"Error removing orphaned file {orphaned_file}: {e}")
            
            logger.info(f"Cleanup completed. Removed {removed_count} orphaned files.")
            return removed_count
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
            return 0
        finally:
            db.close()

# CLI tool for testing ingestion
def ingest_cli():
    """CLI tool for testing file ingestion"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python ingestion.py <file_path> [building_id]")
        sys.exit(1)
    
    file_path = sys.argv[1]
    building_id = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        sys.exit(1)
    
    service = FileIngestionService()
    result = service.ingest_file(file_path, os.path.basename(file_path), building_id)
    
    print(f"=== INGESTION RESULTS ===")
    print(f"Success: {result['success']}")
    if result['success']:
        print(f"File ID: {result['file_id']}")
        print(f"Confidence: {result['confidence']:.2f}")
        print(f"Suggested Policy ID: {result.get('suggested_policy_id', 'None')}")
        print(f"Metadata: {result['parsed_metadata']}")
    else:
        print(f"Error: {result['error']}")

if __name__ == "__main__":
    ingest_cli()
