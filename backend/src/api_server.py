"""
FastAPI HTTP server for Insurance Management System
Provides REST API endpoints for the UI including v1 API routes
"""
import os
import logging
import tempfile
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from database import run_migrations
from api.v1.routes import router as v1_router

from ui_backend_adapter import UIBackendAdapter, get_adapter

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for request/response
class AgentCreate(BaseModel):
    name: str
    company: str
    email: str
    phone: str

class BuildingCreate(BaseModel):
    name: str
    address: str
    notes: str = ""
    primary_agent_id: Optional[str] = None

class PolicyCreate(BaseModel):
    building_id: str
    agent_id: str
    coverage_type: str
    policy_number: str
    carrier: str
    effective_date: str
    expiration_date: str
    limits: Dict[str, float]
    deductibles: Dict[str, float]
    premium_annual: float
    status: str = "active"

class PolicyNoteCreate(BaseModel):
    note: str

class SearchRequest(BaseModel):
    query: str
    limit: int = 50

class TestEmailRequest(BaseModel):
    email: str

# FastAPI app
app = FastAPI(
    title="Insurance Master API",
    description="Backend API for Insurance Management System",
    version="1.0.0"
)

# CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 API routes
app.include_router(v1_router)

# Run migrations on startup
@app.on_event("startup")
async def startup_event():
    """Run database migrations on startup"""
    try:
        run_migrations()
        logger.info("Database migrations completed successfully")
    except Exception as e:
        logger.error(f"Failed to run migrations: {e}")
        # Don't raise to prevent server startup failure

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Insurance Master API is running"}

# System endpoints
@app.post("/api/system/init")
async def initialize_system(adapter: UIBackendAdapter = Depends(get_adapter)):
    """Initialize the system database and seed data"""
    result = adapter.initialize_system()
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["message"])
    return result

@app.get("/api/system/stats")
async def get_system_stats(adapter: UIBackendAdapter = Depends(get_adapter)):
    """Get system statistics"""
    result = adapter.get_system_stats()
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("message", "Unknown error"))
    return result["stats"]

# Agent endpoints
@app.get("/api/agents")
async def get_agents(adapter: UIBackendAdapter = Depends(get_adapter)):
    """Get all agents"""
    return adapter.list_agents()

@app.get("/api/agents/{agent_id}")
async def get_agent(agent_id: str, adapter: UIBackendAdapter = Depends(get_adapter)):
    """Get a specific agent"""
    agent = adapter.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@app.post("/api/agents")
async def create_agent(agent: AgentCreate, adapter: UIBackendAdapter = Depends(get_adapter)):
    """Create a new agent"""
    result = adapter.add_agent(
        name=agent.name,
        company=agent.company,
        email=agent.email,
        phone=agent.phone
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

# Building endpoints
@app.get("/api/buildings")
async def get_buildings(agent_id: Optional[str] = None, adapter: UIBackendAdapter = Depends(get_adapter)):
    """Get buildings, optionally filtered by agent"""
    return adapter.list_buildings(agent_id)

@app.post("/api/buildings")
async def create_building(building: BuildingCreate, adapter: UIBackendAdapter = Depends(get_adapter)):
    """Create a new building"""
    result = adapter.add_building(
        name=building.name,
        address=building.address,
        notes=building.notes,
        primary_agent_id=building.primary_agent_id
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

# Policy endpoints
@app.get("/api/policies")
async def get_policies(building_id: Optional[str] = None, agent_id: Optional[str] = None, 
                      adapter: UIBackendAdapter = Depends(get_adapter)):
    """Get policies, optionally filtered by building or agent"""
    return adapter.get_policies(building_id, agent_id)

@app.post("/api/policies")
async def create_policy(policy: PolicyCreate, adapter: UIBackendAdapter = Depends(get_adapter)):
    """Create a new policy"""
    result = adapter.add_policy(
        building_id=policy.building_id,
        agent_id=policy.agent_id,
        coverage_type=policy.coverage_type,
        policy_number=policy.policy_number,
        carrier=policy.carrier,
        effective_date=policy.effective_date,
        expiration_date=policy.expiration_date,
        limits=policy.limits,
        deductibles=policy.deductibles,
        premium_annual=policy.premium_annual,
        status=policy.status
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.get("/api/policies/{policy_id}/history")
async def get_policy_history(policy_id: str, adapter: UIBackendAdapter = Depends(get_adapter)):
    """Get policy history including notes and files"""
    return adapter.get_policy_history(policy_id)

@app.post("/api/policies/{policy_id}/notes")
async def add_policy_note(policy_id: str, note: PolicyNoteCreate, 
                         file: Optional[UploadFile] = File(None),
                         adapter: UIBackendAdapter = Depends(get_adapter)):
    """Add a note to a policy with optional file attachment"""
    file_path = None
    
    if file and file.filename:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            file_path = tmp_file.name
    
    try:
        result = adapter.add_policy_note(policy_id, note.note, file_path)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    finally:
        # Clean up temporary file
        if file_path and os.path.exists(file_path):
            os.unlink(file_path)

# File upload endpoints
@app.post("/api/upload/pdf")
async def upload_pdf(
    building_id: str = Form(...),
    policy_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    adapter: UIBackendAdapter = Depends(get_adapter)
):
    """Upload and parse a PDF file"""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name
    
    try:
        result = adapter.upload_pdf(tmp_file_path, file.filename, building_id, policy_id)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)

@app.get("/api/files/{file_id}")
async def download_file(file_id: str, adapter: UIBackendAdapter = Depends(get_adapter)):
    """Download a file by ID"""
    file_path = adapter.get_file_path(file_id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=os.path.basename(file_path),
        media_type='application/octet-stream'
    )

# Search endpoints
@app.post("/api/search")
async def search_policies(search: SearchRequest, adapter: UIBackendAdapter = Depends(get_adapter)):
    """Search across policies and policy history"""
    return adapter.search_policies(search.query, search.limit)

@app.get("/api/search/suggestions")
async def get_search_suggestions(q: str, limit: int = 10, adapter: UIBackendAdapter = Depends(get_adapter)):
    """Get search suggestions"""
    return adapter.get_search_suggestions(q, limit)

# Alert endpoints
@app.get("/api/alerts")
async def get_alerts(limit: int = 50, unread_only: bool = False, 
                    adapter: UIBackendAdapter = Depends(get_adapter)):
    """Get alerts"""
    return adapter.get_alerts(limit, unread_only)

@app.post("/api/alerts/check-renewals")
async def check_renewals(adapter: UIBackendAdapter = Depends(get_adapter)):
    """Check for policies needing renewal"""
    return adapter.check_renewals()

@app.post("/api/email/test")
async def send_test_email(request: TestEmailRequest, adapter: UIBackendAdapter = Depends(get_adapter)):
    """Send a test email"""
    result = adapter.send_test_email(request.email)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

# Error handlers
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return {"error": "Internal server error", "detail": str(exc)}

if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment
    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", 8000))
    
    print(f"Starting Insurance Master API server on {host}:{port}")
    print("API Documentation available at: http://127.0.0.1:8000/docs")
    
    uvicorn.run(
        "api_server:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
