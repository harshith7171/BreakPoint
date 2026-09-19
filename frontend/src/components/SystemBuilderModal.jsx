import React, { useState } from 'react';
import {
  X, Plus, Server, Link, AlertCircle, CheckCircle2, Shield
} from 'lucide-react';

export default function SystemBuilderModal({
  isOpen,
  onClose,
  nodes,
  onAddNode,
  onAddEdge
}) {
  const [tab, setTab] = useState('node'); // 'node' or 'edge'

  // Node form state
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeType, setNodeType] = useState('service');
  const [nodeDesc, setNodeDesc] = useState('');
  const [backupId, setBackupId] = useState('');

  // Edge form state
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [depType, setDepType] = useState('hard');
  const [edgeLabel, setEdgeLabel] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleCreateNode = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!nodeLabel.trim()) {
      setError('Please provide a component name.');
      return;
    }

    const id = nodeLabel.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    
    // Spawn position with slight randomness to avoid overlaying existing nodes
    const position = {
      x: 300 + Math.random() * 300,
      y: 150 + Math.random() * 250
    };

    onAddNode({
      id,
      label: nodeLabel.trim(),
      type: nodeType,
      description: nodeDesc.trim() || undefined,
      backup_node_id: backupId || undefined,
      status: 'HEALTHY',
      position
    });

    setSuccess(`Created component '${nodeLabel.trim()}' successfully!`);
    setNodeLabel('');
    setNodeDesc('');
    setBackupId('');
  };

  const handleCreateEdge = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!sourceId || !targetId) {
      setError('Please select both a source service and a target dependency.');
      return;
    }

    if (sourceId === targetId) {
      setError('A component cannot depend on itself.');
      return;
    }

    const edgeId = `e_${sourceId}_${targetId}_${Date.now().toString().slice(-4)}`;

    onAddEdge({
      id: edgeId,
      source: sourceId,
      target: targetId,
      dependency_type: depType,
      label: edgeLabel.trim() || undefined
    });

    setSuccess('Connection created successfully!');
    setEdgeLabel('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-slate-100">System Network Builder</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          <button
            onClick={() => { setTab('node'); setError(''); setSuccess(''); }}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
              tab === 'node'
                ? 'border-sky-500 text-sky-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Add Component</span>
          </button>
          <button
            onClick={() => { setTab('edge'); setError(''); setSuccess(''); }}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
              tab === 'edge'
                ? 'border-sky-500 text-sky-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>Add Dependency Connection</span>
          </button>
        </div>

        {/* Feedback message */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-5">
          {tab === 'node' ? (
            <form onSubmit={handleCreateNode} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Component Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Billing Service, Auth Redis, Search Elastic"
                  value={nodeLabel}
                  onChange={(e) => setNodeLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Component Type
                </label>
                <select
                  value={nodeType}
                  onChange={(e) => setNodeType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="gateway">API Gateway / Ingress</option>
                  <option value="service">Backend Microservice</option>
                  <option value="database">Database (SQL / NoSQL)</option>
                  <option value="cache">In-Memory Cache (Redis / Memcached)</option>
                  <option value="queue">Message Queue (Kafka / RabbitMQ)</option>
                  <option value="third_party">Third-Party External API</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Optional Redundant Standby / Backup
                </label>
                <select
                  value={backupId}
                  onChange={(e) => setBackupId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="">None (Single point of failure)</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.data?.label || n.label} ({n.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g., Handles customer invoices & ledger synchronization"
                  value={nodeDesc}
                  onChange={(e) => setNodeDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-sky-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Component</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateEdge} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Dependent Service (Caller)
                </label>
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="">Select caller service...</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.data?.label || n.label} ({n.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Target Dependency (Calibrated Service)
                </label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="">Select target dependency...</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.data?.label || n.label} ({n.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Dependency Severity
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`border rounded-lg p-3 cursor-pointer transition-all flex flex-col ${
                      depType === 'hard'
                        ? 'border-red-500/70 bg-red-950/30 text-red-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="depType"
                      value="hard"
                      checked={depType === 'hard'}
                      onChange={() => setDepType('hard')}
                      className="hidden"
                    />
                    <span className="font-semibold text-xs mb-1">Hard Dependency</span>
                    <span className="text-[11px] opacity-80">
                      Service crashes if this target is down.
                    </span>
                  </label>

                  <label
                    className={`border rounded-lg p-3 cursor-pointer transition-all flex flex-col ${
                      depType === 'soft'
                        ? 'border-yellow-500/70 bg-yellow-950/30 text-yellow-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="depType"
                      value="soft"
                      checked={depType === 'soft'}
                      onChange={() => setDepType('soft')}
                      className="hidden"
                    />
                    <span className="font-semibold text-xs mb-1">Soft Dependency</span>
                    <span className="text-[11px] opacity-80">
                      Service degrades gracefully with fallback.
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Connection Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., gRPC, Query, Event Stream"
                  value={edgeLabel}
                  onChange={(e) => setEdgeLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-sky-600/20"
                >
                  <Link className="w-4 h-4" />
                  <span>Connect Services</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
