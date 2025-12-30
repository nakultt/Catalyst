"""
Scheme Eligibility API router.
Handles document uploads for scheme eligibility verification.
"""
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import time

router = APIRouter(prefix="/api", tags=["schemes"])

class SchemeEligibilityResponse(BaseModel):
    eligible: bool
    scheme_name: str
    reason: Optional[str] = None
    confidence_score: float
    details: List[str]

@router.post("/check-eligibility", response_model=SchemeEligibilityResponse)
async def check_eligibility(
    pan: UploadFile = File(...),
    aadhaar: UploadFile = File(...),
    incorporation: UploadFile = File(...)
):
    """
    Upload documents to check scheme eligibility.
    Currently simulates the check based on file presence.
    """
    
    # Simulate processing delay
    time.sleep(2)
    
    # Basic validation (filenames)
    if not pan.filename or not aadhaar.filename or not incorporation.filename:
        raise HTTPException(status_code=400, detail="All documents are required")
        
    # Mock Logic: Check if files are PDFs or Images (just for "validation")
    # In a real app, we would use OCR here.
    
    return SchemeEligibilityResponse(
        eligible=True,
        scheme_name="Startup India Seed Fund Scheme (SISFS)",
        confidence_score=92.5,
        details=[
            "Entity type verified as Private Limited",
            "Incorporation date < 2 years (Eligible)",
            "DPIIT Recognition verified via PAN",
            "Founders are Indian citizens (Aadhaar verified)"
        ],
        reason="Documents successfully verified against SISFS criteria."
    )
