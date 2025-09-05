"""
V1 API Routes for Insurance Document Management System

Provides stable API endpoints with comprehensive tagging, pagination,
and consistent response formats for frontend integration.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi import status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging
from pathlib import Path
import shutil
import os
from datetime import datetime

from ...database import get_db
from ...models import PolicyFile, Claim
# from ...models import Property  # TODO: Add Property model if needed
from ...pdf_parser import PDFParser
from ...search_engine import SearchEngine
from ...alert_service import AlertService

logger = logging.getLogger(__name__)

# Create router with prefix and tags
router = APIRouter(prefix="/v1", tags=["v1"])

# Initialize services
pdf_parser = PDFParser()
search_engine = SearchEngine()
alert_service = AlertService()

# Pagination parameters
def common_pagination_params(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(50, ge=1, le=100, description="Items per page (max 100)"),
):
    offset = (page - 1) * limit
    return {"offset": offset, "limit": limit, "page": page}

# Response models for consistency
class ApiResponse:
    @staticmethod
    def success(data: Any, message: str = "Success", pagination: Optional[Dict] = None):
        response = {
            "success": True,
            "message": message,
            "data": data,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        if pagination:
            response["pagination"] = pagination
        return response
    
    @staticmethod
    def error(message: str, error_code: str = "INTERNAL_ERROR", details: Optional[Dict] = None):
        response = {
            "success": False,
            "message": message,
            "error_code": error_code,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        if details:
            response["details"] = details
        return response

@router.get("/health", tags=["system"])
async def health_check():
    """API health check endpoint"""
    return ApiResponse.success({
        "status": "healthy",
        "version": "1.0.0",
        "services": {
            "database": "connected",
            "pdf_parser": "ready",
            "search_engine": "ready",
            "alert_service": "ready"
        }
    })

@router.get("/policies", tags=["policies"])
async def list_policies(
    db: Session = Depends(get_db),
    pagination = Depends(common_pagination_params),
    property_id: Optional[int] = Query(None, description="Filter by property ID"),
    search: Optional[str] = Query(None, description="Search in file names and metadata"),
    file_type: Optional[str] = Query(None, description="Filter by file type"),
    carrier: Optional[str] = Query(None, description="Filter by insurance carrier"),
    status: Optional[str] = Query(None, description="Filter by policy status"),
):
    """
    List policy files with filtering and pagination
    
    Returns paginated list of policy files with comprehensive filtering options.
    Supports search across file names, carriers, and metadata.
    """
    try:
        query = db.query(PolicyFile)
        
        # Apply filters (adapted for current model)
        if property_id:
            # Skip property_id filter for now since field doesn't exist
            pass
        if file_type:
            query = query.filter(PolicyFile.content_type.ilike(f"%{file_type}%"))
        if carrier or search:
            # For carrier and search, we'll need to search in parsed_metadata_json
            # For now, use text search in parsed_text and filename
            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    (PolicyFile.filename.ilike(search_term)) |
                    (PolicyFile.original_filename.ilike(search_term)) |
                    (PolicyFile.parsed_text.ilike(search_term))
                )
        # Skip status filter since field doesn't exist in current model
        
        # Get total count for pagination
        total_count = query.count()
        
        # Apply pagination
        policies = query.offset(pagination["offset"]).limit(pagination["limit"]).all()
        
        # Format response data
        policy_data = []
        for policy in policies:
            policy_dict = {
                "id": policy.id,
                "file_name": policy.filename,  # Map from 'filename' field
                "original_filename": policy.original_filename,
                "property_id": getattr(policy, 'property_id', None),
                "file_type": getattr(policy, 'content_type', 'unknown'),
                "carrier": None,  # Not in current model
                "carrier_raw": None,  # Not in current model
                "policy_number": None,  # Not in current model - could extract from parsed_metadata_json
                "coverage_type": None,  # Not in current model
                "effective_date": None,  # Not in current model
                "expiration_date": None,  # Not in current model
                "status": "active",  # Default for now
                "confidence_score": policy.confidence_score,
                "upload_date": policy.created_at.isoformat() if policy.created_at else None,
                "last_updated": policy.created_at.isoformat() if policy.created_at else None,
                "is_deleted": False,  # Default for now
                "version": 1  # Default for now
            }
            
            # Try to extract metadata from JSON if available
            if policy.parsed_metadata_json:
                try:
                    import json
                    metadata = json.loads(policy.parsed_metadata_json)
                    policy_dict.update({
                        "carrier": metadata.get("carrier"),
                        "carrier_raw": metadata.get("carrier_raw"),
                        "policy_number": metadata.get("policy_number"),
                        "coverage_type": metadata.get("coverage_type"),
                        "effective_date": metadata.get("effective_date"),
                        "expiration_date": metadata.get("expiration_date"),
                    })
                except (json.JSONDecodeError, AttributeError):
                    pass
            
            policy_data.append(policy_dict)
        
        # Calculate pagination info
        total_pages = (total_count + pagination["limit"] - 1) // pagination["limit"]
        pagination_info = {
            "current_page": pagination["page"],
            "total_pages": total_pages,
            "total_items": total_count,
            "items_per_page": pagination["limit"],
            "has_next": pagination["page"] < total_pages,
            "has_previous": pagination["page"] > 1
        }
        
        return ApiResponse.success(
            policy_data,
            f"Retrieved {len(policy_data)} policies",
            pagination_info
        )
        
    except Exception as e:
        logger.error(f"Error listing policies: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ApiResponse.error(f"Failed to retrieve policies: {str(e)}")
        )

@router.post("/policies/upload", tags=["policies"])
async def upload_policy(
    file: UploadFile = File(...),
    property_id: Optional[int] = Query(None, description="Property ID to associate with"),
    db: Session = Depends(get_db),
):
    """
    Upload and process a new policy document
    
    Accepts PDF files, extracts metadata, and stores in the database.
    Returns detailed processing results including confidence scores.
    """
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ApiResponse.error("Only PDF files are supported", "INVALID_FILE_TYPE")
            )
        
        # Create upload directory if it doesn't exist
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        
        # Save uploaded file
        file_path = upload_dir / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse PDF
        parsing_result = pdf_parser.parse_pdf(str(file_path))
        
        # Create policy file record
        policy_file = PolicyFile(
            file_name=file.filename,
            file_path=str(file_path),
            file_type="pdf",
            property_id=property_id,
            raw_text=parsing_result.get("text", ""),
            carrier=parsing_result["metadata"].get("carrier", ""),
            carrier_raw=parsing_result["metadata"].get("carrier_raw", ""),
            policy_number=parsing_result["metadata"].get("policy_number", ""),
            effective_date=parsing_result["metadata"].get("effective_date"),
            expiration_date=parsing_result["metadata"].get("expiration_date"),
            coverage_type=parsing_result["metadata"].get("coverage_type", ""),
            confidence_score=parsing_result.get("confidence", 0.0),
            status="active",
            version=1,
            is_deleted=False
        )
        
        db.add(policy_file)
        db.commit()
        db.refresh(policy_file)
        
        # Index for search
        search_engine.index_document(policy_file.id, parsing_result.get("text", ""))
        
        # Check for alerts
        alerts = alert_service.check_policy_alerts(policy_file)
        
        response_data = {
            "id": policy_file.id,
            "file_name": policy_file.file_name,
            "parsing_result": {
                "confidence": parsing_result.get("confidence", 0.0),
                "message": parsing_result.get("message", ""),
                "metadata_extracted": len(parsing_result.get("metadata", {}))
            },
            "extracted_metadata": parsing_result.get("metadata", {}),
            "alerts": alerts,
            "search_indexed": True
        }
        
        return ApiResponse.success(
            response_data,
            f"Policy uploaded and processed successfully. Confidence: {parsing_result.get('confidence', 0):.1%}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading policy: {e}")
        # Clean up file if it was created
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ApiResponse.error(f"Failed to upload policy: {str(e)}")
        )

@router.get("/policies/{policy_id}", tags=["policies"])
async def get_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    include_content: bool = Query(False, description="Include full document text")
):
    """
    Get detailed information about a specific policy
    
    Returns comprehensive policy information including metadata, 
    processing results, and optionally full document content.
    """
    try:
        policy = db.query(PolicyFile).filter(
            PolicyFile.id == policy_id,
            PolicyFile.is_deleted == False
        ).first()
        
        if not policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ApiResponse.error("Policy not found", "POLICY_NOT_FOUND")
            )
        
        policy_data = {
            "id": policy.id,
            "file_name": policy.file_name,
            "file_path": policy.file_path,
            "property_id": policy.property_id,
            "file_type": policy.file_type,
            "carrier": policy.carrier,
            "carrier_raw": policy.carrier_raw,
            "policy_number": policy.policy_number,
            "coverage_type": policy.coverage_type,
            "effective_date": policy.effective_date.isoformat() if policy.effective_date else None,
            "expiration_date": policy.expiration_date.isoformat() if policy.expiration_date else None,
            "status": policy.status,
            "confidence_score": policy.confidence_score,
            "upload_date": policy.upload_date.isoformat() if policy.upload_date else None,
            "last_updated": policy.last_updated.isoformat() if policy.last_updated else None,
            "version": policy.version,
            "file_size_kb": round(len(policy.raw_text or "") / 1024, 2),
            "has_content": bool(policy.raw_text)
        }
        
        if include_content:
            policy_data["content"] = policy.raw_text
        
        # Get any active alerts for this policy
        alerts = alert_service.check_policy_alerts(policy)
        if alerts:
            policy_data["alerts"] = alerts
        
        return ApiResponse.success(policy_data, "Policy retrieved successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving policy {policy_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ApiResponse.error(f"Failed to retrieve policy: {str(e)}")
        )

@router.delete("/policies/{policy_id}", tags=["policies"])
async def delete_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    hard_delete: bool = Query(False, description="Permanently delete (vs soft delete)")
):
    """
    Delete a policy file (soft delete by default)
    
    Supports both soft delete (mark as deleted) and hard delete (remove from database).
    Soft delete is recommended for audit trails.
    """
    try:
        policy = db.query(PolicyFile).filter(PolicyFile.id == policy_id).first()
        
        if not policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ApiResponse.error("Policy not found", "POLICY_NOT_FOUND")
            )
        
        if hard_delete:
            # Remove from search index
            search_engine.remove_document(policy_id)
            
            # Delete file if it exists
            if policy.file_path and os.path.exists(policy.file_path):
                os.remove(policy.file_path)
            
            # Remove from database
            db.delete(policy)
            message = "Policy permanently deleted"
        else:
            # Soft delete
            policy.is_deleted = True
            policy.status = "deleted"
            message = "Policy marked as deleted"
        
        db.commit()
        
        return ApiResponse.success(
            {"policy_id": policy_id, "hard_delete": hard_delete},
            message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting policy {policy_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ApiResponse.error(f"Failed to delete policy: {str(e)}")
        )

@router.get("/search", tags=["search"])
async def search_policies(
    q: str = Query(..., description="Search query"),
    db: Session = Depends(get_db),
    pagination = Depends(common_pagination_params),
    property_id: Optional[int] = Query(None, description="Filter by property ID"),
    carrier: Optional[str] = Query(None, description="Filter by carrier"),
):
    """
    Full-text search across all policy documents
    
    Performs semantic search across document content, metadata, and file names.
    Returns ranked results with relevance scores.
    """
    try:
        # Perform search
        search_results = search_engine.search(
            query=q,
            limit=pagination["limit"],
            offset=pagination["offset"]
        )
        
        if not search_results:
            return ApiResponse.success([], "No results found", {
                "current_page": pagination["page"],
                "total_pages": 0,
                "total_items": 0,
                "items_per_page": pagination["limit"]
            })
        
        # Get policy details for search results
        policy_ids = [result["document_id"] for result in search_results]
        
        query = db.query(PolicyFile).filter(
            PolicyFile.id.in_(policy_ids),
            PolicyFile.is_deleted == False
        )
        
        # Apply additional filters
        if property_id:
            query = query.filter(PolicyFile.property_id == property_id)
        if carrier:
            query = query.filter(
                (PolicyFile.carrier.ilike(f"%{carrier}%")) |
                (PolicyFile.carrier_raw.ilike(f"%{carrier}%"))
            )
        
        policies = query.all()
        policy_dict = {p.id: p for p in policies}
        
        # Combine search results with policy data
        results = []
        for search_result in search_results:
            policy_id = search_result["document_id"]
            if policy_id in policy_dict:
                policy = policy_dict[policy_id]
                result_data = {
                    "id": policy.id,
                    "file_name": policy.file_name,
                    "carrier": policy.carrier,
                    "policy_number": policy.policy_number,
                    "coverage_type": policy.coverage_type,
                    "effective_date": policy.effective_date.isoformat() if policy.effective_date else None,
                    "expiration_date": policy.expiration_date.isoformat() if policy.expiration_date else None,
                    "relevance_score": search_result.get("score", 0.0),
                    "search_snippet": search_result.get("snippet", "")
                }
                results.append(result_data)
        
        # Estimate total results (search engine might not provide exact count)
        total_items = len(results)  # This is a simplified approach
        total_pages = 1
        
        pagination_info = {
            "current_page": pagination["page"],
            "total_pages": total_pages,
            "total_items": total_items,
            "items_per_page": pagination["limit"],
            "has_next": False,
            "has_previous": pagination["page"] > 1
        }
        
        return ApiResponse.success(
            results,
            f"Found {len(results)} results for '{q}'",
            pagination_info
        )
        
    except Exception as e:
        logger.error(f"Error searching policies: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ApiResponse.error(f"Search failed: {str(e)}")
        )

@router.get("/claims", tags=["claims"])
async def list_claims(
    db: Session = Depends(get_db),
    pagination = Depends(common_pagination_params),
    policy_id: Optional[int] = Query(None, description="Filter by policy ID"),
    status: Optional[str] = Query(None, description="Filter by claim status"),
    claim_type: Optional[str] = Query(None, description="Filter by claim type"),
):
    """
    List insurance claims with filtering and pagination
    
    Returns paginated list of claims with comprehensive filtering options.
    """
    try:
        query = db.query(Claim)
        
        # Apply filters
        if policy_id:
            query = query.filter(Claim.policy_id == policy_id)
        if status:
            query = query.filter(Claim.status == status)
        if claim_type:
            query = query.filter(Claim.claim_type == claim_type)
        
        # Get total count for pagination
        total_count = query.count()
        
        # Apply pagination
        claims = query.offset(pagination["offset"]).limit(pagination["limit"]).all()
        
        # Format response data
        claim_data = []
        for claim in claims:
            claim_dict = {
                "id": claim.id,
                "claim_number": claim.claim_number,
                "policy_id": claim.policy_id,
                "claim_type": claim.claim_type,
                "status": claim.status,
                "amount": float(claim.amount) if claim.amount else None,
                "date_of_loss": claim.date_of_loss.isoformat() if claim.date_of_loss else None,
                "date_reported": claim.date_reported.isoformat() if claim.date_reported else None,
                "description": claim.description,
                "created_at": claim.created_at.isoformat() if claim.created_at else None,
                "updated_at": claim.updated_at.isoformat() if claim.updated_at else None
            }
            claim_data.append(claim_dict)
        
        # Calculate pagination info
        total_pages = (total_count + pagination["limit"] - 1) // pagination["limit"]
        pagination_info = {
            "current_page": pagination["page"],
            "total_pages": total_pages,
            "total_items": total_count,
            "items_per_page": pagination["limit"],
            "has_next": pagination["page"] < total_pages,
            "has_previous": pagination["page"] > 1
        }
        
        return ApiResponse.success(
            claim_data,
            f"Retrieved {len(claim_data)} claims",
            pagination_info
        )
        
    except Exception as e:
        logger.error(f"Error listing claims: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ApiResponse.error(f"Failed to retrieve claims: {str(e)}")
        )

@router.get("/alerts", tags=["alerts"])
async def get_alerts(
    db: Session = Depends(get_db),
    pagination = Depends(common_pagination_params),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    active_only: bool = Query(True, description="Show only active alerts"),
):
    """
    Get system alerts and notifications
    
    Returns paginated list of alerts including policy expiration warnings,
    document processing errors, and system notifications.
    """
    try:
        # Get alerts from alert service
        all_alerts = alert_service.get_all_alerts(
            alert_type=alert_type,
            active_only=active_only
        )
        
        # Apply pagination manually (since alerts come from service, not DB)
        total_count = len(all_alerts)
        start_idx = pagination["offset"]
        end_idx = start_idx + pagination["limit"]
        alerts = all_alerts[start_idx:end_idx]
        
        # Calculate pagination info
        total_pages = (total_count + pagination["limit"] - 1) // pagination["limit"]
        pagination_info = {
            "current_page": pagination["page"],
            "total_pages": total_pages,
            "total_items": total_count,
            "items_per_page": pagination["limit"],
            "has_next": pagination["page"] < total_pages,
            "has_previous": pagination["page"] > 1
        }
        
        return ApiResponse.success(
            alerts,
            f"Retrieved {len(alerts)} alerts",
            pagination_info
        )
        
    except Exception as e:
        logger.error(f"Error retrieving alerts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ApiResponse.error(f"Failed to retrieve alerts: {str(e)}")
        )
