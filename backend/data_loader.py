"""
Utility to load and query seed data from JSON file.
This module provides a graph-like interface to the seed data,
structured for easy migration to Neo4j in the future.
"""
import json
from pathlib import Path
from typing import Optional

# Load seed data
SEED_DATA_PATH = Path(__file__).parent / "seed_data.json"

def load_seed_data() -> dict:
    """Load seed data from JSON file."""
    with open(SEED_DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

# Cache the data
_data_cache: Optional[dict] = None

def get_data() -> dict:
    """Get cached seed data."""
    global _data_cache
    if _data_cache is None:
        _data_cache = load_seed_data()
    return _data_cache

def get_investors(sector: Optional[str] = None, state: Optional[str] = None, stage: Optional[str] = None) -> list:
    """
    Query investors with optional filters.
    Mimics graph query: MATCH (i:Investor) WHERE i.sector = $sector RETURN i
    """
    data = get_data()
    investors = data.get("investors", [])
    
    results = []
    for inv in investors:
        match = True
        
        if sector and sector.lower() not in [s.lower() for s in inv.get("sectors", [])]:
            match = False
        if state and inv.get("state", "").lower() != state.lower():
            match = False
        if stage and stage.lower() not in [s.lower() for s in inv.get("stage", [])]:
            match = False
            
        if match:
            results.append(inv)
    
    return results

def get_schemes(state: Optional[str] = None, stage: Optional[str] = None) -> list:
    """Query government schemes with optional filters."""
    data = get_data()
    schemes = data.get("schemes", [])
    
    results = []
    for scheme in schemes:
        match = True
        
        if state:
            scheme_state = scheme.get("state", "")
            if scheme_state and scheme_state.lower() != state.lower():
                match = False
        
        if stage:
            eligibility = scheme.get("eligibility", {})
            stages = eligibility.get("stage", [])
            if stages and stage.lower() not in [s.lower() for s in stages]:
                match = False
        
        if match:
            results.append(scheme)
    
    return results

def get_opportunities(sector: Optional[str] = None, opp_type: Optional[str] = None) -> list:
    """Query opportunities (hackathons, grants) with optional filters."""
    data = get_data()
    opportunities = data.get("opportunities", [])
    
    results = []
    for opp in opportunities:
        match = True
        
        if sector:
            opp_sectors = opp.get("eligibility", {}).get("sectors", [])
            if opp_sectors and sector.lower() not in [s.lower() for s in opp_sectors]:
                match = False
        
        if opp_type and opp.get("type", "").lower() != opp_type.lower():
            match = False
        
        if match:
            results.append(opp)
    
    return results

def get_funding_route(stage: str) -> list:
    """Get funding route based on startup stage."""
    data = get_data()
    routes = data.get("funding_routes", {})
    
    stage_key = f"{stage.lower()}_stage"
    return routes.get(stage_key, routes.get("idea_stage", []))

def get_user_profile() -> dict:
    """Get demo user profile."""
    data = get_data()
    return data.get("user_profile", {})

def get_location_info(state: str) -> dict:
    """Get location information for a state."""
    data = get_data()
    locations = data.get("locations", {}).get("states", {})
    return locations.get(state, {})

def search_all(query: str) -> dict:
    """
    Full-text search across all entities.
    Returns categorized results with source citations.
    """
    query_lower = query.lower()
    data = get_data()
    
    results = {
        "investors": [],
        "schemes": [],
        "opportunities": [],
        "sources": []
    }
    
    # Search investors
    for inv in data.get("investors", []):
        searchable = f"{inv['name']} {inv['location']} {inv['state']} {' '.join(inv['sectors'])} {inv.get('investment_thesis', '')}".lower()
        if query_lower in searchable:
            results["investors"].append(inv)
            results["sources"].append(f"[Source: {inv.get('source', 'Database')}]")
    
    # Search schemes
    for scheme in data.get("schemes", []):
        searchable = f"{scheme['name']} {scheme.get('state', '')} {scheme['department']}".lower()
        if query_lower in searchable:
            results["schemes"].append(scheme)
            results["sources"].append(f"[Source: {scheme.get('source', 'Policy Document')}]")
    
    # Search opportunities
    for opp in data.get("opportunities", []):
        searchable = f"{opp['name']} {opp['organizer']} {opp['type']}".lower()
        if query_lower in searchable:
            results["opportunities"].append(opp)
            results["sources"].append(f"[Source: {opp.get('source', 'Events Calendar')}]")
    
    return results
