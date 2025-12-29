"""
LangChain service for GraphRAG chatbot with Google Gemini.
Provides intelligent responses with source citations.
"""
from typing import Optional
from config import config
from data_loader import search_all, get_investors, get_schemes, get_opportunities, get_data

# Lazy import for LangChain to handle missing API key gracefully
_llm = None

def get_llm():
    """Get or initialize the LangChain LLM."""
    global _llm
    
    if not config.has_gemini_key():
        return None
    
    if _llm is None:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            _llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=config.GOOGLE_API_KEY,
                temperature=0.7,
                max_output_tokens=1024
            )
        except Exception as e:
            print(f"Failed to initialize Gemini: {e}")
            return None
    
    return _llm

def build_context_from_data(query: str) -> tuple[str, list[str]]:
    """
    Build context from seed data based on query.
    Returns (context_string, list_of_sources).
    """
    query_lower = query.lower()
    context_parts = []
    sources = []
    
    # Detect query intent and fetch relevant data
    data = get_data()
    
    # Check for investor queries
    if any(word in query_lower for word in ["investor", "invest", "fund", "angel", "vc", "venture"]):
        # Extract location/sector hints
        state = None
        sector = None
        
        for s in data["locations"]["states"].keys():
            if s.lower() in query_lower:
                state = s
                break
        
        for inv in data["investors"]:
            for sec in inv["sectors"]:
                if sec.lower() in query_lower:
                    sector = sec
                    break
        
        investors = get_investors(sector=sector, state=state)
        if investors:
            context_parts.append("RELEVANT INVESTORS:")
            for inv in investors[:5]:
                context_parts.append(f"""
- {inv['name']} ({inv['type']})
  Location: {inv['location']}, {inv['state']}
  Sectors: {', '.join(inv['sectors'])}
  Stage: {', '.join(inv['stage'])}
  Ticket Size: {inv['ticket_size']}
  Investment Thesis: {inv['investment_thesis']}
  Source: {inv['source']}
""")
                sources.append(inv['source'])
    
    # Check for scheme/grant queries
    if any(word in query_lower for word in ["scheme", "grant", "government", "subsidy", "fund", "loan"]):
        state = None
        for s in data["locations"]["states"].keys():
            if s.lower() in query_lower:
                state = s
                break
        
        schemes = get_schemes(state=state)
        if schemes:
            context_parts.append("\nRELEVANT GOVERNMENT SCHEMES:")
            for scheme in schemes[:5]:
                context_parts.append(f"""
- {scheme['name']}
  Type: {scheme['type']}
  Department: {scheme['department']}
  Funding: {scheme['funding_amount']}
  Eligibility: {scheme['eligibility']}
  Source: {scheme['source']}
""")
                sources.append(scheme['source'])
    
    # Check for opportunity queries
    if any(word in query_lower for word in ["hackathon", "competition", "accelerator", "opportunity", "event"]):
        opportunities = get_opportunities()
        if opportunities:
            context_parts.append("\nRELEVANT OPPORTUNITIES:")
            for opp in opportunities[:5]:
                context_parts.append(f"""
- {opp['name']} ({opp['type']})
  Organizer: {opp['organizer']}
  Prize: {opp['prize']}
  Deadline: {opp['deadline']}
  Eligibility: {opp['eligibility']}
  Source: {opp['source']}
""")
                sources.append(opp['source'])
    
    # If no specific context found, do full-text search
    if not context_parts:
        search_results = search_all(query)
        if search_results["investors"]:
            context_parts.append("SEARCH RESULTS - INVESTORS:")
            for inv in search_results["investors"][:3]:
                context_parts.append(f"- {inv['name']} in {inv['location']}: {inv['investment_thesis'][:100]}...")
                sources.append(inv['source'])
        
        if search_results["schemes"]:
            context_parts.append("\nSEARCH RESULTS - SCHEMES:")
            for scheme in search_results["schemes"][:3]:
                context_parts.append(f"- {scheme['name']}: {scheme['funding_amount']}")
                sources.append(scheme['source'])
        
        if search_results["opportunities"]:
            context_parts.append("\nSEARCH RESULTS - OPPORTUNITIES:")
            for opp in search_results["opportunities"][:3]:
                context_parts.append(f"- {opp['name']}: {opp['prize']}")
                sources.append(opp['source'])
    
    return "\n".join(context_parts), list(set(sources))

