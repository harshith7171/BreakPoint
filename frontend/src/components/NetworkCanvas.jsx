import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  addEdge
} from '@xyflow/react';
import CustomNode from './CustomNode';

const nodeTypes = {
  custom: CustomNode
};

export default function NetworkCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setEdges,
  onSelectNode,
  selectedNodeId
}) {
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#38bdf8', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#38bdf8' }
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Map nodes to React Flow format with selected state
  const formattedNodes = useMemo(() => {
    return nodes.map((n) => ({
      ...n,
      type: 'custom',
      selected: n.id === selectedNodeId,
      data: {
        ...n.data,
        label: n.data?.label || n.label || n.id,
        type: n.data?.type || n.type || 'service',
        status: n.data?.status || n.status || 'HEALTHY',
        backup_node_id: n.data?.backup_node_id || n.backup_node_id,
        description: n.data?.description || n.description
      }
    }));
  }, [nodes, selectedNodeId]);

  // Style edges dynamically based on whether target dependency is down or degraded
  const formattedEdges = useMemo(() => {
    const nodeStatusMap = {};
    nodes.forEach((n) => {
      nodeStatusMap[n.id] = n.data?.status || n.status || 'HEALTHY';
    });

    return edges.map((e) => {
      const targetStatus = nodeStatusMap[e.target];
      const depType = e.data?.dependency_type || e.dependency_type || 'hard';

      let strokeColor = '#475569'; // default slate-600
      let isAnimated = false;
      let strokeDasharray = undefined;

      if (targetStatus === 'FAILED' || targetStatus === 'CASCADED') {
        strokeColor = '#ef4444'; // Red for broken/failed link
        isAnimated = true;
        strokeDasharray = '5 5';
      } else if (targetStatus === 'DEGRADED') {
        strokeColor = '#eab308'; // Yellow for degraded link
        isAnimated = true;
      } else if (targetStatus === 'RECOVERING') {
        strokeColor = '#3b82f6'; // Blue for active failover
        isAnimated = true;
      } else {
        strokeColor = '#38bdf8'; // Healthy active link
      }

      return {
        ...e,
        animated: isAnimated,
        style: {
          stroke: strokeColor,
          strokeWidth: 2,
          strokeDasharray: strokeDasharray
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor
        },
        label: e.label || (depType === 'soft' ? 'Soft' : undefined),
        labelStyle: { fill: strokeColor, fontSize: 11, fontWeight: 600 },
        labelBgStyle: { fill: '#0f172a', fillOpacity: 0.85 },
        labelBgPadding: [4, 6],
        labelBgBorderRadius: 4
      };
    });
  }, [edges, nodes]);

  const onNodeClick = useCallback(
    (event, node) => {
      if (onSelectNode) {
        onSelectNode(node.id);
      }
    },
    [onSelectNode]
  );

  return (
    <div className="w-full h-full relative bg-slate-950">
      <ReactFlow
        nodes={formattedNodes}
        edges={formattedEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#334155" gap={20} size={1} variant={BackgroundVariant.Dots} />
        <Controls position="bottom-right" />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          position="bottom-left"
          nodeColor={(n) => {
            const status = n.data?.status || 'HEALTHY';
            if (status === 'FAILED') return '#ef4444';
            if (status === 'CASCADED') return '#f97316';
            if (status === 'DEGRADED') return '#eab308';
            if (status === 'RECOVERING') return '#3b82f6';
            return '#10b981';
          }}
          maskColor="rgba(15, 23, 42, 0.75)"
          className="!bg-slate-900 !border-slate-800 rounded-lg overflow-hidden"
        />
      </ReactFlow>

      {/* Floating Instructions Banner */}
      <div className="absolute top-4 left-4 pointer-events-none bg-slate-900/90 backdrop-blur-md border border-slate-800/80 px-3.5 py-2 rounded-lg text-xs text-slate-300 shadow-lg flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>Click any node to target for failure or use the control bar. Drag connection handles to add dependencies.</span>
      </div>
    </div>
  );
}
