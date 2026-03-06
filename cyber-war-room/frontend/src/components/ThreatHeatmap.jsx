import React from 'react';
import { Grid } from 'lucide-react';

const ThreatHeatmap = ({ distribution }) => {
    if (!distribution) return null;

    // Simulate "time windows" (columns) for the heatmap based on the aggregate distribution.
    // In a full implementation, the backend would return arrays of counts per time block.
    // Here we procedurally generate a plausible heatmap grid from the total counts.

    const threatTypes = ['DDoS', 'Brute Force', 'Malware', 'Privilege Escalation', 'Suspicious Activity'];
    const timeSlots = ['T-4m', 'T-3m', 'T-2m', 'T-1m', 'Live'];

    // Generate pseudo-random historical data that trends towards the actual Live distribution
    const generateIntensity = (type, slotIdx) => {
        const total = distribution[type] || 0;
        if (total === 0) return 0;

        // The closer to `Live` (slotIdx 4), the higher the value, simulating a ramping attack.
        const base = Math.max(0, (total / 5) * (slotIdx / 4));
        // Add some noise
        const val = base + (Math.random() * (total * 0.2));
        return Math.floor(val);
    };

    const getColorClass = (val, maxVal) => {
        if (val === 0) return 'bg-slate-800/30 border-slate-800';
        const ratio = val / Math.max(1, maxVal);
        if (ratio > 0.75) return 'bg-red-500 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)] z-10';
        if (ratio > 0.4) return 'bg-orange-500 border-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.4)] z-10';
        if (ratio > 0.1) return 'bg-yellow-500/80 border-yellow-500/50 shadow-[0_0_5px_rgba(234,179,8,0.3)] z-10';
        return 'bg-cyan-500/50 border-cyan-500/50 shadow-[0_0_5px_rgba(6,182,212,0.3)] z-10';
    };

    // Find max value for normalization
    let maxIntensity = 1;
    threatTypes.forEach(t => { if (distribution[t] > maxIntensity) maxIntensity = distribution[t]; });

    return (
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <h3 className="text-sm font-bold text-slate-200 tracking-wider mb-4 uppercase flex items-center gap-2">
                <Grid className="w-4 h-4 text-orange-400" />
                Threat Heatmap (5m Window)
            </h3>

            <div className="w-full flex">
                {/* Y-Axis Labels */}
                <div className="flex flex-col justify-around pr-4 border-r border-slate-800 space-y-1">
                    {threatTypes.map(t => (
                        <div key={t} className="h-8 flex items-center text-[10px] font-mono text-slate-400 text-right w-24 truncate">
                            {t}
                        </div>
                    ))}
                </div>

                {/* Heatmap Grid */}
                <div className="flex-1 flex flex-col justify-around pl-4 space-y-1">
                    {threatTypes.map(type => (
                        <div key={type} className="flex gap-1 h-8">
                            {timeSlots.map((slot, idx) => {
                                const intensity = generateIntensity(type, idx);
                                return (
                                    <div
                                        key={slot}
                                        className={`flex-1 rounded-sm border ${getColorClass(intensity, maxIntensity)} transition-all duration-1000 relative group cursor-pointer`}
                                    >
                                        {/* Tooltip on hover */}
                                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-black text-white text-[10px] font-mono py-0.5 px-2 rounded pointer-events-none whitespace-nowrap z-50">
                                            {intensity} events
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* X-Axis Labels */}
            <div className="w-full flex ml-28 pl-4 mt-2">
                {timeSlots.map(slot => (
                    <div key={slot} className="flex-1 text-center text-[10px] font-mono text-slate-500">
                        {slot}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ThreatHeatmap;
