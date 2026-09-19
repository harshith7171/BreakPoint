import { DEFAULT_SCENARIOS } from '../data/defaultScenarios';

const API_BASE = '/api';

export async function fetchScenarios() {
  try {
    const res = await fetch(`${API_BASE}/scenarios`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to local scenarios if backend is not running or on static hosts
  }
  return DEFAULT_SCENARIOS;
}

// Client-side simulation fallback (allows standalone static demo deployment e.g. on Vercel/GitHub Pages)
function localSimulate(graph, failedNodeId) {
  const nodesMap = {};
  graph.nodes.forEach(n => {
    nodesMap[n.id] = {
      id: n.id,
      label: n.data?.label || n.label || n.id,
      type: n.data?.type || n.type || 'service',
      status: 'HEALTHY',
      backup_node_id: n.data?.backup_node_id || n.backup_node_id,
      description: n.data?.description || n.description
    };
  });

  const dependentsOf = {};
  graph.nodes.forEach(n => { dependentsOf[n.id] = []; });
  graph.edges.forEach(e => {
    const depType = e.data?.dependency_type || e.dependency_type || 'hard';
    if (dependentsOf[e.target]) {
      dependentsOf[e.target].push({ source: e.source, depType });
    }
  });

  const waves = [];
  const rootNode = nodesMap[failedNodeId];
  if (!rootNode) return null;

  rootNode.status = 'FAILED';
  waves.push({
    step: 0,
    node_id: rootNode.id,
    node_label: rootNode.label,
    status: 'FAILED',
    reason: 'Primary failure initiated (Component disabled / crashed)'
  });

  const queue = [{ id: failedNodeId, step: 0 }];

  while (queue.length > 0) {
    const { id: currentId, step: currentStep } = queue.shift();
    const currentNode = nodesMap[currentId];
    if (currentNode.status !== 'FAILED' && currentNode.status !== 'CASCADED') continue;

    const parents = dependentsOf[currentId] || [];
    parents.forEach(({ source, depType }) => {
      const parentNode = nodesMap[source];
      if (!parentNode) return;
      const nextStep = currentStep + 1;

      if (depType === 'hard') {
        if (parentNode.status !== 'FAILED' && parentNode.status !== 'CASCADED') {
          parentNode.status = 'CASCADED';
          waves.push({
            step: nextStep,
            node_id: parentNode.id,
            node_label: parentNode.label,
            status: 'CASCADED',
            reason: `Hard dependency '${currentNode.label}' failed. Service cannot function.`
          });
          queue.push({ id: source, step: nextStep });
        }
      } else if (depType === 'soft') {
        if (parentNode.status === 'HEALTHY') {
          parentNode.status = 'DEGRADED';
          waves.push({
            step: nextStep,
            node_id: parentNode.id,
            node_label: parentNode.label,
            status: 'DEGRADED',
            reason: `Soft dependency '${currentNode.label}' down. Service operating in degraded mode.`
          });
        }
      }
    });
  }

  const totalNodes = Object.keys(nodesMap).length;
  const failedCount = Object.values(nodesMap).filter(n => n.status === 'FAILED' || n.status === 'CASCADED').length;
  const degradedCount = Object.values(nodesMap).filter(n => n.status === 'DEGRADED').length;
  const healthyCount = Object.values(nodesMap).filter(n => n.status === 'HEALTHY').length;
  const blastRadius = totalNodes > 0 ? Math.round(((failedCount + 0.5 * degradedCount) / totalNodes) * 1000) / 10 : 0;

  return {
    failed_node_id: failedNodeId,
    blast_radius_percentage: blastRadius,
    total_nodes: totalNodes,
    failed_count: failedCount,
    degraded_count: degradedCount,
    healthy_count: healthyCount,
    waves,
    updated_nodes: Object.values(nodesMap),
    summary: `Failure in '${rootNode.label}' cascaded across ${failedCount - 1} dependent services and degraded ${degradedCount} services. Total Blast Radius: ${blastRadius}%.`
  };
}

function localRecover(graph, failedNodeId, strategy) {
  const sim = localSimulate(graph, failedNodeId);
  const nodesMap = {};
  sim.updated_nodes.forEach(n => { nodesMap[n.id] = { ...n }; });
  const rootNode = nodesMap[failedNodeId];

  const restored = [];
  const remaining = [];
  let success = false;
  let message = '';

  if (strategy === 'restart') {
    rootNode.status = 'HEALTHY';
    restored.push(rootNode.id);
    Object.values(nodesMap).forEach(n => {
      if (n.status === 'CASCADED' || n.status === 'DEGRADED') {
        n.status = 'HEALTHY';
        restored.push(n.id);
      }
    });
    success = true;
    message = `Rebooted '${rootNode.label}'. Process restarted cleanly and all ${restored.length} services recovered to HEALTHY.`;
  } else if (strategy === 'failover') {
    let backupNode = rootNode.backup_node_id ? nodesMap[rootNode.backup_node_id] : null;
    if (!backupNode) {
      backupNode = Object.values(nodesMap).find(n => n.id !== failedNodeId && (n.label.toLowerCase().includes('backup') || n.label.toLowerCase().includes('replica') || n.label.toLowerCase().includes('standby')));
    }

    if (backupNode && backupNode.status === 'HEALTHY') {
      backupNode.status = 'RECOVERING';
      rootNode.status = 'FAILED';
      remaining.push(rootNode.id);
      Object.values(nodesMap).forEach(n => {
        if (n.id !== rootNode.id && n.id !== backupNode.id && (n.status === 'CASCADED' || n.status === 'DEGRADED')) {
          n.status = 'HEALTHY';
          restored.push(n.id);
        }
      });
      success = true;
      message = `Failover successful! Rerouted traffic from '${rootNode.label}' to '${backupNode.label}'. ${restored.length} dependent services restored.`;
    } else {
      success = false;
      message = `Failover failed: No active standby replica or backup node configured for '${rootNode.label}'.`;
      remaining.push(...Object.values(nodesMap).filter(n => n.status !== 'HEALTHY').map(n => n.id));
    }
  } else if (strategy === 'circuit_breaker') {
    rootNode.status = 'FAILED';
    remaining.push(rootNode.id);
    Object.values(nodesMap).forEach(n => {
      if (n.id !== rootNode.id && n.status === 'CASCADED') {
        n.status = 'DEGRADED';
        restored.push(n.id);
      }
    });
    success = true;
    message = `Circuit Breaker tripped for '${rootNode.label}'. Upstream callers isolated in graceful DEGRADED mode.`;
  }

  const total = Object.keys(nodesMap).length;
  const failed = Object.values(nodesMap).filter(n => n.status === 'FAILED' || n.status === 'CASCADED').length;
  const degraded = Object.values(nodesMap).filter(n => n.status === 'DEGRADED').length;
  const newRadius = total > 0 ? Math.round(((failed + 0.5 * degraded) / total) * 1000) / 10 : 0;

  return {
    strategy,
    success,
    message,
    restored_nodes: restored,
    remaining_impacted: remaining,
    updated_nodes: Object.values(nodesMap),
    blast_radius_percentage: newRadius
  };
}

export async function runSimulation(graph, failedNodeId) {
  try {
    const res = await fetch(`${API_BASE}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graph: {
          nodes: graph.nodes.map(n => ({
            id: n.id,
            label: n.data?.label || n.label || n.id,
            type: n.data?.type || n.type || 'service',
            status: n.data?.status || n.status || 'HEALTHY',
            backup_node_id: n.data?.backup_node_id || n.backup_node_id,
            description: n.data?.description || n.description,
            position: n.position
          })),
          edges: graph.edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            dependency_type: e.data?.dependency_type || e.dependency_type || 'hard',
            label: e.label || e.data?.label
          }))
        },
        failed_node_id: failedNodeId
      })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline / static hosting fallback
  }

  return localSimulate(graph, failedNodeId);
}

export async function runRecovery(graph, failedNodeId, strategy) {
  try {
    const res = await fetch(`${API_BASE}/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graph: {
          nodes: graph.nodes.map(n => ({
            id: n.id,
            label: n.data?.label || n.label || n.id,
            type: n.data?.type || n.type || 'service',
            status: n.data?.status || n.status || 'HEALTHY',
            backup_node_id: n.data?.backup_node_id || n.backup_node_id,
            description: n.data?.description || n.description,
            position: n.position
          })),
          edges: graph.edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            dependency_type: e.data?.dependency_type || e.dependency_type || 'hard',
            label: e.label || e.data?.label
          }))
        },
        failed_node_id: failedNodeId,
        strategy: strategy
      })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline / static hosting fallback
  }

  return localRecover(graph, failedNodeId, strategy);
}
