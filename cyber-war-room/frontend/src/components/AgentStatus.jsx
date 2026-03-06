import React from 'react';
import { Shield, Eye, FileText, BrainCircuit, Search, Database } from 'lucide-react';

const AgentStatus = ({ agents }) => {
    // Mapping internal agent names to the reference UI's stylized names and icons
    const agentMap = {
        'Monitoring Agent': { title: 'SENTINEL', icon: Eye, desc: 'Scanning 2.4M log entries/min' },
        'Threat Agent': { title: 'ORACLE', icon: Search, desc: 'Anomaly detection on active subnets' },
        'Risk Agent': { title: 'CIPHER', icon: BrainCircuit, desc: 'Classifying attack patterns' },
        'Response Agent': { title: 'AEGIS', icon: Shield, desc: 'Enforcing active countermeasures' },
        'Forensic Agent': { title: 'ARCHIVE', icon: FileText, desc: 'Generating structured incident reports' },
        'Learning Agent': { title: 'EVOLVE', icon: Database, desc: 'Updating threat models' }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-slate-200 tracking-tight">Multi-Agent Defense Team</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents?.map((agent, idx) => {
                    const mapped = agentMap[agent.name] || { title: agent.name.toUpperCase(), icon: Eye, desc: 'Active processing' };
                    const Icon = mapped.icon;
                    // Determine if active based on the 'active' prop, else just show processing if it has recent tasks
                    const isActive = agent.active || idx % 2 === 0; // fallback logic for demo if needed

                    return (
                        <div key={idx} className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)] group hover:border-cyan-500/30 transition-colors flex gap-4 items-start">
                            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/50 shadow-inner group-hover:border-cyan-500/20 transition-colors">
                                <Icon className={`w-6 h-6 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-bold text-slate-200 tracking-wide">{mapped.title}</h4>
                                    <span className="flex flex-col justify-center">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                    </span>
                                    <span className={`text-[10px] font-mono uppercase tracking-wider ${isActive ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {isActive ? 'Active' : 'Processing'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 font-medium mb-2">{agent.name}</p>
                                <p className="text-xs text-slate-300 font-mono tracking-tight truncate">
                                    {isActive ? mapped.desc : 'idle...'}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-2 font-mono">
                                    {Math.floor(Math.random() * 5000) + 100} tasks completed
                                </p>
                            </div>
                            {/* Subtle glow effect behind icon */}
                            {isActive && <div className="absolute top-4 left-4 w-12 h-12 bg-cyan-500/10 rounded-full blur-xl pointer-events-none"></div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AgentStatus;
