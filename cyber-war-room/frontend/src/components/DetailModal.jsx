import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, Ban, Activity } from 'lucide-react';
import { fetchBlockedIps } from '../services/api';

const DetailModal = ({ isOpen, type, onClose, threats }) => {
    const [blockedIps, setBlockedIps] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && type === 'blockedIps') {
            setLoading(true);
            fetchBlockedIps().then(data => {
                setBlockedIps(data);
                setLoading(false);
            });
        }
    }, [isOpen, type]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans text-slate-300">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] w-full max-w-2xl max-h-[80vh] flex flex-col relative overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        {type === 'activeThreats' ? (
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                        ) : (
                            <Ban className="w-5 h-5 text-orange-500" />
                        )}
                        <h2 className="text-lg font-bold text-white tracking-wide">
                            {type === 'activeThreats' ? 'Active Threats' : 'Blocked IPs'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {type === 'blockedIps' && (
                        <div>
                            {loading ? (
                                <div className="flex items-center justify-center h-40">
                                    <div className="animate-spin text-orange-500"><Activity /></div>
                                </div>
                            ) : blockedIps.length === 0 ? (
                                <div className="text-center text-slate-500 py-10">No IP addresses have been blocked yet.</div>
                            ) : (
                                <div className="space-y-2">
                                    {blockedIps.map((b, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                            <div className="flex items-center gap-3 font-mono">
                                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                <span className="text-slate-200">{b.ip}</span>
                                            </div>
                                            <span className="text-xs text-slate-500 font-mono">
                                                {new Date(b.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {type === 'activeThreats' && (
                        <div>
                            {threats.filter(t => t.riskScore >= 50).length === 0 ? (
                                <div className="text-center text-slate-500 py-10">No active high-risk threats currently.</div>
                            ) : (
                                <div className="space-y-2 font-mono">
                                    {threats.filter(t => t.riskScore >= 50).map((threat, idx) => (
                                        <div key={idx} className="flex flex-col gap-2 bg-red-500/5 border border-red-500/20 p-3 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                                    <span className="text-slate-200">{threat.type}</span>
                                                    <span className="px-2 py-0.5 rounded text-[10px] tracking-wider uppercase bg-red-500/20 text-red-500 border border-red-500/30">
                                                        Risk: {threat.riskScore}
                                                    </span>
                                                    {threat.status === 'Blocked' && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] tracking-wider uppercase bg-orange-500/20 text-orange-500 border border-orange-500/30">
                                                            Blocked
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                                                <span>Event ID: {threat.eventId}</span>
                                                <span>{new Date(threat.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default DetailModal;
