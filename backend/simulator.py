from typing import Dict, List, Set, Tuple
from collections import deque
from models import (
    GraphState, NodeItem, EdgeItem, NodeStatus, DependencyType,
    SimulationResponse, SimulationWave, RecoveryStrategy, RecoveryResponse
)

def run_cascade_simulation(graph: GraphState, failed_node_id: str) -> SimulationResponse:
    nodes_map: Dict[str, NodeItem] = {n.id: n.model_copy() for n in graph.nodes}
    
    if failed_node_id not in nodes_map:
        raise ValueError(f"Component '{failed_node_id}' not found in system network.")

    # Reset all statuses to HEALTHY first
    for n in nodes_map.values():
        n.status = NodeStatus.HEALTHY.value

    # Build reverse dependency adjacency map: target -> list of (source_node_id, dependency_type)
    # Edge: source -> target means 'source' depends on 'target'.
    # When 'target' fails, 'source' is affected.
    dependents_of: Dict[str, List[Tuple[str, str]]] = {n.id: [] for n in graph.nodes}
    for edge in graph.edges:
        if edge.target in dependents_of and edge.source in nodes_map:
            dependents_of[edge.target].append((edge.source, edge.dependency_type))

    waves: List[SimulationWave] = []
    
    # Wave 0: Initial root failure
    root_node = nodes_map[failed_node_id]
    root_node.status = NodeStatus.FAILED.value
    waves.append(
        SimulationWave(
            step=0,
            node_id=root_node.id,
            node_label=root_node.label,
            status=NodeStatus.FAILED.value,
            reason="Primary failure initiated (Component disabled / crashed)"
        )
    )

    # Queue for cascade propagation: (node_id, current_step)
    queue = deque([(failed_node_id, 0)])
    visited_steps: Dict[str, int] = {failed_node_id: 0}

    step_counter = 0

    while queue:
        current_id, current_step = queue.popleft()
        current_node = nodes_map[current_id]

        # Only nodes that are down (FAILED or CASCADED) propagate cascading failures to parents
        if current_node.status not in (NodeStatus.FAILED.value, NodeStatus.CASCADED.value):
            continue

        for parent_id, dep_type in dependents_of.get(current_id, []):
            parent_node = nodes_map[parent_id]
            next_step = current_step + 1

            if dep_type == DependencyType.HARD.value:
                # If parent isn't already marked FAILED
                if parent_node.status != NodeStatus.FAILED.value and parent_node.status != NodeStatus.CASCADED.value:
                    parent_node.status = NodeStatus.CASCADED.value
                    step_counter = max(step_counter, next_step)
                    waves.append(
                        SimulationWave(
                            step=next_step,
                            node_id=parent_node.id,
                            node_label=parent_node.label,
                            status=NodeStatus.CASCADED.value,
                            reason=f"Hard dependency '{current_node.label}' failed. Service cannot function."
                        )
                    )
                    queue.append((parent_id, next_step))
            elif dep_type == DependencyType.SOFT.value:
                # Soft dependency: parent enters DEGRADED state unless already crashed
                if parent_node.status == NodeStatus.HEALTHY.value:
                    parent_node.status = NodeStatus.DEGRADED.value
                    step_counter = max(step_counter, next_step)
                    waves.append(
                        SimulationWave(
                            step=next_step,
                            node_id=parent_node.id,
                            node_label=parent_node.label,
                            status=NodeStatus.DEGRADED.value,
                            reason=f"Soft dependency '{current_node.label}' down. Service operating in degraded fallback mode."
                        )
                    )

    # Calculate metrics
    total_nodes = len(nodes_map)
    failed_count = sum(1 for n in nodes_map.values() if n.status in (NodeStatus.FAILED.value, NodeStatus.CASCADED.value))
    degraded_count = sum(1 for n in nodes_map.values() if n.status == NodeStatus.DEGRADED.value)
    healthy_count = sum(1 for n in nodes_map.values() if n.status == NodeStatus.HEALTHY.value)

    # Blast radius formula: full impact for failed/cascaded, half impact for degraded
    blast_radius = round(((failed_count + (0.5 * degraded_count)) / total_nodes) * 100, 1) if total_nodes > 0 else 0.0

    summary = (
        f"Failure in '{root_node.label}' cascaded across {failed_count - 1} dependent services "
        f"and degraded {degraded_count} services. Total Blast Radius: {blast_radius}%."
    )

    return SimulationResponse(
        failed_node_id=failed_node_id,
        blast_radius_percentage=blast_radius,
        total_nodes=total_nodes,
        failed_count=failed_count,
        degraded_count=degraded_count,
        healthy_count=healthy_count,
        waves=waves,
        updated_nodes=list(nodes_map.values()),
        summary=summary
    )


