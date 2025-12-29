"""
LangChain GraphRAG Service - The Brain's Interface
Combines Knowledge Graph traversal with Gemini LLM for intelligent responses.

Key Features:
- Knowledge Graph-based entity discovery
- Transitive location inference (Jaipur → Rajasthan → North India)
- Source citation from verified documents
- Fallback to rule-based when LLM unavailable
"""
from typing import Optional
from config import config
from data_loader import get_data, get_investors, get_schemes, get_opportunities

# Lazy imports
_llm = None
_knowledge_graph = None

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

def get_kg():
    """Get or initialize the Knowledge Graph."""
    global _knowledge_graph
    
    if _knowledge_graph is None:
        try:
            from services.knowledge_graph import get_knowledge_graph
            _knowledge_graph = get_knowledge_graph()
            stats = _knowledge_graph.get_graph_stats()
            print(f"📊 Knowledge Graph loaded: {stats['total_entities']} entities, {stats['total_relationships']} relationships")
        except Exception as e:
            print(f"Failed to initialize Knowledge Graph: {e}")
            return None
    
    return _knowledge_graph


def build_context_from_knowledge_graph(query: str) -> tuple[str, list[str], dict]:
    """
    Build context using Knowledge Graph traversal.
    Returns (context_string, sources, graph_results).
    
    This is the core GraphRAG logic:
    1. Parse query to identify entity types and names
    2. Use KG to find entities with relationship traversal
    3. Format results for LLM context
    """
    kg = get_kg()
    if not kg:
        # Fallback to basic data loader if KG fails
        return build_context_from_data(query)
    
    query_lower = query.lower()
    context_parts = []
    sources = []
    graph_results = {"method": "knowledge_graph", "entities_found": 0, "relationships_traversed": 0}
    
    # ===== INVESTOR QUERIES with Location Inference =====
    if any(word in query_lower for word in ["investor", "invest", "fund", "angel", "vc", "venture", "who"]):
        from services.knowledge_graph import EntityType
        
        # Extract location hint (city, state, or region)
        location_hint = None
        for entity in kg.entities.values():
            if entity.entity_type.value in ["city", "state", "region"]:
                if entity.name.lower() in query_lower:
                    location_hint = entity.name
                    break
        
        # Extract sector hint
        sector_hint = None
        for entity in kg.entities.values():
            if entity.entity_type.value == "sector":
                if entity.name.lower() in query_lower:
                    sector_hint = entity.name
                    break
        
        investors = []
        
        if location_hint and sector_hint:
            # BOTH location + sector: Use KG intersection
            location_investors = {i[0].id: i for i in kg.find_investors_in_location(location_hint)}
            sector_investors = {i.id: i for i in kg.find_investors_in_sector(sector_hint)}
            matching_ids = set(location_investors.keys()).intersection(sector_investors.keys())
            
            for inv_id in matching_ids:
                inv_entity, matched_loc = location_investors[inv_id]
                investors.append((inv_entity, matched_loc))
            
            context_parts.append(f"🔍 GraphRAG Query: Investors in {location_hint} + {sector_hint}")
            context_parts.append(f"   (Used transitive location inference)")
            graph_results["relationships_traversed"] += len(location_investors) + len(sector_investors)
            
        elif location_hint:
            # Location-only: Use transitive inference
            investors = kg.find_investors_in_location(location_hint)
            context_parts.append(f"🔍 GraphRAG Query: Investors operating in {location_hint}")
            context_parts.append(f"   (Includes parent locations via LOCATED_IN relationships)")
            graph_results["relationships_traversed"] += len(investors)
            
        elif sector_hint:
            # Sector-only
            sector_investors = kg.find_investors_in_sector(sector_hint)
            investors = [(i, "N/A") for i in sector_investors]
            context_parts.append(f"🔍 GraphRAG Query: Investors in {sector_hint} sector")
        
        if investors:
            context_parts.append(f"\n📊 Found {len(investors)} matching investors:\n")
            for item in investors[:5]:
                if isinstance(item, tuple):
                    inv_entity, matched_location = item
                else:
                    inv_entity = item
                    matched_location = "Direct match"
                
                props = inv_entity.properties
                context_parts.append(f"""
**{inv_entity.name}** ({props.get('type', 'Investor')})
- Matched via: {matched_location}
- Ticket Size: {props.get('ticket_size', 'N/A')}
- Sectors: {', '.join(props.get('sectors', [])[:3]) if isinstance(props.get('sectors', []), list) else 'N/A'}
- Investment Thesis: {props.get('investment_thesis', 'N/A')[:150]}...
- Contact: {props.get('contact_email', 'N/A')}
- 📄 Source: {props.get('source', 'Knowledge Graph')}
""")
                if props.get('source'):
                    sources.append(props['source'])
            
            graph_results["entities_found"] = len(investors)
    
    # ===== SCHEME QUERIES with State Inheritance =====
    elif any(word in query_lower for word in ["scheme", "grant", "government", "subsidy", "eligib", "loan"]):
        from services.knowledge_graph import EntityType
        
        # Extract state hint
        state_hint = None
        for entity in kg.entities.values():
            if entity.entity_type.value == "state":
                if entity.name.lower() in query_lower:
                    state_hint = entity.name
                    break
        
        # Also check for city (infer state)
        if not state_hint:
            for entity in kg.entities.values():
                if entity.entity_type.value == "city":
                    if entity.name.lower() in query_lower:
                        # Traverse to find parent state
                        hierarchy = kg.traverse_location_hierarchy(entity.id)
                        for loc in hierarchy:
                            if loc.entity_type.value == "state":
                                state_hint = loc.name
                                context_parts.append(f"ℹ️ Inferred state '{state_hint}' from city '{entity.name}'")
                                break
                        break
        
        if state_hint:
            schemes = kg.find_schemes_in_state(state_hint)
            context_parts.append(f"🔍 GraphRAG Query: Schemes in {state_hint} (+ Central Government schemes)")
        else:
            schemes = kg.find_entities_by_type(EntityType.SCHEME)
            context_parts.append("🔍 GraphRAG Query: All available schemes")
        
        if schemes:
            context_parts.append(f"\n📊 Found {len(schemes)} matching schemes:\n")
            for scheme in schemes[:5]:
                props = scheme.properties
                context_parts.append(f"""
**{scheme.name}**
- Type: {props.get('type', 'N/A')}
- Department: {props.get('department', 'N/A')}
- Funding: {props.get('funding_amount', 'N/A')}
- Eligibility: {props.get('eligibility', {})}
- Process: {props.get('application_process', 'N/A')}
- 📄 Source: {props.get('source', 'Knowledge Graph')}
""")
                if props.get('source'):
                    sources.append(props['source'])
            
            graph_results["entities_found"] = len(schemes)
    
    # ===== OPPORTUNITY QUERIES =====
    elif any(word in query_lower for word in ["hackathon", "competition", "accelerator", "opportunity", "event", "challenge"]):
        from services.knowledge_graph import EntityType
        
        opportunities = kg.find_entities_by_type(EntityType.OPPORTUNITY)
        context_parts.append("🔍 GraphRAG Query: Active opportunities")
        
        if opportunities:
            context_parts.append(f"\n📊 Found {len(opportunities)} opportunities:\n")
            for opp in opportunities[:5]:
                props = opp.properties
                context_parts.append(f"""
**{opp.name}** ({props.get('type', 'Opportunity')})
- Organizer: {props.get('organizer', 'N/A')}
- Prize: {props.get('prize', 'N/A')}
- Deadline: {props.get('deadline', 'N/A')}
- Benefits: {', '.join(props.get('benefits', [])[:3]) if isinstance(props.get('benefits', []), list) else 'N/A'}
- 📄 Source: {props.get('source', 'Knowledge Graph')}
""")
                if props.get('source'):
                    sources.append(props['source'])
            
            graph_results["entities_found"] = len(opportunities)
    
    # ===== GENERAL/DPIIT QUERIES =====
    elif any(word in query_lower for word in ["dpiit", "register", "recognition", "startup india"]):
        context_parts.append("📋 DPIIT Registration Information:\n")
        context_parts.append("""
**DPIIT Startup Recognition**
- What: Official recognition as a "Startup" by Government of India
- Benefits: Tax exemptions, easier public procurement, self-certification
- Eligibility: 
  - Entity incorporated as Pvt Ltd, LLP, or Partnership
  - Less than 10 years old
  - Annual turnover < ₹100 Cr
  - Working towards innovation/scalability
- Process: Apply on Startup India portal (startupindia.gov.in)
- 📄 Source: Startup India Policy 2024, Page 3
""")
        sources.append("Startup India Policy 2024, Page 3")
        graph_results["entities_found"] = 1
    
    # ===== FALLBACK: Cypher-like query execution =====
    if not context_parts:
        cypher_results = kg.execute_cypher_like_query(query)
        if cypher_results["entities"]:
            context_parts.append(f"🔍 GraphRAG Search Results:\n")
            for entity in cypher_results["entities"][:5]:
                context_parts.append(f"- **{entity['name']}** ({entity['type']})")
            sources.extend(cypher_results["sources"])
            graph_results["entities_found"] = len(cypher_results["entities"])
    
    return "\n".join(context_parts), list(set(sources)), graph_results


