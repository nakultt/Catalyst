"""
Opportunities API router.
Provides active grants, hackathons, and application functionality.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from data_loader import get_opportunities, get_user_profile

router = APIRouter(prefix="/api", tags=["opportunities"])

class ApplicationRequest(BaseModel):
    opportunity_id: str
    applicant_name: str
    applicant_email: str
    startup_name: str
    pitch: str

class ApplicationResponse(BaseModel):
    success: bool
    message: str
    application_id: str

@router.get("/opportunities")
async def list_opportunities(sector: str | None = None, opp_type: str | None = None):
    """
    Get list of active opportunities (hackathons, grants, accelerators).
    
    Query params:
    - sector: Filter by sector (e.g., "AI/ML", "AgriTech")
    - opp_type: Filter by type (e.g., "Hackathon", "Grant")
    """
    opportunities = get_opportunities(sector=sector, opp_type=opp_type)
    return {
        "success": True,
        "data": opportunities,
        "total": len(opportunities)
    }

@router.get("/user-profile")
async def get_profile():
    """Get user profile for pre-filling application forms."""
    profile = get_user_profile()
    return {
        "success": True,
        "data": profile
    }

@router.post("/apply", response_model=ApplicationResponse)
async def submit_application(request: ApplicationRequest):
    """
    Submit an application for an opportunity.
    
    This is a mock endpoint that simulates application submission.
    In production, this would integrate with actual opportunity portals.
    """
    import uuid
    application_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
    
    return ApplicationResponse(
        success=True,
        message=f"Application submitted successfully for opportunity {request.opportunity_id}. You will receive a confirmation email at {request.applicant_email}.",
        application_id=application_id
    )
