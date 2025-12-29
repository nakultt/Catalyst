"""
Validator API - AI-Powered Startup Funding Assistant
Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import config

# Import routers
from routers import dashboard, chatbot, route_map, pitch, opportunities

# Create FastAPI app
app = FastAPI(
    title="Validator API",
    description="AI-Powered Startup Funding Assistant - GraphRAG Engine + Visual Navigator + Pitch Analyzer",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(dashboard.router)
app.include_router(chatbot.router)
app.include_router(route_map.router)
app.include_router(pitch.router)
app.include_router(opportunities.router)

@app.get("/")
async def root():
    """Root endpoint with API status."""
    return {
        "name": "Validator API",
        "version": "1.0.0",
        "status": "running",
        "config": config.validate(),
        "endpoints": {
            "dashboard": "/api/dashboard",
            "chat": "/api/chat",
            "route_map": "/api/route-map",
            "pitch_analyzer": "/api/analyze-pitch",
            "opportunities": "/api/opportunities"
        },
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=config.DEBUG
    )
