"""
Dashboard API router.
Provides summary data and insights for the Intelligence Dashboard.
"""
from fastapi import APIRouter
from services.langchain_service import get_dashboard_insights

router = APIRouter(prefix="/api", tags=["dashboard"])

@router.get("/dashboard")
async def get_dashboard():
    """
    Get dashboard summary data including:
    - Funding probability score
    - Recommended actions
    - Matching metrics
    """
    insights = get_dashboard_insights()
    return {
        "success": True,
        "data": insights
    }

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Validator API"}
