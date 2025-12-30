"""
Route generator service for Visual Funding Navigator.
Generates step-by-step funding roadmaps based on startup profile.
"""
from typing import Optional
from data_loader import get_data, get_investors, get_schemes, get_opportunities

def generate_funding_route(
    stage: str,
    sector: str,
    location: str
) -> dict:
    """
    Generate a visual funding route based on startup parameters.
    Returns nodes and edges for React Flow visualization.
    """
    data = get_data()
    nodes = []
    edges = []
    
    # Normalize inputs
    stage_lower = stage.lower()
    sector_lower = sector.lower()
    
    # Find state from location
    state = None
    for state_name, state_data in data["locations"]["states"].items():
        if location.lower() in [c.lower() for c in state_data["cities"]] or location.lower() == state_name.lower():
            state = state_name
            break
    
    # Node position tracking
    x_pos = 0
    y_center = 200
    node_spacing = 250
    
    # Start node
    nodes.append({
        "id": "start",
        "type": "input",
        "data": {"label": f"🚀 Start: {stage.title()} Stage"},
        "position": {"x": x_pos, "y": y_center},
        "style": {"background": "#4F46E5", "color": "white", "border": "none", "borderRadius": "8px", "padding": "10px"}
    })
    
    last_node_id = "start"
    step_count = 0
    
    # Step 1: DPIIT Registration (if idea/early stage)
    if stage_lower in ["idea", "validation", "prototype", "mvp"]:
        step_count += 1
        x_pos += node_spacing
        node_id = f"step_{step_count}"
        nodes.append({
            "id": node_id,
            "data": {"label": "📋 DPIIT Recognition\nGet official startup status"},
            "position": {"x": x_pos, "y": y_center},
            "style": {"background": "#10B981", "color": "white", "border": "none", "borderRadius": "8px", "padding": "10px", "width": 180}
        })
        edges.append({
            "id": f"e-{last_node_id}-{node_id}",
            "source": last_node_id,
            "target": node_id,
            "animated": True,
            "style": {"stroke": "#6366F1"}
        })
        last_node_id = node_id
    
    # Step 2: State-specific scheme
    state_schemes = get_schemes(state=state, stage=stage)
    if state_schemes:
        step_count += 1
        x_pos += node_spacing
        scheme = state_schemes[0]
        node_id = f"step_{step_count}"
        nodes.append({
            "id": node_id,
            "data": {"label": f"💰 {scheme['name']}\n{scheme['funding_amount'][:30]}..."},
            "position": {"x": x_pos, "y": y_center - 80},
            "style": {"background": "#F59E0B", "color": "white", "border": "none", "borderRadius": "8px", "padding": "10px", "width": 200}
        })
        edges.append({
            "id": f"e-{last_node_id}-{node_id}",
            "source": last_node_id,
            "target": node_id,
            "animated": True,
            "style": {"stroke": "#6366F1"}
        })
        last_node_id = node_id
    
    # Step 3: Central government scheme
    central_schemes = [s for s in get_schemes() if s.get("type") == "Central Government"]
    if central_schemes:
        step_count += 1
        x_pos += node_spacing
        scheme = central_schemes[0]
        node_id = f"step_{step_count}"
        nodes.append({
            "id": node_id,
            "data": {"label": f"🏛️ {scheme['name'][:25]}...\n{scheme['funding_amount'][:25]}..."},
            "position": {"x": x_pos, "y": y_center + 80},
            "style": {"background": "#8B5CF6", "color": "white", "border": "none", "borderRadius": "8px", "padding": "10px", "width": 200}
        })
        edges.append({
            "id": f"e-{last_node_id}-{node_id}",
            "source": last_node_id,
            "target": node_id,
            "animated": True,
            "style": {"stroke": "#6366F1"}
        })
        last_node_id = node_id
    
    # Step 4: Local investors
    local_investors = get_investors(sector=sector, state=state)
    if not local_investors:
        local_investors = get_investors(sector=sector)
    
    if local_investors:
        step_count += 1
        x_pos += node_spacing
        investor = local_investors[0]
        node_id = f"step_{step_count}"
        nodes.append({
            "id": node_id,
            "data": {"label": f"👼 {investor['name']}\n{investor['ticket_size']}"},
            "position": {"x": x_pos, "y": y_center},
            "style": {"background": "#EC4899", "color": "white", "border": "none", "borderRadius": "8px", "padding": "10px", "width": 180}
        })
        edges.append({
            "id": f"e-{last_node_id}-{node_id}",
            "source": last_node_id,
            "target": node_id,
            "animated": True,
            "style": {"stroke": "#6366F1"}
        })
        last_node_id = node_id
    
    # Step 5: Accelerator/Opportunity
    opportunities = get_opportunities(sector=sector)
    if opportunities:
        step_count += 1
        x_pos += node_spacing
        opp = opportunities[0]
        node_id = f"step_{step_count}"
        nodes.append({
            "id": node_id,
            "data": {"label": f"🎯 {opp['name'][:20]}...\n{opp['prize'][:25]}..."},
            "position": {"x": x_pos, "y": y_center - 60},
            "style": {"background": "#06B6D4", "color": "white", "border": "none", "borderRadius": "8px", "padding": "10px", "width": 200}
        })
        edges.append({
            "id": f"e-{last_node_id}-{node_id}",
            "source": last_node_id,
            "target": node_id,
            "animated": True,
            "style": {"stroke": "#6366F1"}
        })
        last_node_id = node_id
    
    # End node: Success
    step_count += 1
    x_pos += node_spacing
    nodes.append({
        "id": "success",
        "type": "output",
        "data": {"label": "🎉 Funded!\nReady for Growth"},
        "position": {"x": x_pos, "y": y_center},
        "style": {"background": "#22C55E", "color": "white", "border": "none", "borderRadius": "8px", "padding": "10px"}
    })
    edges.append({
        "id": f"e-{last_node_id}-success",
        "source": last_node_id,
        "target": "success",
        "animated": True,
        "style": {"stroke": "#22C55E"}
    })
    
    # Generate AI-powered summary if available
    ai_summary = None
    try:
        from services.langchain_service import get_llm
        llm = get_llm()
        if llm:
            import asyncio
            # Create prompt for AI insights
            prompt = f"""You are a startup funding advisor. A {sector} startup at {stage} stage in {location} is looking for funding.

Based on the following route steps, provide a 2-3 sentence personalized summary with specific actionable advice:

Steps in their journey:
{chr(10).join([f"- {n['data']['label']}" for n in nodes])}

Keep it concise, specific, and encouraging. Focus on what they should prioritize first."""

            # Run async in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                response = loop.run_until_complete(llm.ainvoke(prompt))
                ai_summary = response.content
            finally:
                loop.close()
    except Exception as e:
        print(f"AI summary generation failed: {e}")
    
    return {
        "nodes": nodes,
        "edges": edges,
        "summary": ai_summary or f"Generated {len(nodes)} step funding route for {sector} startup in {location}. Follow the steps in order for the best results.",
        "ai_powered": ai_summary is not None
    }
