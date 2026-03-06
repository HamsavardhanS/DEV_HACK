import React from 'react';
import { ScanSearch, LineChart, Tags, ShieldCheck, FileText, Brain } from 'lucide-react';

const steps = [
    { id: 'detect', label: 'DETECT', icon: ScanSearch, active: true, color: 'text-cyan-400', border: 'border-cyan-500/50', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]' },
    { id: 'analyze', label: 'ANALYZE', icon: LineChart, active: true, color: 'text-cyan-400', border: 'border-cyan-500/50', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]' },
    { id: 'classify', label: 'CLASSIFY', icon: Tags, active: true, color: 'text-cyan-400', border: 'border-cyan-500/50', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]' },
    { id: 'respond', label: 'RESPOND', icon: ShieldCheck, active: false, color: 'text-slate-500', border: 'border-slate-700/50', glow: '' },
    { id: 'report', label: 'REPORT', icon: FileText, active: false, color: 'text-slate-500', border: 'border-slate-700/50', glow: '' },
    { id: 'learn', label: 'LEARN', icon: Brain, active: false, color: 'text-slate-500', border: 'border-slate-700/50', glow: '' }
];

const IncidentWorkflow = () => {
    return (
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <h3 className="text-lg font-bold text-slate-200 tracking-tight mb-6">Incident Response Workflow</h3>

            <div className="flex items-center justify-center w-full overflow-x-auto pb-4 scrollbar-none">
                <div className="flex items-center space-x-2 md:space-x-4">
                    {steps.map((step, idx) => {
                        const Icon = step.icon;
                        return (
                            <React.Fragment key={step.id}>
                                <div className={`flex flex-col items-center justify-center w-20 h-24 md:w-24 md:h-28 rounded-xl border ${step.border} bg-slate-900/80 ${step.glow} transition-all duration-500`}>
                                    <Icon className={`w-6 h-6 md:w-8 md:h-8 mb-3 ${step.color}`} />
                                    <span className={`text-[10px] md:text-xs font-bold tracking-widest ${step.color}`}>
                                        {step.label}
                                    </span>
                                </div>

                                {/* Connector Arrow */}
                                {idx < steps.length - 1 && (
                                    <div className={`text-xl ${step.active ? 'text-cyan-500/80' : 'text-slate-700'}`}>
                                        ›
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default IncidentWorkflow;