def run_recovery_simulation(graph: GraphState, failed_node_id: str, strategy: RecoveryStrategy) -> RecoveryResponse:
    # First run the standard cascade to get the current failed state
    sim_result = run_cascade_simulation(graph, failed_node_id)
    nodes_map: Dict[str, NodeItem] = {n.id: n.model_copy() for n in sim_result.updated_nodes}
    
    root_node = nodes_map.get(failed_node_id)
    if not root_node:
        raise ValueError(f"Component '{failed_node_id}' not found.")

    restored_nodes: List[str] = []
    remaining_impacted: List[str] = []
    success = False
    message = ""

    if strategy == RecoveryStrategy.RESTART:
        # Reboots the component back to healthy
        root_node.status = NodeStatus.HEALTHY.value
        restored_nodes.append(root_node.id)
        
        # All cascaded services now recover
        for node in nodes_map.values():
            if node.id != failed_node_id:
                if node.status in (NodeStatus.CASCADED.value, NodeStatus.DEGRADED.value):
                    node.status = NodeStatus.HEALTHY.value
                    restored_nodes.append(node.id)
        
        success = True
        message = f"Rebooted '{root_node.label}'. Process restarted cleanly and all {len(restored_nodes)} services recovered to HEALTHY."

    elif strategy == RecoveryStrategy.FAILOVER:
        # Check if root node has a backup_node_id configured
        backup_id = root_node.backup_node_id
        backup_node = nodes_map.get(backup_id) if backup_id else None

        # Also search if any other node has label or role as backup for this component
        if not backup_node:
            for n in nodes_map.values():
                if n.id != failed_node_id and (failed_node_id in n.id.lower() or "replica" in n.label.lower() or "standby" in n.label.lower() or "backup" in n.label.lower()):
                    backup_node = n
                    break

        if backup_node and backup_node.status == NodeStatus.HEALTHY.value:
            # Standby takes over
            backup_node.status = NodeStatus.RECOVERING.value
            # Root node stays failed (in maintenance)
            root_node.status = NodeStatus.FAILED.value
            remaining_impacted.append(root_node.id)

            # Dependent services recover because backup is handling traffic
            for node in nodes_map.values():
                if node.id not in (root_node.id, backup_node.id):
                    if node.status in (NodeStatus.CASCADED.value, NodeStatus.DEGRADED.value):
                        node.status = NodeStatus.HEALTHY.value
                        restored_nodes.append(node.id)

            success = True
            message = (
                f"Failover successful! Rerouted traffic from '{root_node.label}' to '{backup_node.label}'. "
                f"{len(restored_nodes)} dependent services restored."
            )
        else:
            success = False
            message = (
                f"Failover failed: No active standby replica or backup node configured for '{root_node.label}'. "
                f"Cascade remains active."
            )
            for n in nodes_map.values():
                if n.status != NodeStatus.HEALTHY.value:
                    remaining_impacted.append(n.id)

    elif strategy == RecoveryStrategy.CIRCUIT_BREAKER:
        # Circuit breaker: Isolates the failed service.
        # Direct parent services stop hanging on calls and return fallback / degraded responses instead of crashing
        root_node.status = NodeStatus.FAILED.value
        remaining_impacted.append(root_node.id)

        for node in nodes_map.values():
            if node.id != root_node.id:
                if node.status == NodeStatus.CASCADED.value:
                    node.status = NodeStatus.DEGRADED.value
                    restored_nodes.append(node.id)
                elif node.status == NodeStatus.DEGRADED.value:
                    remaining_impacted.append(node.id)

        success = True
        message = (
            f"Circuit Breaker tripped for '{root_node.label}'. Upstream callers isolated and operating in graceful DEGRADED mode "
            f"rather than experiencing total crash."
        )

    # Recalculate blast radius
    total_nodes = len(nodes_map)
    failed_count = sum(1 for n in nodes_map.values() if n.status in (NodeStatus.FAILED.value, NodeStatus.CASCADED.value))
    degraded_count = sum(1 for n in nodes_map.values() if n.status == NodeStatus.DEGRADED.value)
    new_blast_radius = round(((failed_count + (0.5 * degraded_count)) / total_nodes) * 100, 1) if total_nodes > 0 else 0.0

    return RecoveryResponse(
        strategy=strategy.value,
        success=success,
        message=message,
        restored_nodes=restored_nodes,
        remaining_impacted=remaining_impacted,
        updated_nodes=list(nodes_map.values()),
        blast_radius_percentage=new_blast_radius
    )
