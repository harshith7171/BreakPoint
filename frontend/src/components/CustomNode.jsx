import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Server, Database, Zap, Layers, Cloud, Shield,
  CheckCircle2, AlertOctagon, AlertTriangle, RefreshCw,
  ExternalLink
} from 'lucide-react';

const TYPE_CONFIG = {
  gateway: {
    icon: GlobeIcon,
    bgColor: 'bg-indigo-950/70',
    borderColor: 'border-indigo-500/40',
    tagColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    label: 'GATEWAY'
  },
  service: {
    icon: Server,
    bgColor: 'bg-slate-900/90',
    borderColor: 'border-slate-600/50',
    tagColor: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
    label: 'SERVICE'
  },
  database: {
    icon: Database,
    bgColor: 'bg-cyan-950/70',
    borderColor: 'border-cyan-500/40',
    tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    label: 'DATABASE'
  },
  cache: {
    icon: Zap,
    bgColor: 'bg-amber-950/70',
    borderColor: 'border-amber-500/40',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    label: 'CACHE'
  },
  queue: {
    icon: Layers,
    bgColor: 'bg-purple-950/70',
    borderColor: 'border-purple-500/40',
    tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    label: 'QUEUE'
  },
  third_party: {
    icon: Cloud,
    bgColor: 'bg-sky-950/70',
    borderColor: 'border-sky-500/40',
    tagColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    label: '3RD PARTY'
  }
};

function GlobeIcon(props) {
  return <Shield {...props} />;
}

const STATUS_CONFIG = {
  HEALTHY: {
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    border: 'border-emerald-500/40 hover:border-emerald-400',
    icon: CheckCircle2,
    text: 'Healthy',
    pulseClass: ''
  },
  FAILED: {
    badge: 'bg-red-500/30 text-red-300 border-red-500/50 font-semibold',
    border: 'border-red-500 node-pulse-failed',
    icon: AlertOctagon,
    text: 'Root Failure',
    pulseClass: 'shadow-red-500/50'
  },
  CASCADED: {
    badge: 'bg-orange-500/30 text-orange-300 border-orange-500/50',
    border: 'border-orange-500 node-pulse-cascaded',
    icon: AlertTriangle,
    text: 'Cascaded Failure',
    pulseClass: 'shadow-orange-500/50'
  },
  DEGRADED: {
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    border: 'border-yellow-500/80 node-pulse-degraded',
    icon: AlertTriangle,
    text: 'Degraded',
    pulseClass: 'shadow-yellow-500/40'
  },
  RECOVERING: {
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    border: 'border-blue-500 node-pulse-recovering',
    icon: RefreshCw,
    text: 'Failover Active',
    pulseClass: 'shadow-blue-500/40'
  }
};

function CustomNode({ data, selected }) {
  const compType = TYPE_CONFIG[data.type] || TYPE_CONFIG.service;
  const statusInfo = STATUS_CONFIG[data.status] || STATUS_CONFIG.HEALTHY;
  const StatusIcon = statusInfo.icon;
  const CompIcon = compType.icon;

  return (
    <div
      className={`relative min-w-[210px] max-w-[240px] rounded-xl border backdrop-blur-md p-3.5 transition-all duration-300 shadow-xl ${compType.bgColor} ${statusInfo.border} ${
        selected ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950 scale-105' : ''
      }`}
    >
      {/* React Flow Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-400 !border-slate-800"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-sky-400 !border-slate-800"
      />

      {/* Top row: Type Tag & Status Badge */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <span
          className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border uppercase ${compType.tagColor}`}
        >
          {compType.label}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${statusInfo.badge}`}
        >
          <StatusIcon className={`w-3 h-3 ${data.status === 'RECOVERING' ? 'animate-spin' : ''}`} />
          <span>{statusInfo.text}</span>
        </span>
      </div>

      {/* Center: Component Icon & Name */}
      <div className="flex items-center gap-2.5 my-1">
        <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 shrink-0">
          <CompIcon className="w-5 h-5 text-sky-400" />
        </div>
        <div className="overflow-hidden">
          <h4 className="text-sm font-semibold text-slate-100 truncate" title={data.label}>
            {data.label}
          </h4>
          <p className="text-[11px] text-slate-400 truncate">
            {data.description || 'Microservice component'}
          </p>
        </div>
      </div>

      {/* Footer Info: Redundancy / Backup indicator */}
      {data.backup_node_id && (
        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1 text-sky-400 font-medium">
            <Shield className="w-3 h-3" /> Backup Linked
          </span>
          <span className="font-mono text-slate-500 truncate max-w-[90px]">
            {data.backup_node_id}
          </span>
        </div>
      )}
    </div>
  );
}

export default memo(CustomNode);
