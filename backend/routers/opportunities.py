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
    Now with AI-powered match scores and recommendations.
    
    Query params:
    - sector: Filter by sector (e.g., "AI/ML", "AgriTech")
    - opp_type: Filter by type (e.g., "Hackathon", "Grant")
    """
    opportunities = get_opportunities(sector=sector, opp_type=opp_type)
    user_profile = get_user_profile()
    
    # Calculate match scores based on user profile
    for opp in opportunities:
        score = 70  # Base score
        opp_sectors = opp.get("eligibility", {}).get("sectors", [])
        
        # Boost if user sector matches
        if user_profile.get("sector") in opp_sectors or not opp_sectors:
            score += 15
        # Boost if user has required stage
        opp_stages = opp.get("eligibility", {}).get("stage", [])
        if user_profile.get("stage") in opp_stages or not opp_stages:
            score += 10
        # Boost if DPIIT registered
        if user_profile.get("dpiit_registered"):
            score += 5
            
        opp["match_score"] = min(score, 98)
    
    # Sort by match score descending
    opportunities.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    
    # Generate AI recommendation if available
    ai_insight = None
    try:
        from services.langchain_service import get_llm
        llm = get_llm()
        if llm and opportunities:
            top_3 = opportunities[:3]
            prompt = f"""You are a startup advisor. Based on the user's profile ({user_profile.get('sector')} startup at {user_profile.get('stage')} stage), provide ONE sentence of advice about which of these opportunities they should prioritize:

{chr(10).join([f"- {o['name']} ({o['type']}): {o.get('prize', 'N/A')}" for o in top_3])}

Keep it under 50 words, specific and actionable."""

            response = await llm.ainvoke(prompt)
            ai_insight = response.content
    except Exception as e:
        print(f"AI insight generation failed: {e}")
    
    return {
        "success": True,
        "data": opportunities,
        "total": len(opportunities),
        "ai_insight": ai_insight,
        "ai_powered": ai_insight is not None
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