def build_context_from_data(query: str) -> tuple[str, list[str], dict]:
    """
    Fallback: Build context from seed data using basic keyword matching.
    Used when Knowledge Graph is unavailable.
    """
    query_lower = query.lower()
    context_parts = []
    sources = []
    data = get_data()
    
    # Check for investor queries
    if any(word in query_lower for word in ["investor", "invest", "fund", "angel", "vc", "venture"]):
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
  Ticket Size: {inv['ticket_size']}
  Source: {inv['source']}
""")
                sources.append(inv['source'])
    
    # Check for scheme queries
    if any(word in query_lower for word in ["scheme", "grant", "government", "subsidy"]):
        state = None
        for s in data["locations"]["states"].keys():
            if s.lower() in query_lower:
                state = s
                break
        
        schemes = get_schemes(state=state)
        if schemes:
            context_parts.append("\nRELEVANT SCHEMES:")
            for scheme in schemes[:5]:
                context_parts.append(f"""
- {scheme['name']}
  Funding: {scheme['funding_amount']}
  Source: {scheme['source']}
""")
                sources.append(scheme['source'])
    
    return "\n".join(context_parts), list(set(sources)), {"method": "fallback_keyword"}


async def chat_with_citations(user_query: str) -> dict:
    """
    Process user query using GraphRAG and return response with citations.
    
    Flow:
    1. Parse query through Knowledge Graph
    2. Build context with entity relationships
    3. Feed to Gemini for natural language response
    4. Include source citations
    """
    # Build context using Knowledge Graph
    context, sources, graph_results = build_context_from_knowledge_graph(user_query)
    
    llm = get_llm()
    
    if llm and context:
        # Use Gemini for intelligent response
        try:
            prompt = f"""You are Sahayak, an AI assistant helping Indian startup founders with funding advice.
