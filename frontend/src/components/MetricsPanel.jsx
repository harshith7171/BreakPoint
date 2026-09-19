import React from 'react';
import {
  Activity, AlertTriangle, CheckCircle2, Flame, Shield,
  ArrowRight, Info, AlertOctagon
} from 'lucide-react';

export default function MetricsPanel({
  simulationResult,
  recoveryResult,
  nodes,
  hasFailed
}) {
  const totalNodes = nodes.length;
  const failedCount = nodes.filter((n) => {
    const status = n.data?.status || n.status;
    return status === 'FAILED' || status === 'CASCADED';
  }).length;

  const degradedCount = nodes.filter((n) => {
    const status = n.data?.status || n.status;
    return status === 'DEGRADED';
  }).length;

  const healthyCount = nodes.filter((n) => {
    const status = n.data?.status || n.status;
    return status === 'HEALTHY' || status === 'RECOVERING';
  }).length;

  const blastRadius = simulationResult
    ? simulationResult.blast_radius_percentage
    : 0;

  // Gauge color based on blast radius
  const getRadiusColor = (val) => {
    if (val === 0) return 'text-emerald-400 border-emerald-500';
    if (val < 35) return 'text-yellow-400 border-yellow-500';
    if (val < 70) return 'text-orange-400 border-orange-500';
    return 'text-red-500 border-red-500';
  };

  const getRadiusBg = (val) => {
    if (val === 0) return 'bg-emerald-500/10';
    if (val < 35) return 'bg-yellow-500/10';
    if (val < 70) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="w-84 lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <h3 className="font-semibold text-sm text-slate-200">Simulation Metrics</h3>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
          Real-time
        </span>
      </div>

      <div className="p-4 space-y-5">
        {/* Blast Radius Card */}
        <div
          className={`p-4 rounded-xl border transition-all ${getRadiusColor(
            blastRadius
          )} ${getRadiusBg(blastRadius)}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Blast Radius
            </span>
            <Flame className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">
              {blastRadius}%
            </span>
            <span className="text-xs text-slate-400">of network impacted</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                blastRadius === 0
                  ? 'bg-emerald-500'
                  : blastRadius < 35
                  ? 'bg-yellow-500'
                  : blastRadius < 70
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${blastRadius}%` }}
            />
          </div>
        </div>

        {/* Health Breakdown Counter Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-emerald-400 font-bold text-lg">{healthyCount}</div>
            <div className="text-[10px] text-slate-400 uppercase font-medium">Healthy</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-red-400 font-bold text-lg">{failedCount}</div>
            <div className="text-[10px] text-slate-400 uppercase font-medium">Failed</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-yellow-400 font-bold text-lg">{degradedCount}</div>
            <div className="text-[10px] text-slate-400 uppercase font-medium">Degraded</div>
          </div>
        </div>

        {/* Recovery Result Banner */}
        {recoveryResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
              recoveryResult.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/40 border-red-500/40 text-red-300'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold mb-1">
              {recoveryResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="uppercase tracking-wider">
                Recovery: {recoveryResult.strategy}
              </span>
            </div>
            <p>{recoveryResult.message}</p>
          </div>
        )}

        {/* Propagation Waves Timeline */}
        {simulationResult && simulationResult.waves && simulationResult.waves.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Cascade Timeline
              </h4>
              <span className="text-[11px] text-slate-500">
                {simulationResult.waves.length} events
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {simulationResult.waves.map((wave, idx) => {
                const isRoot = wave.step === 0;
                const isDegraded = wave.status === 'DEGRADED';
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs transition-all ${
                      isRoot
                        ? 'bg-red-950/40 border-red-500/50 text-red-200'
                        : isDegraded
                        ? 'bg-yellow-950/30 border-yellow-500/40 text-yellow-200'
                        : 'bg-orange-950/30 border-orange-500/40 text-orange-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-medium mb-1">
                      <span className="flex items-center gap-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900/80 border border-slate-700">
                          Wave {wave.step}
                        </span>
                        <span className="font-semibold text-slate-100">{wave.node_label}</span>
                      </span>
                      <span
                        className={`text-[10px] font-mono font-semibold uppercase ${
                          isRoot
                            ? 'text-red-400'
                            : isDegraded
                            ? 'text-yellow-400'
                            : 'text-orange-400'
                        }`}
                      >
                        {wave.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{wave.reason}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary note if no simulation active */}
        {!hasFailed && (
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p>
              Network is operating at 100% capacity. Choose any service from the top bar and click{' '}
              <strong className="text-red-400">Simulate Failure</strong> to inspect cascade impacts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
