"""
Chatbot API router.
Provides GraphRAG-powered chat with source citations.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from services.langchain_service import chat_with_citations

router = APIRouter(prefix="/api", tags=["chatbot"])

class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None

class ChatResponse(BaseModel):
    success: bool
    answer: str
    sources: list[str]
    context_used: bool

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process user chat message and return AI response with citations.
    
    Example questions:
    - "Who invests in AgriTech in Tamil Nadu?"
    - "What government schemes am I eligible for?"
    - "What hackathons can I participate in?"
    """
    result = await chat_with_citations(request.message)
    return ChatResponse(
        success=True,
        answer=result["answer"],
        sources=result["sources"],
        context_used=result["context_used"]
    )
