"""
Pitch Analyzer API router.
Analyzes video frames for confidence scoring using Computer Vision.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from services.pitch_analyzer import analyze_pitch_frame

router = APIRouter(prefix="/api", tags=["pitch"])

class PitchAnalyzeRequest(BaseModel):
    image: str  # Base64 encoded image

class FeedbackItem(BaseModel):
    type: str
    message: str

class PitchAnalyzeResponse(BaseModel):
    success: bool
    confidence_score: float
    eye_contact_score: float | None = None
    head_position_score: float | None = None
    feedback: list[FeedbackItem]
    simulated: bool = False
    error: str | None = None

@router.post("/analyze-pitch", response_model=PitchAnalyzeResponse)
async def analyze_pitch(request: PitchAnalyzeRequest):
    """
    Analyze a pitch video frame for confidence metrics.
    
    Accepts base64 encoded image and returns:
    - Overall confidence score (0-100)
    - Eye contact score
    - Head position score
    - Actionable feedback
    """
    result = analyze_pitch_frame(request.image)
    
    return PitchAnalyzeResponse(
        success=result.get("success", False),
        confidence_score=result.get("confidence_score", 0),
        eye_contact_score=result.get("eye_contact_score"),
        head_position_score=result.get("head_position_score"),
        feedback=[FeedbackItem(**f) for f in result.get("feedback", [])],
        simulated=result.get("simulated", False),
        error=result.get("error")
    )
