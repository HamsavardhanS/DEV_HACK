import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

const getSeverityDetails = (score) => {
    if (score >= 80) return { label: 'Critical', style: 'bg-red-500/10 text-red-400 border border-red-500/20', dot: 'bg-red-500' };
    if (score >= 50) return { label: 'High', style: 'bg-orange-500/10 text-orange-400 border border-orange-500/20', dot: 'bg-orange-500' };
    return { label: 'Low', style: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', dot: 'bg-emerald-500' };
};

const ThreatRow = ({ threat }) => {
    const [expanded, setExpanded] = useState(false);
    const sev = getSeverityDetails(threat.riskScore);
    const isBlocked = threat.status === 'Blocked';

    return (
        <div className={`rounded-lg border ${isBlocked ? 'border-slate-700/30 bg-slate-800/20' : 'border-slate-700/50 bg-slate-800/30'} hover:bg-slate-800/50 hover:border-cyan-500/20 transition-all`}>
            <div
                className="flex items-center justify-between p-3 cursor-pointer font-mono"
                onClick={() => setExpanded(!expanded)}
            >
                {/* Left Side */}
                <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${sev.dot} ${!isBlocked && threat.riskScore >= 50 ? 'animate-pulse' : ''}`}></div>
                    <Activity className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-300 font-semibold text-sm">
                        T-{threat.eventId.substring(0, 3).toUpperCase()}
                    </span>
                    <span className="text-slate-200 text-sm w-32 truncate">{threat.type}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] tracking-wider uppercase ${sev.style}`}>
                        {sev.label}
                    </span>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="truncate max-w-[140px] text-right hidden sm:block">
                        {threat.action.replace(/_/g, ' ')}
                    </span>
                    <span className="w-20 text-right opacity-70">
                        {new Date(threat.time).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}
                    </span>
                    {expanded ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
                </div>
            </div>

            {/* Expandable Detail */}
            {expanded && (
                <div className="px-4 pb-3 pt-1 border-t border-slate-700/40 font-mono text-xs">
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-slate-900/60 rounded p-2">
                            <div className="text-slate-500 uppercase tracking-wider text-[10px] mb-0.5">Event ID</div>
                            <div className="text-slate-400">{threat.eventId}</div>
                        </div>
                        <div className="bg-slate-900/60 rounded p-2">
                            <div className="text-slate-500 uppercase tracking-wider text-[10px] mb-0.5">Risk Score</div>
                            <div className={`font-bold ${sev.style.split(' ')[1]}`}>{threat.riskScore}/100</div>
                        </div>
                        <div className="bg-slate-900/60 rounded p-2">
                            <div className="text-slate-500 uppercase tracking-wider text-[10px] mb-0.5">Action</div>
                            <div className="text-slate-400">{threat.action.replace(/_/g, ' ')}</div>
                        </div>
                        <div className="bg-slate-900/60 rounded p-2">
                            <div className="text-slate-500 uppercase tracking-wider text-[10px] mb-0.5">Status</div>
                            <div className={isBlocked ? 'text-slate-400' : 'text-amber-400 font-bold'}>{threat.status}</div>
                        </div>
                    </div>
                    {!isBlocked && threat.riskScore >= 50 && (
                        <div className="mt-2 px-2 py-1.5 bg-red-500/5 border border-red-500/20 rounded text-red-400">
                            ⚠ Not yet blocked — Response Agent may still be processing.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ThreatTable = ({ threats, onViewThreats }) => {
    return (
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex flex-col h-full min-h-[400px] max-h-[600px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/60">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-bold text-slate-200 tracking-tight">Live Threat Monitoring</h3>
                    {threats?.length > 0 && (
                        <span className="text-xs font-mono text-slate-500">({threats.length} events)</span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-xs font-mono tracking-widest text-red-500 font-bold uppercase">Live</span>
                    </div>
                    {onViewThreats && threats?.filter(t => t.riskScore >= 50).length > 0 && (
                        <button
                            onClick={onViewThreats}
                            className="flex items-center gap-1 text-xs font-mono text-red-400 border border-red-500/30 bg-red-500/10 px-2 py-1 rounded hover:bg-red-500/20 transition-colors"
                        >
                            <ShieldAlert className="w-3 h-3" />
                            {threats.filter(t => t.riskScore >= 50).length} High Risk
                        </button>
                    )}
                </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {!threats || threats.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-500 font-mono text-sm">
                        Waiting for telemetry...
                    </div>
                ) : (
                    threats.map((threat, idx) => (
                        <ThreatRow key={idx} threat={threat} />
                    ))
                )}
            </div>

            {/* Bottom Fade */}
            <div className="h-6 w-full bg-gradient-to-t from-slate-900/80 to-transparent absolute bottom-0 left-0 pointer-events-none"></div>
        </div>
    );
};

export default ThreatTable;
