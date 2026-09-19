import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import {
  ShieldAlert, Activity, Plus, RefreshCw, Layers,
  Play, Download, Upload, HelpCircle, Server
} from 'lucide-react';

import NetworkCanvas from './components/NetworkCanvas';
import ControlPanel from './components/ControlPanel';
import MetricsPanel from './components/MetricsPanel';
import SystemBuilderModal from './components/SystemBuilderModal';

import { DEFAULT_SCENARIOS } from './data/defaultScenarios';
import { fetchScenarios, runSimulation, runRecovery } from './api/client';

export default function App() {
  const [scenarios, setScenarios] = useState(DEFAULT_SCENARIOS);
  const [selectedScenarioId, setSelectedScenarioId] = useState('ecommerce');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [recoveryResult, setRecoveryResult] = useState(null);

  // Wave step playback
  const [currentWaveStep, setCurrentWaveStep] = useState(0);
  const [maxWaveSteps, setMaxWaveSteps] = useState(0);
  const waveTimerRef = useRef(null);

  // System Builder Modal
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  // Load scenarios from API or fallback
  useEffect(() => {
    async function load() {
      try {
        const apiScenarios = await fetchScenarios();
        if (Array.isArray(apiScenarios) && apiScenarios.length > 0) {
          setScenarios(apiScenarios);
        }
      } catch (err) {
        console.warn('Backend API not reached yet, using built-in presets:', err);
      }
    }
    load();
  }, []);

  // Initialize network with active scenario
  const loadScenario = useCallback((scenarioId) => {
    const sc = scenarios.find((s) => s.id === scenarioId) || scenarios[0];
    if (!sc) return;

    // Deep copy nodes and edges
    const formattedNodes = sc.nodes.map((n) => ({
      id: n.id,
      type: 'custom',
      position: n.position || { x: 100, y: 100 },
      data: {
        label: n.label,
        type: n.type,
        status: 'HEALTHY',
        backup_node_id: n.backup_node_id,
        description: n.description
      }
    }));

    const formattedEdges = sc.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: false,
      data: {
        dependency_type: e.dependency_type || 'hard'
      },
      label: e.label
    }));

    setNodes(formattedNodes);
    setEdges(formattedEdges);
    setSelectedScenarioId(sc.id);
    setSelectedNodeId(sc.nodes[sc.nodes.length > 3 ? 3 : 0]?.id || '');
    setHasFailed(false);
    setSimulationResult(null);
    setRecoveryResult(null);
    setCurrentWaveStep(0);
    setMaxWaveSteps(0);
    if (waveTimerRef.current) clearInterval(waveTimerRef.current);
  }, [scenarios, setNodes, setEdges]);

  // Initial scenario load
  useEffect(() => {
    loadScenario(selectedScenarioId);
  }, [scenarios, loadScenario]);

  // Run Cascade Simulation
  const handleSimulateFailure = async () => {
    if (!selectedNodeId) return;

    setIsSimulating(true);
    setRecoveryResult(null);
    if (waveTimerRef.current) clearInterval(waveTimerRef.current);

    try {
      const graphData = {
        nodes: nodes.map(n => ({
          id: n.id,
          label: n.data?.label || n.label,
          type: n.data?.type || n.type,
          status: 'HEALTHY',
          backup_node_id: n.data?.backup_node_id,
          description: n.data?.description,
          position: n.position
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          dependency_type: e.data?.dependency_type || 'hard',
          label: e.label
        }))
      };

      const result = await runSimulation(graphData, selectedNodeId);
      setSimulationResult(result);
      setHasFailed(true);

      // Group waves by step
      const highestStep = result.waves.reduce((max, w) => Math.max(max, w.step), 0);
      setMaxWaveSteps(highestStep);
      setCurrentWaveStep(0);

      // Animate cascade wave-by-wave
      let step = 0;
      const initialNodes = nodes.map(n => ({
        ...n,
        data: { ...n.data, status: 'HEALTHY' }
      }));

      // Apply step 0 immediately
      const step0Waves = result.waves.filter(w => w.step === 0);
      const step0Map = {};
      step0Waves.forEach(w => { step0Map[w.node_id] = w.status; });

      setNodes(prev => prev.map(n => {
        if (step0Map[n.id]) {
          return { ...n, data: { ...n.data, status: step0Map[n.id] } };
        }
        return n;
      }));

      // Gradually apply subsequent waves for visual drama
      if (highestStep > 0) {
        waveTimerRef.current = setInterval(() => {
          step += 1;
          if (step > highestStep) {
            clearInterval(waveTimerRef.current);
            return;
          }
          setCurrentWaveStep(step);
          const currentStepWaves = result.waves.filter(w => w.step <= step);
          const waveMap = {};
          currentStepWaves.forEach(w => { waveMap[w.node_id] = w.status; });

          setNodes(prev => prev.map(n => {
            if (waveMap[n.id]) {
              return { ...n, data: { ...n.data, status: waveMap[n.id] } };
            }
            return n;
          }));
        }, 700);
      }
    } catch (err) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // Next wave step manually
  const handleNextWaveStep = () => {
    if (!simulationResult || currentWaveStep >= maxWaveSteps) return;
    const nextStep = currentWaveStep + 1;
    setCurrentWaveStep(nextStep);

    const appliedWaves = simulationResult.waves.filter(w => w.step <= nextStep);
    const statusMap = {};
    appliedWaves.forEach(w => { statusMap[w.node_id] = w.status; });

    setNodes(prev => prev.map(n => {
      if (statusMap[n.id]) {
        return { ...n, data: { ...n.data, status: statusMap[n.id] } };
      }
      return n;
    }));
  };

  // Run Recovery Strategy
  const handleRecovery = async (strategy) => {
    if (!selectedNodeId) return;

    try {
      const graphData = {
        nodes: nodes.map(n => ({
          id: n.id,
          label: n.data?.label || n.label,
          type: n.data?.type || n.type,
          status: n.data?.status || 'HEALTHY',
          backup_node_id: n.data?.backup_node_id,
          description: n.data?.description,
          position: n.position
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          dependency_type: e.data?.dependency_type || 'hard',
          label: e.label
        }))
      };

      const result = await runRecovery(graphData, selectedNodeId, strategy);
      setRecoveryResult(result);

      // Update node statuses from recovery result
      const resultMap = {};
      result.updated_nodes.forEach(n => { resultMap[n.id] = n.status; });

      setNodes(prev => prev.map(n => {
        if (resultMap[n.id]) {
          return { ...n, data: { ...n.data, status: resultMap[n.id] } };
        }
        return n;
      }));

      // Update blast radius in simulationResult to show recovery containment
      if (simulationResult) {
        setSimulationResult(prev => ({
          ...prev,
          blast_radius_percentage: result.blast_radius_percentage
        }));
      }
    } catch (err) {
      alert(`Recovery failed: ${err.message}`);
    }
  };

  // Reset Network to Healthy State
  const handleReset = () => {
    if (waveTimerRef.current) clearInterval(waveTimerRef.current);
    setNodes(prev => prev.map(n => ({
      ...n,
      data: { ...n.data, status: 'HEALTHY' }
    })));
    setHasFailed(false);
    setSimulationResult(null);
    setRecoveryResult(null);
    setCurrentWaveStep(0);
    setMaxWaveSteps(0);
  };

  // Add custom node
  const handleAddNode = (newNode) => {
    setNodes(prev => [
      ...prev,
      {
        id: newNode.id,
        type: 'custom',
        position: newNode.position,
        data: {
          label: newNode.label,
          type: newNode.type,
          status: 'HEALTHY',
          backup_node_id: newNode.backup_node_id,
          description: newNode.description
        }
      }
    ]);
  };

  // Add custom edge
  const handleAddEdge = (newEdge) => {
    setEdges(prev => [
      ...prev,
      {
        id: newEdge.id,
        source: newEdge.source,
        target: newEdge.target,
        animated: false,
        data: {
          dependency_type: newEdge.dependency_type
        },
        label: newEdge.label
      }
    ]);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* App Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-100 flex items-center gap-2">
              BreakPoint
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                v1.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Cascade Failure & Recovery Simulator
            </p>
          </div>
        </div>

        {/* Header Actions: Scenarios + Builder Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden md:inline font-medium">Scenario:</span>
            <select
              value={selectedScenarioId}
              onChange={(e) => loadScenario(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-sky-500 outline-none"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsBuilderOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-sky-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">System Builder</span>
          </button>
        </div>
      </header>

      {/* Control Strip */}
      <ControlPanel
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
        onSimulate={handleSimulateFailure}
        onReset={handleReset}
        onRecovery={handleRecovery}
        isSimulating={isSimulating}
        hasFailed={hasFailed}
        simulationResult={simulationResult}
        currentWaveStep={currentWaveStep}
        onNextWaveStep={handleNextWaveStep}
        maxWaveSteps={maxWaveSteps}
      />

      {/* Main Canvas & Metrics Split */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 h-full relative">
          <NetworkCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            setEdges={setEdges}
            onSelectNode={setSelectedNodeId}
            selectedNodeId={selectedNodeId}
          />
        </main>

        {/* Metrics Sidebar */}
        <MetricsPanel
          simulationResult={simulationResult}
          recoveryResult={recoveryResult}
          nodes={nodes}
          hasFailed={hasFailed}
        />
      </div>

      {/* System Builder Modal */}
      <SystemBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        nodes={nodes}
        onAddNode={handleAddNode}
        onAddEdge={handleAddEdge}
      />
    </div>
  );
}
