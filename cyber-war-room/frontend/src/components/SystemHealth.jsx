import React from 'react';
import { Cpu, MemoryStick, Database, Activity, Target, ShieldAlert } from 'lucide-react';

const SystemHealth = ({ health }) => {
    // Graceful fallback while loading
    if (!health) return null;

    const metrics = [
        { label: 'CPU Usage', value: `${health.cpu_usage}%`, progress: health.cpu_usage, icon: Cpu, color: health.cpu_usage > 80 ? 'text-red-500' : 'text-cyan-400', bg: health.cpu_usage > 80 ? 'bg-red-500' : 'bg-cyan-500' },
        { label: 'Memory', value: `${health.memory_usage}%`, progress: health.memory_usage, icon: MemoryStick, color: health.memory_usage > 85 ? 'text-red-500' : 'text-cyan-400', bg: health.memory_usage > 85 ? 'bg-red-500' : 'bg-cyan-500' },
        { label: 'Kafka Queue', value: health.kafka_queue_size, progress: Math.min(100, (health.kafka_queue_size / 200) * 100), icon: Database, color: 'text-amber-400', bg: 'bg-amber-500' },
        { label: 'Processing Rate', value: `${health.event_processing_rate}/s`, progress: Math.min(100, (health.event_processing_rate / 300) * 100), icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500' },
        { label: 'Active Threats', value: health.active_threats, progress: Math.min(100, health.active_threats * 10), icon: Target, color: health.active_threats > 0 ? 'text-red-500' : 'text-emerald-500', bg: health.active_threats > 0 ? 'bg-red-500' : 'bg-emerald-500' },
        { label: 'System Stability', value: `${health.system_stability}/100`, progress: health.system_stability, icon: ShieldAlert, color: health.system_stability < 50 ? 'text-red-500' : 'text-emerald-500', bg: health.system_stability < 50 ? 'bg-red-500' : 'bg-emerald-500' }
    ];

    return (
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] h-full flex flex-col justify-between">
            <h3 className="text-lg font-bold text-slate-200 tracking-tight mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-500" />
                System Health Monitor
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {metrics.map((m, idx) => {
                    const Icon = m.icon;
                    return (
                        <div key={idx} className="bg-slate-800/20 border border-slate-700/50 rounded-lg p-3 hover:bg-slate-800/40 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <Icon className={`w-4 h-4 ${m.color}`} />
                                    <span className="text-xs font-semibold text-slate-400">{m.label}</span>
                                </div>
                                <span className="font-mono text-sm font-bold text-slate-200">{m.value}</span>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                                <div className={`h-1.5 ${m.bg} transition-all duration-500 ease-out`} style={{ width: `${m.progress}%` }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SystemHealth;
