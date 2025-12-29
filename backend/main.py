"""
Validator API - AI-Powered Startup Funding Assistant
Main FastAPI application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import config

# Import routers
from routers import dashboard, chatbot, route_map, pitch, opportunities


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler - startup and shutdown."""
    # Startup: Sync to Neo4j if configured
    if config.has_neo4j():
        print("🔄 Neo4j configured, syncing knowledge graph...")
        from services.neo4j_service import sync_to_neo4j
        sync_to_neo4j()
    else:
        print("⚠️ Neo4j not configured, using in-memory knowledge graph")
    
    yield  # Application runs here
    
    # Shutdown: Close Neo4j connection
    if config.has_neo4j():
        from services.neo4j_service import close_neo4j_driver
        close_neo4j_driver()
        print("👋 Neo4j connection closed")


# Create FastAPI app with lifespan
app = FastAPI(
    title="Validator API",
    description="AI-Powered Startup Funding Assistant - GraphRAG Engine + Visual Navigator + Pitch Analyzer",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
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
            "opportunities": "/api/opportunities",
            "graph_stats": "/api/graph/stats",
            "graph_sync": "/api/graph/sync"
        },
        "docs": "/docs"
    }


@app.get("/api/graph/stats")
async def get_graph_stats():
    """Get Knowledge Graph statistics (Neo4j or in-memory)."""
    if config.has_neo4j():
        from services.neo4j_service import get_graph_stats_neo4j
        return get_graph_stats_neo4j()
    else:
        from services.knowledge_graph import get_knowledge_graph
        kg = get_knowledge_graph()
        return kg.get_graph_stats()


@app.post("/api/graph/sync")
async def sync_graph():
    """Manually trigger Neo4j sync (re-syncs seed data)."""
    if not config.has_neo4j():
        return {"success": False, "message": "Neo4j not configured"}
    
    from services.neo4j_service import sync_to_neo4j, get_graph_stats_neo4j
    success = sync_to_neo4j()
    stats = get_graph_stats_neo4j() if success else {}
    
    return {
        "success": success,
        "message": "Knowledge Graph synced to Neo4j" if success else "Sync failed",
        "stats": stats
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=config.DEBUG
    )

