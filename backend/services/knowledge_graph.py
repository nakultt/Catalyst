"""
GraphRAG Knowledge Engine - The Brain
A Knowledge Graph combined with Vector Search for intelligent relationship inference.

Key Features:
- Entity extraction (Investors, Startups, Schemes, States, Cities)
- Relationship mapping (INVESTED_IN, LOCATED_IN, OFFERS_SCHEME, MENTORED_BY)
- Transitive inference (Jaipur → Rajasthan → North India)
- Citation-aware responses

Designed to be Neo4j-compatible for production scaling.
"""
from typing import Optional
from dataclasses import dataclass
from enum import Enum

class EntityType(Enum):
    INVESTOR = "investor"
    SCHEME = "scheme"
    OPPORTUNITY = "opportunity"
    STATE = "state"
    CITY = "city"
    REGION = "region"
    SECTOR = "sector"
    STAGE = "stage"

class RelationType(Enum):
    LOCATED_IN = "LOCATED_IN"           # City -> State, State -> Region
    INVESTS_IN = "INVESTS_IN"           # Investor -> Sector
    OPERATES_IN = "OPERATES_IN"         # Investor -> State/City
    OFFERS_SCHEME = "OFFERS_SCHEME"     # State/Government -> Scheme
    TARGETS_STAGE = "TARGETS_STAGE"     # Investor/Scheme -> Stage
    APPLIES_TO = "APPLIES_TO"           # Scheme -> Sector

@dataclass
class Entity:
    """Represents a node in the knowledge graph."""
    id: str
    entity_type: EntityType
    name: str
    properties: dict

@dataclass
class Relationship:
    """Represents an edge in the knowledge graph."""
    source_id: str
    target_id: str
    relation_type: RelationType
    properties: dict = None

