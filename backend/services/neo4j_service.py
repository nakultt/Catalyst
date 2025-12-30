"""
Neo4j Graph Database Integration for GraphRAG.
Connects to Neo4j Aura and syncs seed data as a Knowledge Graph.

Uses UNIQUE node labels (Validator_*) to avoid conflicts with other projects.
"""
from typing import Optional
from config import config
from data_loader import get_data

# Neo4j driver singleton
_driver = None

def get_neo4j_driver():
    """Get or create Neo4j driver."""
    global _driver
    
    if not config.NEO4J_URI:
        return None
    
    if _driver is None:
        try:
            from neo4j import GraphDatabase
            _driver = GraphDatabase.driver(
                config.NEO4J_URI,
                auth=(config.NEO4J_USERNAME, config.NEO4J_PASSWORD)
            )
            # Verify connection
            _driver.verify_connectivity()
            print(f"✅ Connected to Neo4j Aura: {config.NEO4J_URI}")
        except Exception as e:
            print(f"❌ Neo4j connection failed: {e}")
            return None
    
    return _driver


def close_neo4j_driver():
    """Close Neo4j driver on shutdown."""
    global _driver
    if _driver:
        _driver.close()
        _driver = None


def clear_validator_data():
    """Clear all Validator-prefixed nodes (won't affect other projects)."""
    driver = get_neo4j_driver()
    if not driver:
        return False
    
    try:
        with driver.session(database=config.NEO4J_DATABASE) as session:
            # Delete only Validator-prefixed nodes
            session.run("""
                MATCH (n)
                WHERE any(label IN labels(n) WHERE label STARTS WITH 'Validator_')
                DETACH DELETE n
            """)
            print("🗑️ Cleared existing Validator data from Neo4j")
        return True
    except Exception as e:
        print(f"Error clearing data: {e}")
        return False