async def chat_with_citations(user_query: str) -> dict:
    """
    Process user query and return response with citations.
    Falls back to rule-based response if Gemini is unavailable.
    """
    # Build context from seed data
    context, sources = build_context_from_data(user_query)
    
    llm = get_llm()
    
    if llm and context:
        # Use Gemini for intelligent response
        try:
            prompt = f"""You are Sahayak, an AI assistant helping Indian startup founders with funding advice.
            
Based on the following data, answer the user's question. 
IMPORTANT: You MUST cite your sources in the format [Source: Document Name, Page X] for every fact you mention.

CONTEXT DATA:
{context}

USER QUESTION: {user_query}

Provide a helpful, specific answer with citations. If the data doesn't contain relevant information, say so honestly.
"""
            response = await llm.ainvoke(prompt)
            
            # Ensure sources are included
            answer = response.content
            if sources and "[Source:" not in answer:
                answer += "\n\n**Sources:** " + ", ".join([f"[{s}]" for s in sources[:3]])
            
            return {
                "answer": answer,
                "sources": sources,
                "context_used": True
            }
        except Exception as e:
            print(f"Gemini error: {e}")
    
    # Fallback: Rule-based response using the context
    if context:
        fallback_answer = f"""Based on our database, here's what I found relevant to your query:

{context}

**Note:** This is a direct data lookup. For more personalized insights, please configure your Gemini API key.

**Sources:** {', '.join([f'[{s}]' for s in sources[:3]]) if sources else 'Local Database'}
"""
        return {
            "answer": fallback_answer,
            "sources": sources,
            "context_used": True
        }
    
    return {
        "answer": "I couldn't find specific information about that in our database. Could you try rephrasing your question or asking about investors, government schemes, or startup opportunities?",
        "sources": [],
        "context_used": False
    }

def get_dashboard_insights() -> dict:
    """Generate dashboard insights from seed data."""
    data = get_data()
    user = data.get("user_profile", {})
    
    # Calculate funding probability based on user profile
    score = 50  # Base score
    
    if user.get("dpiit_registered"):
        score += 15
    if user.get("monthly_revenue", 0) > 0:
        score += 20
    if user.get("team_size", 0) >= 3:
        score += 10
    if user.get("stage") in ["MVP", "Revenue"]:
        score += 5
    
    # Get matching investors
    matching_investors = get_investors(
        sector=user.get("sector"),
        state=user.get("state")
    )
    
    # Get applicable schemes
    applicable_schemes = get_schemes(
        state=user.get("state"),
        stage=user.get("stage")
    )
    
    # Get opportunities
    opportunities = get_opportunities(sector=user.get("sector"))
    
    # Generate recommended actions
    actions = []
    if not user.get("dpiit_registered"):
        actions.append({
            "title": "Register on DPIIT Portal",
            "priority": "high",
            "impact": "+15% funding probability"
        })
    
    if matching_investors:
        actions.append({
            "title": f"Pitch to {matching_investors[0]['name']}",
            "priority": "medium",
            "impact": "Local angel network match"
        })
    
    if applicable_schemes:
        actions.append({
            "title": f"Apply for {applicable_schemes[0]['name']}",
            "priority": "high",
            "impact": applicable_schemes[0]['funding_amount']
        })
    
    if opportunities:
        actions.append({
            "title": f"Participate in {opportunities[0]['name']}",
            "priority": "medium",
            "impact": opportunities[0]['prize']
        })
    
    return {
        "funding_probability": min(score, 95),
        "matching_investors": len(matching_investors),
        "applicable_schemes": len(applicable_schemes),
        "active_opportunities": len(opportunities),
        "recommended_actions": actions[:4],
        "user_profile": user
    }
