import React from 'react';
import {
  Flame, RotateCcw, Play, RefreshCw, Shield, Zap,
  Layers, StepForward, AlertTriangle
} from 'lucide-react';

export default function ControlPanel({
  nodes,
  selectedNodeId,
  onSelectNode,
  onSimulate,
  onReset,
  onRecovery,
  isSimulating,
  hasFailed,
  simulationResult,
  currentWaveStep,
  onNextWaveStep,
  maxWaveSteps
}) {
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="bg-slate-900/95 border-b border-slate-800 p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
      {/* Target Component Selector */}
      <div className="flex items-center gap-3 min-w-[280px]">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Target Node:
        </span>
        <select
          value={selectedNodeId || ''}
          onChange={(e) => onSelectNode(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none flex-1 max-w-[240px]"
        >
          <option value="" disabled>Select component to fail...</option>
          {nodes.map((node) => {
            const label = node.data?.label || node.label || node.id;
            const status = node.data?.status || node.status || 'HEALTHY';
            const statusIcon = status === 'HEALTHY' ? '🟢' : status === 'FAILED' ? '🔴' : '🟠';
            return (
              <option key={node.id} value={node.id}>
                {statusIcon} {label}
              </option>
            );
          })}
        </select>
      </div>

      {/* Primary Simulation Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSimulate}
          disabled={!selectedNodeId || isSimulating}
          className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-md ${
            !selectedNodeId || isSimulating
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20 active:scale-95'
          }`}
          title="Trigger a primary failure on selected node"
        >
          <Flame className="w-4 h-4" />
          <span>Simulate Failure</span>
        </button>

        {/* Step-by-Step Wave Navigation if simulation has waves */}
        {hasFailed && maxWaveSteps > 0 && (
          <button
            onClick={onNextWaveStep}
            disabled={currentWaveStep >= maxWaveSteps}
            className={`px-3 py-2 rounded-lg font-medium text-xs flex items-center gap-1.5 border transition-all ${
              currentWaveStep >= maxWaveSteps
                ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-sky-400 active:scale-95'
            }`}
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>Wave Step ({currentWaveStep}/{maxWaveSteps})</span>
          </button>
        )}

        <button
          onClick={onReset}
          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium text-sm flex items-center gap-1.5 transition-all active:scale-95"
          title="Reset network to healthy state"
        >
          <RotateCcw className="w-4 h-4 text-emerald-400" />
          <span>Reset Network</span>
        </button>
      </div>

      {/* Recovery Strategies Strip */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:inline">
          Recovery:
        </span>
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onRecovery('restart')}
            disabled={!hasFailed}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              !hasFailed
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-emerald-400 hover:bg-slate-900 hover:text-emerald-300 active:scale-95'
            }`}
            title="Reboot the failed component"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>

          <button
            onClick={() => onRecovery('failover')}
            disabled={!hasFailed}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              !hasFailed
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-sky-400 hover:bg-slate-900 hover:text-sky-300 active:scale-95'
            }`}
            title="Reroute traffic to redundant standby/replica"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Failover</span>
          </button>

          <button
            onClick={() => onRecovery('circuit_breaker')}
            disabled={!hasFailed}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              !hasFailed
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-amber-400 hover:bg-slate-900 hover:text-amber-300 active:scale-95'
            }`}
            title="Trip circuit breaker to isolate failed node and operate in degraded mode"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Circuit Breaker</span>
          </button>
        </div>
      </div>
    </div>
  );
}
