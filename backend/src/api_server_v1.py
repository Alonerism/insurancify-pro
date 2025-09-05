"""
Insurance Document Management API Server - V1 Implementation

FastAPI server providing v1 API endpoints for insurance document management.
This is a clean implementation focused on the v1 API without legacy dependencies.
"""

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .database import run_migrations
from .api.v1.routes import router as v1_router

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Insurance Document Management API",
    description="V1 API for Insurance Document Management System with comprehensive features",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",    # React default
        "http://localhost:5173",    # Vite default 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"  # For development - remove in production
    ],
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
        logger.info("✅ Database migrations completed successfully")
    except Exception as e:
        logger.error(f"❌ Failed to run migrations: {e}")
        # Don't raise to prevent server startup failure in development

# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """API root endpoint with information"""
    return {
        "message": "Insurance Document Management API",
        "version": "1.0.0",
        "api_docs": "/docs",
        "redoc_docs": "/redoc", 
        "v1_endpoints": "/v1",
        "health_check": "/v1/health",
        "status": "operational"
    }

# Legacy health check (for compatibility)
@app.get("/health", tags=["system"])
async def legacy_health():
    """Legacy health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "message": "Use /v1/health for detailed system status"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.api_server_v1:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
