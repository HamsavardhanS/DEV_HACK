import React from 'react';
import { Activity } from 'lucide-react';

const ThreatTable = ({ threats }) => {

    // Helper to get severity style
    const getSeverityDetails = (score) => {
        if (score >= 80) return { label: 'High', style: 'bg-red-500/10 text-red-500 border border-red-500/20' };
        if (score >= 50) return { label: 'Medium', style: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' };
        return { label: 'Low', style: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' };
    };

    return (
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex flex-col h-full min-h-[400px] max-h-[600px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/60">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-bold text-slate-200 tracking-tight">Live Threat Monitoring</h3>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-xs font-mono tracking-widest text-red-500 font-bold uppercase">Live</span>
                </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {!threats || threats.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-500 font-mono text-sm">
                        Waiting for telemetry...
                    </div>
                ) : (
                    threats.map((threat, idx) => {
                        const sev = getSeverityDetails(threat.riskScore);

                        return (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-700/30 bg-slate-800/30 hover:bg-slate-800/60 hover:border-cyan-500/20 transition-all font-mono">
                                {/* Left Side: ID, Type, Badge */}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full ${threat.status === 'Blocked' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                        <Activity className="w-4 h-4 text-slate-500" />
                                        <span className="text-slate-300 font-semibold text-sm">
                                            {/* Simulate a short T-xxx ID by slicing the real UUID */}
                                            T-{threat.eventId.substring(0, 3).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-slate-200 text-sm w-32 truncate">{threat.type}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] tracking-wider uppercase ${sev.style}`}>
                                        {sev.label}
                                    </span>
                                </div>

                                {/* Right Side: Action, Time */}
                                <div className="flex items-center gap-6 text-xs text-slate-400">
                                    <span className="truncate max-w-[200px] text-right">
                                        {threat.action.replace(/_/g, ' ')}
                                    </span>
                                    <span className="w-20 text-right opacity-70">
                                        {new Date(threat.time).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom Fade */}
            <div className="h-4 w-full bg-gradient-to-t from-slate-900/80 to-transparent absolute bottom-0 left-0 pointer-events-none"></div>
        </div>
    );
};

export default ThreatTable;

