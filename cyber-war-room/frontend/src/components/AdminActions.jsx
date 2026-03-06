import React from 'react';
import { Ban, Key, MonitorOff, FileOutput } from 'lucide-react';

const AdminActions = () => {
    return (
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-colors">
            <h3 className="text-lg font-bold text-slate-200 tracking-tight mb-4">Admin Actions</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Block Suspicious IP */}
                <button className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-800/20 hover:bg-slate-800/60 hover:border-cyan-500/40 transition-all text-left group">
                    <div className="p-3 rounded-lg border border-slate-700/50 bg-slate-900 shadow-inner group-hover:border-cyan-500/30 transition-colors">
                        <Ban className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-200">Block Suspicious IP</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Firewall rule injection</p>
                    </div>
                </button>

                {/* Quarantine Device */}
                <button className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-800/20 hover:bg-slate-800/60 hover:border-cyan-500/40 transition-all text-left group">
                    <div className="p-3 rounded-lg border border-slate-700/50 bg-slate-900 shadow-inner group-hover:border-cyan-500/30 transition-colors">
                        <MonitorOff className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-200">Quarantine Device</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Network isolation protocol</p>
                    </div>
                </button>

                {/* Trigger MFA */}
                <button className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-800/20 hover:bg-slate-800/60 hover:border-cyan-500/40 transition-all text-left group">
                    <div className="p-3 rounded-lg border border-slate-700/50 bg-slate-900 shadow-inner group-hover:border-cyan-500/30 transition-colors">
                        <Key className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-200">Trigger MFA Verification</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Force re-authentication</p>
                    </div>
                </button>

                {/* Generate Report */}
                <button className="flex items-center gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-800/20 hover:bg-slate-800/60 hover:border-cyan-500/40 transition-all text-left group">
                    <div className="p-3 rounded-lg border border-slate-700/50 bg-slate-900 shadow-inner group-hover:border-cyan-500/30 transition-colors">
                        <FileOutput className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-200">Generate Forensic Report</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Full audit trail export</p>
                    </div>
                </button>

            </div>
        </div>
    );
};

export default AdminActions;