def sync_to_neo4j(force: bool = False):
    """
    Sync seed data to Neo4j as a Knowledge Graph.
    Creates nodes and relationships with Validator_ prefix.
    
    Args:
        force: If True, clears existing data and re-syncs. If False, skips if data exists.
    
    Graph Schema:
    - Validator_Region (name)
    - Validator_State (name, startup_hub, key_sectors)
    - Validator_City (name)
    - Validator_Sector (name)
    - Validator_Stage (name)
    - Validator_Investor (name, type, ticket_size, investment_thesis, ...)
    - Validator_Scheme (name, type, funding_amount, ...)
    - Validator_Opportunity (name, type, prize, ...)
    
    Relationships:
    - LOCATED_IN (City->State, State->Region)
    - OPERATES_IN (Investor->City/State)
    - INVESTS_IN (Investor->Sector)
    - TARGETS_STAGE (Investor->Stage)
    - OFFERS_SCHEME (State->Scheme)
    """
    driver = get_neo4j_driver()
    if not driver:
        print("⚠️ Neo4j not available, skipping sync")
        return False
    
    # Check if data already exists (skip sync if it does, unless forced)
    try:
        with driver.session(database=config.NEO4J_DATABASE) as session:
            result = session.run("""
                MATCH (n)
                WHERE any(label IN labels(n) WHERE label STARTS WITH 'Validator_')
                RETURN count(n) as count
            """)
            existing_count = result.single()["count"]
            
            if existing_count > 0 and not force:
                print(f"✅ Neo4j already has {existing_count} nodes. Skipping sync (use force=True to re-sync)")
                return True
    except Exception as e:
        print(f"Error checking existing data: {e}")
    
    data = get_data()
    
    try:
        with driver.session(database=config.NEO4J_DATABASE) as session:
            # Clear existing Validator data first
            clear_validator_data()
            
            # ===== 1. Create Regions =====
            regions = ["South India", "North India", "West India", "East India", "Central India"]
            for region in regions:
                session.run("""
                    CREATE (r:Validator_Region {name: $name})
                """, name=region)
            print(f"✅ Created {len(regions)} regions")
            
            # ===== 2. Create States and connect to Regions =====
            for state_name, state_data in data.get("locations", {}).get("states", {}).items():
                session.run("""
                    MATCH (r:Validator_Region {name: $region})
                    CREATE (s:Validator_State {
                        name: $name,
                        startup_hub: $startup_hub,
                        key_sectors: $key_sectors
                    })
                    CREATE (s)-[:LOCATED_IN]->(r)
                """, 
                    name=state_name,
                    region=state_data.get("region", ""),
                    startup_hub=state_data.get("startup_hub", ""),
                    key_sectors=state_data.get("key_sectors", [])
                )
                
                # Create Cities for each state
                for city in state_data.get("cities", []):
                    session.run("""
                        MATCH (s:Validator_State {name: $state})
                        CREATE (c:Validator_City {name: $name})
                        CREATE (c)-[:LOCATED_IN]->(s)
                    """, name=city, state=state_name)
            
            print(f"✅ Created states and cities with LOCATED_IN hierarchy")
            
            # ===== 3. Create Sectors =====
            all_sectors = set()
            for inv in data.get("investors", []):
                all_sectors.update(inv.get("sectors", []))
            
            for sector in all_sectors:
                session.run("""
                    CREATE (s:Validator_Sector {name: $name})
                """, name=sector)
            print(f"✅ Created {len(all_sectors)} sectors")
            
            # ===== 4. Create Stages =====
            stages = ["Pre-Seed", "Seed", "Series A", "Series B", "Growth", "Idea", "MVP", "Revenue"]
            for stage in stages:
                session.run("""
                    CREATE (s:Validator_Stage {name: $name})
                """, name=stage)
            print(f"✅ Created {len(stages)} stages")
            
            # ===== 5. Create Investors with relationships =====
            for inv in data.get("investors", []):
                # Create investor node
                session.run("""
                    CREATE (i:Validator_Investor {
                        id: $id,
                        name: $name,
                        type: $type,
                        ticket_size: $ticket_size,
                        investment_thesis: $investment_thesis,
                        contact_email: $contact_email,
                        source: $source,
                        portfolio_companies: $portfolio
                    })
                """,
                    id=inv["id"],
                    name=inv["name"],
                    type=inv.get("type", ""),
                    ticket_size=inv.get("ticket_size", ""),
                    investment_thesis=inv.get("investment_thesis", ""),
                    contact_email=inv.get("contact_email", ""),
                    source=inv.get("source", ""),
                    portfolio=inv.get("portfolio_companies", [])
                )
                
                # Connect to City (OPERATES_IN)
                if inv.get("location"):
                    session.run("""
                        MATCH (i:Validator_Investor {id: $inv_id})
                        MATCH (c:Validator_City {name: $city})
                        CREATE (i)-[:OPERATES_IN]->(c)
                    """, inv_id=inv["id"], city=inv["location"])
                
                # Connect to State (OPERATES_IN)
                if inv.get("state"):
                    session.run("""
                        MATCH (i:Validator_Investor {id: $inv_id})
                        MATCH (s:Validator_State {name: $state})
                        CREATE (i)-[:OPERATES_IN]->(s)
                    """, inv_id=inv["id"], state=inv["state"])
                
                # Connect to Sectors (INVESTS_IN)
                for sector in inv.get("sectors", []):
                    session.run("""
                        MATCH (i:Validator_Investor {id: $inv_id})
                        MATCH (s:Validator_Sector {name: $sector})
                        CREATE (i)-[:INVESTS_IN]->(s)
                    """, inv_id=inv["id"], sector=sector)
                
                # Connect to Stages (TARGETS_STAGE)
                for stage in inv.get("stage", []):
                    session.run("""
                        MATCH (i:Validator_Investor {id: $inv_id})
                        MATCH (s:Validator_Stage {name: $stage})
                        CREATE (i)-[:TARGETS_STAGE]->(s)
                    """, inv_id=inv["id"], stage=stage)
            
            print(f"✅ Created {len(data.get('investors', []))} investors with relationships")
            
            # ===== 6. Create Schemes with relationships =====
            for scheme in data.get("schemes", []):
                session.run("""
                    CREATE (s:Validator_Scheme {
                        id: $id,
                        name: $name,
                        type: $type,
                        department: $department,
                        funding_amount: $funding_amount,
                        application_process: $application_process,
                        link: $link,
                        source: $source
                    })
                """,
                    id=scheme["id"],
                    name=scheme["name"],
                    type=scheme.get("type", ""),
                    department=scheme.get("department", ""),
                    funding_amount=scheme.get("funding_amount", ""),
                    application_process=scheme.get("application_process", ""),
                    link=scheme.get("link", ""),
                    source=scheme.get("source", "")
                )
                
                # Connect state-specific schemes
                if scheme.get("state"):
                    session.run("""
                        MATCH (state:Validator_State {name: $state})
                        MATCH (scheme:Validator_Scheme {id: $scheme_id})
                        CREATE (state)-[:OFFERS_SCHEME]->(scheme)
                    """, state=scheme["state"], scheme_id=scheme["id"])
            
            print(f"✅ Created {len(data.get('schemes', []))} schemes")
            
            # ===== 7. Create Opportunities =====
            for opp in data.get("opportunities", []):
                session.run("""
                    CREATE (o:Validator_Opportunity {
                        id: $id,
                        name: $name,
                        type: $type,
                        organizer: $organizer,
                        prize: $prize,
                        deadline: $deadline,
                        link: $link,
                        source: $source,
                        benefits: $benefits
                    })
                """,
                    id=opp["id"],
                    name=opp["name"],
                    type=opp.get("type", ""),
                    organizer=opp.get("organizer", ""),
                    prize=opp.get("prize", ""),
                    deadline=opp.get("deadline", ""),
                    link=opp.get("link", ""),
                    source=opp.get("source", ""),
                    benefits=opp.get("benefits", [])
                )
            
            print(f"✅ Created {len(data.get('opportunities', []))} opportunities")
            
            # Get final count
            result = session.run("""
                MATCH (n)
                WHERE any(label IN labels(n) WHERE label STARTS WITH 'Validator_')
                RETURN count(n) as node_count
            """)
            node_count = result.single()["node_count"]
            
            result = session.run("""
                MATCH (n)-[r]->(m)
                WHERE any(label IN labels(n) WHERE label STARTS WITH 'Validator_')
                RETURN count(r) as rel_count
            """)
            rel_count = result.single()["rel_count"]
            
            print(f"\n🎉 Neo4j sync complete: {node_count} nodes, {rel_count} relationships")
            return True
            
    except Exception as e:
        print(f"❌ Error syncing to Neo4j: {e}")
        return False


