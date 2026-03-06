import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, Ban, Activity, AlertTriangle, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchBlockedIps } from '../services/api';

const getRiskLevel = (score) => {
    if (score >= 80) return { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-500' };
    if (score >= 50) return { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', dot: 'bg-orange-500' };
    return { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', dot: 'bg-yellow-500' };
};

const ThreatRow = ({ threat, idx }) => {
    const [expanded, setExpanded] = useState(false);
    const risk = getRiskLevel(threat.riskScore);
    const isBlocked = threat.status === 'Blocked';

    return (
        <div className={`rounded-lg border ${risk.border} ${risk.bg} overflow-hidden`}>
            <div
                className="flex items-center justify-between p-3 cursor-pointer hover:brightness-125 transition-all"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${risk.dot} ${!isBlocked ? 'animate-pulse' : ''}`}></div>
                    <span className="text-slate-100 font-semibold text-sm">{threat.type}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-bold ${risk.bg} ${risk.color} border ${risk.border}`}>
                        {risk.label} — {threat.riskScore}
                    </span>
                    {isBlocked && (
                        <span className="px-2 py-0.5 rounded text-[10px] tracking-wider uppercase bg-slate-500/20 text-slate-400 border border-slate-500/30">
                            Blocked
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                    <span className="font-mono text-xs">{new Date(threat.time).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}</span>
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </div>

            {expanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-700/50 font-mono text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-slate-900/60 rounded p-2">
                            <div className="text-slate-500 uppercase tracking-wider text-[10px] mb-1">Event ID</div>
                            <div className="text-slate-300">{threat.eventId}</div>
                        </div>
                        <div className="bg-slate-900/60 rounded p-2">
                            <div className="text-slate-500 uppercase tracking-wider text-[10px] mb-1">Risk Score</div>
                            <div className={risk.color + ' font-bold'}>{threat.riskScore}/100</div>
                        </div>
                        <div className="bg-slate-900/60 rounded p-2">
                            <div className="text-slate-500 uppercase tracking-wider text-[10px] mb-1">Action Taken</div>
                            <div className="text-slate-300">{threat.action.replace(/_/g, ' ')}</div>
                        </div>
                        <div className="bg-slate-900/60 rounded p-2">
                            <div className="text-slate-500 uppercase tracking-wider text-[10px] mb-1">Status</div>
                            <div className={isBlocked ? 'text-slate-400' : risk.color}>{threat.status}</div>
                        </div>
                    </div>
                    <div className="bg-slate-900/60 rounded p-2">
                        <div className="text-slate-500 uppercase tracking-wider text-[10px] mb-1">Timestamp</div>
                        <div className="text-slate-300">{new Date(threat.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
                    </div>
                    {!isBlocked && (
                        <div className="mt-2 p-2 bg-red-500/5 border border-red-500/20 rounded text-red-400">
                            ⚠ This threat has NOT been blocked. The Response Agent is monitoring it.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const DetailModal = ({ isOpen, type, onClose, threats }) => {
    const [blockedIps, setBlockedIps] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && type === 'blockedIps') {
            setLoading(true);
            fetchBlockedIps().then(data => {
                setBlockedIps(data || []);
                setLoading(false);
            });
        }
    }, [isOpen, type]);

    if (!isOpen) return null;

    const highRiskThreats = (threats || []).filter(t => t.riskScore >= 50).sort((a, b) => b.riskScore - a.riskScore);
    const unblockedHighRisk = highRiskThreats.filter(t => t.status !== 'Blocked');
    const blockedHighRisk = highRiskThreats.filter(t => t.status === 'Blocked');

    const titles = {
        activeThreats: { label: 'Active Threats', icon: <ShieldAlert className="w-5 h-5 text-red-500" /> },
        blockedIps: { label: 'Blocked IPs', icon: <Ban className="w-5 h-5 text-orange-500" /> },
        totalEvents: { label: 'Total Events', icon: <Activity className="w-5 h-5 text-cyan-500" /> },
    };

    const current = titles[type] || { label: 'Detail View', icon: <Eye className="w-5 h-5 text-slate-400" /> };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm font-sans text-slate-300" onClick={onClose}>
            <div
                className="bg-slate-950 border border-slate-700 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] w-full max-w-2xl max-h-[85vh] flex flex-col relative overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-5 py-4 border-b border-slate-800 bg-slate-900/90">
                    <div className="flex items-center gap-3">
                        {current.icon}
                        <h2 className="text-base font-bold text-white tracking-wide">{current.label}</h2>
                        {type === 'activeThreats' && (
                            <span className="text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">
                                {highRiskThreats.length} High-Risk Events
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent space-y-3">

                    {/* === ACTIVE THREATS VIEW === */}
                    {type === 'activeThreats' && (
                        <>
                            {highRiskThreats.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-500 font-mono text-sm gap-2">
                                    <ShieldAlert className="w-8 h-8 opacity-30" />
                                    No high-risk threats detected.
                                </div>
                            ) : (
                                <>
                                    {unblockedHighRisk.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                                <span className="text-xs font-bold uppercase tracking-widest text-red-400">Unblocked — Needs Action</span>
                                            </div>
                                            <div className="space-y-2">
                                                {unblockedHighRisk.map((threat, idx) => (
                                                    <ThreatRow key={idx} threat={threat} idx={idx} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {blockedHighRisk.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 mt-4">
                                                <Ban className="w-4 h-4 text-slate-500" />
                                                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Mitigated — Blocked</span>
                                            </div>
                                            <div className="space-y-2">
                                                {blockedHighRisk.map((threat, idx) => (
                                                    <ThreatRow key={idx} threat={threat} idx={idx} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* === BLOCKED IPS VIEW === */}
                    {type === 'blockedIps' && (
                        <>
                            {loading ? (
                                <div className="flex items-center justify-center h-40">
                                    <div className="animate-spin text-orange-500"><Activity /></div>
                                </div>
                            ) : blockedIps.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-500 font-mono text-sm gap-2">
                                    <Ban className="w-8 h-8 opacity-30" />
                                    No IP addresses have been blocked yet.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {blockedIps.map((b, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-orange-500/20 hover:bg-slate-800 transition-colors">
                                            <div className="flex items-center gap-3 font-mono">
                                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                <span className="text-slate-200 font-semibold">{b.ip}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-slate-400 font-mono">
                                                    {new Date(b.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                                </div>
                                                <div className="text-[10px] text-orange-500 uppercase tracking-wider mt-0.5">Blocked</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/80 text-xs font-mono text-slate-600 flex justify-between">
                    <span>Data sourced live from DB</span>
                    <span>Updated {new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}</span>
                </div>
            </div>
        </div>
    );
};

export default DetailModal;
