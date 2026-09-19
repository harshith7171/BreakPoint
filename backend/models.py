from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class NodeStatus(str, Enum):
    HEALTHY = "HEALTHY"
    FAILED = "FAILED"          # The initial/root failure triggered by user
    CASCADED = "CASCADED"      # Hard cascade failure (broke because dependency broke)
    DEGRADED = "DEGRADED"      # Soft cascade (operating with degraded functionality)
    RECOVERING = "RECOVERING"  # Recovered or currently switching

class DependencyType(str, Enum):
    HARD = "hard"  # Dependent crashes if target is down
    SOFT = "soft"  # Dependent degrades if target is down

class ComponentType(str, Enum):
    GATEWAY = "gateway"
    SERVICE = "service"
    DATABASE = "database"
    CACHE = "cache"
    QUEUE = "queue"
    THIRD_PARTY = "third_party"

class NodeItem(BaseModel):
    id: str
    label: str
    type: str = ComponentType.SERVICE.value
    status: str = NodeStatus.HEALTHY.value
    backup_node_id: Optional[str] = None
    description: Optional[str] = None
    position: Optional[Dict[str, float]] = None

class EdgeItem(BaseModel):
    id: str
    source: str  # The dependent service calling the dependency
    target: str  # The dependency being called
    dependency_type: str = DependencyType.HARD.value
    label: Optional[str] = None

class GraphState(BaseModel):
    nodes: List[NodeItem]
    edges: List[EdgeItem]

class SimulationWave(BaseModel):
    step: int
    node_id: str
    node_label: str
    status: str
    reason: str

class SimulationRequest(BaseModel):
    graph: GraphState
    failed_node_id: str

class SimulationResponse(BaseModel):
    failed_node_id: str
    blast_radius_percentage: float
    total_nodes: int
    failed_count: int
    degraded_count: int
    healthy_count: int
    waves: List[SimulationWave]
    updated_nodes: List[NodeItem]
    summary: str

class RecoveryStrategy(str, Enum):
    RESTART = "restart"
    FAILOVER = "failover"
    CIRCUIT_BREAKER = "circuit_breaker"

class RecoveryRequest(BaseModel):
    graph: GraphState
    failed_node_id: str
    strategy: RecoveryStrategy

class RecoveryResponse(BaseModel):
    strategy: str
    success: bool
    message: str
    restored_nodes: List[str]
    remaining_impacted: List[str]
    updated_nodes: List[NodeItem]
    blast_radius_percentage: float
