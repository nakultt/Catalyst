"""
Route Map API router.
Generates visual funding roadmaps based on startup profile.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from services.route_generator import generate_funding_route

router = APIRouter(prefix="/api", tags=["route-map"])

class RouteMapRequest(BaseModel):
    stage: str  # Idea, MVP, Revenue
    sector: str  # AgriTech, FinTech, etc.
    location: str  # City or State name

class RouteMapResponse(BaseModel):
    success: bool
    nodes: list
    edges: list
    summary: str

@router.post("/route-map", response_model=RouteMapResponse)
async def generate_route_map(request: RouteMapRequest):
    """
    Generate a visual funding roadmap.
    
    Returns React Flow compatible nodes and edges for visualization.
    """
    result = generate_funding_route(
        stage=request.stage,
        sector=request.sector,
        location=request.location
    )
    return RouteMapResponse(
        success=True,
        nodes=result["nodes"],
        edges=result["edges"],
        summary=result["summary"]
    )
