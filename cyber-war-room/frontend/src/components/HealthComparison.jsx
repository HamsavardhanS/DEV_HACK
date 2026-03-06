import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from 'lucide-react';

const HealthComparison = ({ health }) => {
    if (!health) return null;

    // Normal baseline expectations
    const baseline = {
        cpu_usage: 15,
        event_processing_rate: 10,
        active_threats: 0,
        system_stability: 100
    };

    const compares = [
        { label: 'CPU Load', current: health.cpu_usage, base: baseline.cpu_usage, unit: '%' },
        { label: 'Event Rate', current: health.event_processing_rate, base: baseline.event_processing_rate, unit: '/m' },
        { label: 'Threats', current: health.active_threats, base: baseline.active_threats, unit: '' },
        { label: 'Stability', current: health.system_stability, base: baseline.system_stability, unit: '' }
    ];

    return (
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] h-full flex flex-col justify-between">
            <h3 className="text-lg font-bold text-slate-200 tracking-tight mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                State Drift Monitor
            </h3>

            <div className="space-y-3">
                <div className="grid grid-cols-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">
                    <div>Metric</div>
                    <div className="text-center">Baseline</div>
                    <div className="text-right">Current</div>
                </div>

                {compares.map((c, i) => {
                    const diff = c.current - c.base;
                    const isWorse = (c.label === 'Stability' && diff < 0) || (c.label !== 'Stability' && diff > 0);

                    return (
                        <div key={i} className="grid grid-cols-3 items-center text-sm font-mono bg-slate-800/20 p-2 rounded border border-slate-700/30">
                            <div className="text-slate-300 font-sans font-medium">{c.label}</div>
                            <div className="text-center text-slate-500">{c.base}{c.unit}</div>
                            <div className="text-right flex items-center justify-end gap-2">
                                <span className={isWorse && diff !== 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                                    {c.current}{c.unit}
                                </span>
                                {diff > 0 ? (
                                    <ArrowUpRight className={`w-4 h-4 ${isWorse ? 'text-red-500' : 'text-emerald-500'}`} />
                                ) : diff < 0 ? (
                                    <ArrowDownRight className={`w-4 h-4 ${isWorse ? 'text-red-500' : 'text-emerald-500'}`} />
                                ) : (
                                    <Minus className="w-4 h-4 text-slate-600" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HealthComparison;