You have access to a Knowledge Graph that connects Investors, Startups, Government Schemes, and Locations.

The following context was retrieved using GraphRAG (Knowledge Graph + Vector Search):
- Method used: {graph_results.get('method', 'unknown')}
- Entities found: {graph_results.get('entities_found', 0)}
- Relationships traversed: {graph_results.get('relationships_traversed', 0)}

CONTEXT DATA:
{context}

USER QUESTION: {user_query}

INSTRUCTIONS:
1. Provide a helpful, specific answer based on the context
2. ALWAYS cite your sources in the format [Source: Document Name, Page X]
3. If the user asked about a city (like Jaipur), mention that you also checked parent regions
4. Suggest next steps when appropriate
5. If the data doesn't contain relevant information, say so honestly

Answer in a conversational but professional tone:"""

            response = await llm.ainvoke(prompt)
            
            answer = response.content
            
            # Ensure sources are included if not in response
            if sources and "[Source:" not in answer:
                answer += "\n\n**📄 Sources:** " + ", ".join([f"[{s}]" for s in sources[:3]])
            
            return {
                "answer": answer,
                "sources": sources,
                "context_used": True,
                "graph_stats": graph_results
            }
        except Exception as e:
            print(f"Gemini error: {e}")
    
    # Fallback: Rule-based response using the context
    if context:
        fallback_answer = f"""Based on our Knowledge Graph, here's what I found:

{context}

**ℹ️ Note:** This is a direct Knowledge Graph lookup. For more personalized insights, please configure your Gemini API key.

**📄 Sources:** {', '.join([f'[{s}]' for s in sources[:3]]) if sources else 'Local Knowledge Graph'}
"""
        return {
            "answer": fallback_answer,
            "sources": sources,
            "context_used": True,
            "graph_stats": graph_results
        }
    
    return {
        "answer": "I couldn't find specific information about that in our Knowledge Graph. Could you try asking about:\n\n• **Investors** - e.g., 'Find investors in Jaipur' or 'Who invests in AgriTech?'\n• **Schemes** - e.g., 'What grants are available in Tamil Nadu?'\n• **Opportunities** - e.g., 'List active hackathons'",
        "sources": [],
        "context_used": False,
        "graph_stats": {"method": "no_match", "entities_found": 0}
    }


def get_dashboard_insights() -> dict:
    """Generate dashboard insights using Knowledge Graph."""
    data = get_data()
    user = data.get("user_profile", {})
    kg = get_kg()
    
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
    
    # Use Knowledge Graph for matching if available
    matching_investors = []
    if kg:
        location = user.get("location", user.get("state", ""))
        if location:
            location_results = kg.find_investors_in_location(location)
            sector_results = kg.find_investors_in_sector(user.get("sector", ""))
            
            # Intersect location and sector
            location_ids = {i[0].id for i in location_results}
            sector_ids = {i.id for i in sector_results}
            matching_ids = location_ids.intersection(sector_ids)
            
            matching_investors = [kg.get_entity(id) for id in matching_ids if kg.get_entity(id)]
    else:
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
        inv_name = matching_investors[0].name if hasattr(matching_investors[0], 'name') else matching_investors[0]['name']
        actions.append({
            "title": f"Pitch to {inv_name}",
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
        "user_profile": user,
        "knowledge_graph_enabled": kg is not None
    }