class KnowledgeGraph:
    """
    In-memory Knowledge Graph implementation.
    Structured for easy migration to Neo4j.
    
    Neo4j equivalent would be:
    CREATE (n:Investor {name: 'Kongu Angels', ...})
    CREATE (n)-[:LOCATED_IN]->(m:State {name: 'Tamil Nadu'})
    """
    
    def __init__(self):
        self.entities: dict[str, Entity] = {}
        self.relationships: list[Relationship] = []
        self._build_graph()
    
    def _build_graph(self):
        """Build knowledge graph from seed data."""
        from data_loader import get_data
        data = get_data()
        
        # ===== Create Region Entities =====
        regions = ["South India", "North India", "West India", "East India", "Central India"]
        for region in regions:
            self._add_entity(Entity(
                id=f"region_{region.lower().replace(' ', '_')}",
                entity_type=EntityType.REGION,
                name=region,
                properties={}
            ))
        
        # ===== Create State Entities and Location Relationships =====
        for state_name, state_data in data.get("locations", {}).get("states", {}).items():
            state_id = f"state_{state_name.lower().replace(' ', '_')}"
            self._add_entity(Entity(
                id=state_id,
                entity_type=EntityType.STATE,
                name=state_name,
                properties={
                    "startup_hub": state_data.get("startup_hub", ""),
                    "key_sectors": state_data.get("key_sectors", [])
                }
            ))
            
            # State LOCATED_IN Region
            region = state_data.get("region", "")
            if region:
                region_id = f"region_{region.lower().replace(' ', '_')}"
                self._add_relationship(Relationship(
                    source_id=state_id,
                    target_id=region_id,
                    relation_type=RelationType.LOCATED_IN
                ))
            
            # Create City Entities
            for city in state_data.get("cities", []):
                city_id = f"city_{city.lower().replace(' ', '_')}"
                self._add_entity(Entity(
                    id=city_id,
                    entity_type=EntityType.CITY,
                    name=city,
                    properties={"state": state_name}
                ))
                
                # City LOCATED_IN State
                self._add_relationship(Relationship(
                    source_id=city_id,
                    target_id=state_id,
                    relation_type=RelationType.LOCATED_IN
                ))
        
        # ===== Create Sector Entities =====
        all_sectors = set()
        for inv in data.get("investors", []):
            all_sectors.update(inv.get("sectors", []))
        for sector in all_sectors:
            self._add_entity(Entity(
                id=f"sector_{sector.lower().replace(' ', '_').replace('/', '_')}",
                entity_type=EntityType.SECTOR,
                name=sector,
                properties={}
            ))
        
        # ===== Create Stage Entities =====
        stages = ["Pre-Seed", "Seed", "Series A", "Series B", "Growth", "Idea", "MVP", "Revenue"]
        for stage in stages:
            self._add_entity(Entity(
                id=f"stage_{stage.lower().replace(' ', '_').replace('-', '_')}",
                entity_type=EntityType.STAGE,
                name=stage,
                properties={}
            ))
        
        # ===== Create Investor Entities and Relationships =====
        for inv in data.get("investors", []):
            inv_id = f"investor_{inv['id']}"
            self._add_entity(Entity(
                id=inv_id,
                entity_type=EntityType.INVESTOR,
                name=inv["name"],
                properties={
                    "type": inv.get("type", ""),
                    "ticket_size": inv.get("ticket_size", ""),
                    "investment_thesis": inv.get("investment_thesis", ""),
                    "contact_email": inv.get("contact_email", ""),
                    "source": inv.get("source", ""),
                    "portfolio_companies": inv.get("portfolio_companies", [])
                }
            ))
            
            # Investor OPERATES_IN City
            city = inv.get("location", "")
            if city:
                city_id = f"city_{city.lower().replace(' ', '_')}"
                if city_id in self.entities:
                    self._add_relationship(Relationship(
                        source_id=inv_id,
                        target_id=city_id,
                        relation_type=RelationType.OPERATES_IN
                    ))
            
            # Investor OPERATES_IN State
            state = inv.get("state", "")
            if state:
                state_id = f"state_{state.lower().replace(' ', '_')}"
                if state_id in self.entities:
                    self._add_relationship(Relationship(
                        source_id=inv_id,
                        target_id=state_id,
                        relation_type=RelationType.OPERATES_IN
                    ))
            
            # Investor INVESTS_IN Sectors
            for sector in inv.get("sectors", []):
                sector_id = f"sector_{sector.lower().replace(' ', '_').replace('/', '_')}"
                if sector_id in self.entities:
                    self._add_relationship(Relationship(
                        source_id=inv_id,
                        target_id=sector_id,
                        relation_type=RelationType.INVESTS_IN
                    ))
            
            # Investor TARGETS_STAGE Stages
            for stage in inv.get("stage", []):
                stage_id = f"stage_{stage.lower().replace(' ', '_').replace('-', '_')}"
                if stage_id in self.entities:
                    self._add_relationship(Relationship(
                        source_id=inv_id,
                        target_id=stage_id,
                        relation_type=RelationType.TARGETS_STAGE
                    ))
        
        # ===== Create Scheme Entities and Relationships =====
        for scheme in data.get("schemes", []):
            scheme_id = f"scheme_{scheme['id']}"
            self._add_entity(Entity(
                id=scheme_id,
                entity_type=EntityType.SCHEME,
                name=scheme["name"],
                properties={
                    "type": scheme.get("type", ""),
                    "department": scheme.get("department", ""),
                    "funding_amount": scheme.get("funding_amount", ""),
                    "eligibility": scheme.get("eligibility", {}),
                    "application_process": scheme.get("application_process", ""),
                    "link": scheme.get("link", ""),
                    "source": scheme.get("source", "")
                }
            ))
            
            # Scheme offered by State (if state-specific)
            state = scheme.get("state", "")
            if state:
                state_id = f"state_{state.lower().replace(' ', '_')}"
                if state_id in self.entities:
                    self._add_relationship(Relationship(
                        source_id=state_id,
                        target_id=scheme_id,
                        relation_type=RelationType.OFFERS_SCHEME
                    ))
        
        # ===== Create Opportunity Entities =====
        for opp in data.get("opportunities", []):
            opp_id = f"opportunity_{opp['id']}"
            self._add_entity(Entity(
                id=opp_id,
                entity_type=EntityType.OPPORTUNITY,
                name=opp["name"],
                properties={
                    "type": opp.get("type", ""),
                    "organizer": opp.get("organizer", ""),
                    "prize": opp.get("prize", ""),
                    "deadline": opp.get("deadline", ""),
                    "eligibility": opp.get("eligibility", {}),
                    "benefits": opp.get("benefits", []),
                    "link": opp.get("link", ""),
                    "source": opp.get("source", "")
                }
            ))
    
    def _add_entity(self, entity: Entity):
        """Add entity to graph."""
        self.entities[entity.id] = entity
    
    def _add_relationship(self, relationship: Relationship):
        """Add relationship to graph."""
        self.relationships.append(relationship)
    
    def get_entity(self, entity_id: str) -> Optional[Entity]:
        """Get entity by ID."""
        return self.entities.get(entity_id)
    
    def find_entities_by_type(self, entity_type: EntityType) -> list[Entity]:
        """Find all entities of a given type."""
        return [e for e in self.entities.values() if e.entity_type == entity_type]
    
    def find_entities_by_name(self, name: str, fuzzy: bool = True) -> list[Entity]:
        """Find entities by name (case-insensitive, optionally fuzzy)."""
        name_lower = name.lower()
        results = []
        for entity in self.entities.values():
            if fuzzy:
                if name_lower in entity.name.lower() or entity.name.lower() in name_lower:
                    results.append(entity)
            else:
                if entity.name.lower() == name_lower:
                    results.append(entity)
        return results
    
    def get_outgoing_relationships(self, entity_id: str, relation_type: Optional[RelationType] = None) -> list[Relationship]:
        """Get all outgoing relationships from an entity."""
        results = []
        for rel in self.relationships:
            if rel.source_id == entity_id:
                if relation_type is None or rel.relation_type == relation_type:
                    results.append(rel)
        return results
    
    def get_incoming_relationships(self, entity_id: str, relation_type: Optional[RelationType] = None) -> list[Relationship]:
        """Get all incoming relationships to an entity."""
        results = []
        for rel in self.relationships:
            if rel.target_id == entity_id:
                if relation_type is None or rel.relation_type == relation_type:
                    results.append(rel)
        return results
    
    def traverse_location_hierarchy(self, entity_id: str) -> list[Entity]:
        """
        Traverse LOCATED_IN relationships upward.
        Example: Jaipur -> Rajasthan -> North India
        
        This enables: "Find investors in Jaipur" to also find investors in Rajasthan.
        """
        result = []
        visited = set()
        stack = [entity_id]
        
        while stack:
            current_id = stack.pop()
            if current_id in visited:
                continue
            visited.add(current_id)
            
            entity = self.get_entity(current_id)
            if entity:
                result.append(entity)
            
            # Follow LOCATED_IN relationships upward
            for rel in self.get_outgoing_relationships(current_id, RelationType.LOCATED_IN):
                if rel.target_id not in visited:
                    stack.append(rel.target_id)
        
        return result
    
    def find_investors_in_location(self, location_name: str) -> list[tuple[Entity, str]]:
        """
        Find all investors that operate in a location, including parent locations.
        Returns list of (investor_entity, matched_location) tuples.
        
        Example: find_investors_in_location("Jaipur")
        Will return investors in Jaipur AND investors in Rajasthan (parent state).
        """
        results = []
        
        # Find the location entity
        location_entities = self.find_entities_by_name(location_name)
        if not location_entities:
            return results
        
        # For each matching location, get full hierarchy
        all_location_ids = set()
        for loc_entity in location_entities:
            hierarchy = self.traverse_location_hierarchy(loc_entity.id)
            for entity in hierarchy:
                all_location_ids.add(entity.id)
        
        # Find investors that OPERATES_IN any of these locations
        for investor in self.find_entities_by_type(EntityType.INVESTOR):
            for rel in self.get_outgoing_relationships(investor.id, RelationType.OPERATES_IN):
                if rel.target_id in all_location_ids:
                    target_entity = self.get_entity(rel.target_id)
                    matched_location = target_entity.name if target_entity else "Unknown"
                    results.append((investor, matched_location))
                    break  # Don't add same investor twice
        
        return results
    
    def find_investors_in_sector(self, sector_name: str) -> list[Entity]:
        """Find all investors that invest in a given sector."""
        results = []
        sector_entities = self.find_entities_by_name(sector_name)
        if not sector_entities:
            return results
        
        sector_ids = {e.id for e in sector_entities if e.entity_type == EntityType.SECTOR}
        
        for investor in self.find_entities_by_type(EntityType.INVESTOR):
            for rel in self.get_outgoing_relationships(investor.id, RelationType.INVESTS_IN):
                if rel.target_id in sector_ids:
                    results.append(investor)
                    break
        
        return results
    
    def find_schemes_in_state(self, state_name: str) -> list[Entity]:
        """Find all schemes offered in a state (including central schemes)."""
        results = []
        
        # Get state-specific schemes
        state_entities = self.find_entities_by_name(state_name)
        for state_entity in state_entities:
            if state_entity.entity_type == EntityType.STATE:
                for rel in self.get_outgoing_relationships(state_entity.id, RelationType.OFFERS_SCHEME):
                    scheme = self.get_entity(rel.target_id)
                    if scheme:
                        results.append(scheme)
        
        # Also add central government schemes (available everywhere)
        for scheme in self.find_entities_by_type(EntityType.SCHEME):
            if scheme.properties.get("type") == "Central Government":
                if scheme not in results:
                    results.append(scheme)
        
        return results
    
    def execute_cypher_like_query(self, query: str) -> dict:
        """
        Execute a Cypher-like query string.
        Supports basic patterns for demo purposes.
        
        In production with Neo4j:
        MATCH (i:Investor)-[:OPERATES_IN]->(c:City {name: 'Jaipur'})
        RETURN i
        """
        query_lower = query.lower()
        results = {"entities": [], "sources": []}
        
        # Pattern: investors in [location]
        if "investor" in query_lower:
            location = None
            sector = None
            
            # Extract location
            for entity in self.entities.values():
                if entity.entity_type in [EntityType.CITY, EntityType.STATE, EntityType.REGION]:
                    if entity.name.lower() in query_lower:
                        location = entity.name
                        break
            
            # Extract sector
            for entity in self.entities.values():
                if entity.entity_type == EntityType.SECTOR:
                    if entity.name.lower() in query_lower:
                        sector = entity.name
                        break
            
            # Find matching investors
            investors = []
            if location and sector:
                # Both location and sector specified
                location_investors = {i[0].id for i in self.find_investors_in_location(location)}
                sector_investors = {i.id for i in self.find_investors_in_sector(sector)}
                matching_ids = location_investors.intersection(sector_investors)
                investors = [self.get_entity(id) for id in matching_ids if self.get_entity(id)]
            elif location:
                investors = [i[0] for i in self.find_investors_in_location(location)]
            elif sector:
                investors = self.find_investors_in_sector(sector)
            else:
                investors = self.find_entities_by_type(EntityType.INVESTOR)
            
            for inv in investors:
                results["entities"].append({
                    "type": "investor",
                    "name": inv.name,
                    "properties": inv.properties
                })
                if inv.properties.get("source"):
                    results["sources"].append(inv.properties["source"])
        
        # Pattern: schemes in [state]
        elif "scheme" in query_lower or "grant" in query_lower or "fund" in query_lower:
            state = None
            for entity in self.entities.values():
                if entity.entity_type == EntityType.STATE:
                    if entity.name.lower() in query_lower:
                        state = entity.name
                        break
            
            if state:
                schemes = self.find_schemes_in_state(state)
            else:
                schemes = self.find_entities_by_type(EntityType.SCHEME)
            
            for scheme in schemes:
                results["entities"].append({
                    "type": "scheme",
                    "name": scheme.name,
                    "properties": scheme.properties
                })
                if scheme.properties.get("source"):
                    results["sources"].append(scheme.properties["source"])
        
        # Pattern: opportunities
        elif "opportunity" in query_lower or "hackathon" in query_lower or "accelerator" in query_lower:
            opportunities = self.find_entities_by_type(EntityType.OPPORTUNITY)
            for opp in opportunities:
                results["entities"].append({
                    "type": "opportunity",
                    "name": opp.name,
                    "properties": opp.properties
                })
                if opp.properties.get("source"):
                    results["sources"].append(opp.properties["source"])
        
        results["sources"] = list(set(results["sources"]))
        return results
    
    def get_graph_stats(self) -> dict:
        """Get statistics about the knowledge graph."""
        type_counts = {}
        for entity in self.entities.values():
            type_name = entity.entity_type.value
            type_counts[type_name] = type_counts.get(type_name, 0) + 1
        
        rel_counts = {}
        for rel in self.relationships:
            rel_name = rel.relation_type.value
            rel_counts[rel_name] = rel_counts.get(rel_name, 0) + 1
        
        return {
            "total_entities": len(self.entities),
            "total_relationships": len(self.relationships),
            "entities_by_type": type_counts,
            "relationships_by_type": rel_counts
        }


# Singleton instance
_knowledge_graph: Optional[KnowledgeGraph] = None

def get_knowledge_graph() -> KnowledgeGraph:
    """Get the singleton knowledge graph instance."""
    global _knowledge_graph
    if _knowledge_graph is None:
        _knowledge_graph = KnowledgeGraph()
    return _knowledge_graph
