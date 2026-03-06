import React, { useEffect, useState } from 'react';
import { Grid, RefreshCw } from 'lucide-react';
import { fetchHeatmap } from '../services/api';

const getColorClass = (val, maxVal) => {
    if (val === 0) return 'bg-slate-800/20 border-slate-800/60';
    const ratio = val / Math.max(1, maxVal);
    if (ratio > 0.75) return 'bg-red-500 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
    if (ratio > 0.45) return 'bg-orange-500/90 border-orange-400/80 shadow-[0_0_8px_rgba(249,115,22,0.4)]';
    if (ratio > 0.15) return 'bg-yellow-500/70 border-yellow-500/50';
    return 'bg-cyan-500/40 border-cyan-500/40';
};

const ThreatHeatmap = () => {
    const [heatmapData, setHeatmapData] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        const data = await fetchHeatmap();
        setHeatmapData(data);
        setLoading(false);
    };

    useEffect(() => {
        load();
        const interval = setInterval(load, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex items-center justify-center h-40">
                <RefreshCw className="w-5 h-5 text-slate-600 animate-spin" />
            </div>
        );
    }

    if (!heatmapData || !heatmapData.slots || heatmapData.slots.length === 0) {
        return (
            <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                <h3 className="text-sm font-bold text-slate-200 tracking-wider mb-4 uppercase flex items-center gap-2">
                    <Grid className="w-4 h-4 text-orange-400" />
                    Threat Heatmap (10m Window)
                </h3>
                <div className="flex items-center justify-center h-32 text-slate-500 font-mono text-sm">
                    Waiting for threat data...
                </div>
            </div>
        );
    }

    const { slots, types } = heatmapData;

    // Find the max count across all cells for normalization
    let maxVal = 1;
    slots.forEach(slot => {
        types.forEach(type => {
            const v = slot.counts[type] || 0;
            if (v > maxVal) maxVal = v;
        });
    });

    // Calculate totals per type for the right-side summary
    const typeTotals = {};
    types.forEach(type => {
        typeTotals[type] = slots.reduce((sum, slot) => sum + (slot.counts[type] || 0), 0);
    });

    return (
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-200 tracking-wider uppercase flex items-center gap-2">
                    <Grid className="w-4 h-4 text-orange-400" />
                    Threat Heatmap (10m Window)
                </h3>
                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block"></span> Critical</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-500/90 inline-block"></span> High</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-500/70 inline-block"></span> Medium</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-cyan-500/40 inline-block"></span> Low</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-slate-800/20 border border-slate-800/60 inline-block"></span> None</span>
                </div>
            </div>

            <div className="w-full flex gap-3">
                {/* Y-Axis Labels */}
                <div className="flex flex-col justify-around pr-3 border-r border-slate-800">
                    {types.map(t => (
                        <div key={t} className="h-8 flex items-center text-[10px] font-mono text-slate-400 text-right w-28 truncate justify-end">
                            {t}
                        </div>
                    ))}
                </div>

                {/* Heatmap Grid */}
                <div className="flex-1 flex flex-col justify-around gap-1">
                    {types.map(type => (
                        <div key={type} className="flex gap-1 h-8">
                            {slots.map((slot, idx) => {
                                const val = slot.counts[type] || 0;
                                const isLive = idx === slots.length - 1;
                                return (
                                    <div
                                        key={idx}
                                        className={`flex-1 rounded-sm border ${getColorClass(val, maxVal)} transition-colors duration-700 relative group cursor-default ${isLive && val > 0 ? 'ring-1 ring-white/20' : ''}`}
                                    >
                                        {/* Tooltip */}
                                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-950 text-white text-[10px] font-mono py-1 px-2 rounded border border-slate-700 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                            <div className="text-slate-400">{slot.time}{isLive ? ' (Live)' : ''}</div>
                                            <div className="font-bold">{type}: {val} event{val !== 1 ? 's' : ''}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Right: Total counts per type */}
                <div className="flex flex-col justify-around pl-3 border-l border-slate-800">
                    {types.map(type => (
                        <div key={type} className="h-8 flex items-center">
                            <span className={`text-xs font-mono font-bold ${typeTotals[type] > 0 ? 'text-orange-400' : 'text-slate-700'}`}>
                                {typeTotals[type]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* X-Axis Labels */}
            <div className="flex mt-2 gap-1 pl-[calc(7rem+0.75rem+0.25rem)]">
                {slots.map((slot, idx) => (
                    <div key={idx} className={`flex-1 text-center text-[9px] font-mono ${idx === slots.length - 1 ? 'text-cyan-400 font-bold' : 'text-slate-600'}`}>
                        {idx === slots.length - 1 ? 'Now' : idx % 2 === 0 ? slot.time : ''}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ThreatHeatmap;
