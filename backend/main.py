"""
FastAPI Backend for Speedometer ML Training & Analysis

This is a minimal starter backend. Currently, the app runs entirely
in the browser using ONNX Runtime Web. This backend can be used for:
- ML model training
- Heavy computation
- Data storage/retrieval
- Advanced analysis
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

# Initialize FastAPI app
app = FastAPI(
    title="Speedometer API",
    description="Backend API for cricket ball speed analysis",
    version="0.1.0",
)

# Configure CORS
origins = [
    "http://localhost:3000",  # Next.js dev server
    "http://localhost",       # Local deployment
    os.getenv("FRONTEND_URL", ""),  # Production frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "speedometer-api",
        "version": "0.1.0",
    }


# Root endpoint
@app.get("/")
async def root():
    """API root with documentation links"""
    return {
        "message": "Speedometer API",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
    }


# Example: Model info endpoint
@app.get("/api/model/info")
async def get_model_info():
    """Get information about the ML model"""
    return {
        "model_type": "YOLO-based object detection",
        "runtime": "ONNX Runtime Web (client-side)",
        "backend_version": "0.1.0",
        "note": "Model inference runs in browser. This endpoint is for future training/analysis features.",
    }


# Example: Pydantic model for future analysis endpoint
class AnalysisRequest(BaseModel):
    """Request model for delivery analysis"""
    
    frames: list[dict]
    calibration: dict
    options: dict | None = None


class AnalysisResponse(BaseModel):
    """Response model for delivery analysis"""
    
    speed_kmh: float | None
    detections_count: int
    trajectory_points: list[dict]
    warnings: list[str]
    processing_time_ms: float


# Example: Future analysis endpoint (placeholder)
@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_delivery(request: AnalysisRequest):
    """
    Analyze a cricket delivery (NOT IMPLEMENTED)
    
    Currently, all analysis happens client-side using ONNX Runtime Web.
    This endpoint is a placeholder for future server-side processing.
    """
    return AnalysisResponse(
        speed_kmh=None,
        detections_count=0,
        trajectory_points=[],
        warnings=["Server-side analysis not implemented. Use client-side inference."],
        processing_time_ms=0.0,
    )


# Example: Training endpoint (future)
@app.post("/api/train")
async def train_model():
    """
    Trigger model training (NOT IMPLEMENTED)
    
    Future endpoint for training new detection models.
    """
    return {
        "status": "not_implemented",
        "message": "Model training endpoint coming soon",
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