def query_neo4j(cypher: str, params: dict = None) -> list:
    """Execute a Cypher query and return results."""
    driver = get_neo4j_driver()
    if not driver:
        return []
    
    try:
        with driver.session(database=config.NEO4J_DATABASE) as session:
            result = session.run(cypher, params or {})
            return [dict(record) for record in result]
    except Exception as e:
        print(f"Query error: {e}")
        return []


def find_investors_in_location_neo4j(location_name: str) -> list:
    """
    Find investors in a location using Neo4j graph traversal.
    Automatically handles location hierarchy (City -> State -> Region).
    
    Example: "Jaipur" will find investors in Jaipur AND Rajasthan.
    """
    cypher = """
        // Find the location (could be city, state, or region)
        MATCH (loc)
        WHERE (loc:Validator_City OR loc:Validator_State OR loc:Validator_Region)
          AND toLower(loc.name) CONTAINS toLower($location)
        
        // Traverse up the location hierarchy
        OPTIONAL MATCH path = (loc)-[:LOCATED_IN*0..2]->(parent)
        
        WITH collect(DISTINCT loc) + collect(DISTINCT parent) AS all_locations
        UNWIND all_locations AS location
        
        // Find investors operating in any of these locations
        MATCH (i:Validator_Investor)-[:OPERATES_IN]->(location)
        
        RETURN DISTINCT i.name AS name,
               i.type AS type,
               i.ticket_size AS ticket_size,
               i.investment_thesis AS thesis,
               i.contact_email AS email,
               i.source AS source,
               location.name AS matched_location
    """
    
    return query_neo4j(cypher, {"location": location_name})


def find_investors_in_sector_neo4j(sector_name: str) -> list:
    """Find investors that invest in a specific sector."""
    cypher = """
        MATCH (i:Validator_Investor)-[:INVESTS_IN]->(s:Validator_Sector)
        WHERE toLower(s.name) CONTAINS toLower($sector)
        RETURN DISTINCT i.name AS name,
               i.type AS type,
               i.ticket_size AS ticket_size,
               i.source AS source,
               collect(s.name) AS sectors
    """
    
    return query_neo4j(cypher, {"sector": sector_name})


def find_schemes_in_state_neo4j(state_name: str) -> list:
    """
    Find schemes available in a state.
    Includes both state-specific and central government schemes.
    """
    cypher = """
        // State-specific schemes
        MATCH (state:Validator_State)-[:OFFERS_SCHEME]->(scheme:Validator_Scheme)
        WHERE toLower(state.name) CONTAINS toLower($state)
        
        RETURN scheme.name AS name,
               scheme.type AS type,
               scheme.funding_amount AS funding,
               scheme.source AS source,
               state.name AS available_in
        
        UNION
        
        // Central government schemes (available everywhere)
        MATCH (scheme:Validator_Scheme)
        WHERE scheme.type = 'Central Government'
        RETURN scheme.name AS name,
               scheme.type AS type,
               scheme.funding_amount AS funding,
               scheme.source AS source,
               'All India' AS available_in
    """
    
    return query_neo4j(cypher, {"state": state_name})


def get_graph_stats_neo4j() -> dict:
    """Get statistics about the Neo4j graph."""
    driver = get_neo4j_driver()
    if not driver:
        return {"connected": False}
    
    try:
        with driver.session(database=config.NEO4J_DATABASE) as session:
            # Count nodes by label
            result = session.run("""
                MATCH (n)
                WHERE any(label IN labels(n) WHERE label STARTS WITH 'Validator_')
                WITH labels(n) AS nodeLabels
                UNWIND nodeLabels AS label
                WHERE label STARTS WITH 'Validator_'
                RETURN label, count(*) AS count
                ORDER BY count DESC
            """)
            nodes_by_label = {record["label"]: record["count"] for record in result}
            
            # Count relationships
            result = session.run("""
                MATCH (n)-[r]->(m)
                WHERE any(label IN labels(n) WHERE label STARTS WITH 'Validator_')
                RETURN type(r) AS type, count(*) AS count
                ORDER BY count DESC
            """)
            rels_by_type = {record["type"]: record["count"] for record in result}
            
            return {
                "connected": True,
                "uri": config.NEO4J_URI,
                "nodes_by_label": nodes_by_label,
                "relationships_by_type": rels_by_type,
                "total_nodes": sum(nodes_by_label.values()),
                "total_relationships": sum(rels_by_type.values())
            }
    except Exception as e:
        return {"connected": False, "error": str(e)}
