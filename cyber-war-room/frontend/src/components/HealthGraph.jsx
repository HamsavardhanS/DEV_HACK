import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Activity } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const HealthGraph = ({ currentHealth }) => {
    // Rolling window of last 20 real snapshots
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (!currentHealth) return;

        setHistory(prev => {
            const timeStr = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
            const snapshot = {
                time: timeStr,
                cpu: Math.round(currentHealth.cpu_usage ?? 0),
                memory: Math.round(currentHealth.memory_usage ?? 0),
                threats: currentHealth.active_threats ?? 0,
                events: currentHealth.event_processing_rate ?? 0,
            };
            const updated = [...prev, snapshot];
            return updated.length > 20 ? updated.slice(-20) : updated;
        });
    }, [currentHealth]);

    const data = {
        labels: history.map(d => d.time),
        datasets: [
            {
                label: 'CPU (%)',
                data: history.map(d => d.cpu),
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.08)',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: true,
                yAxisID: 'y',
            },
            {
                label: 'Memory (%)',
                data: history.map(d => d.memory),
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.06)',
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.4,
                borderDash: [4, 4],
                fill: false,
                yAxisID: 'y',
            },
            {
                label: 'Events/min',
                data: history.map(d => d.events),
                borderColor: '#10b981',
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0.4,
                borderDash: [6, 3],
                fill: false,
                yAxisID: 'y',
            },
            {
                label: 'Active Threats',
                data: history.map(d => d.threats),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderWidth: 2.5,
                pointRadius: d => d.raw > 0 ? 4 : 0,
                pointBackgroundColor: '#ef4444',
                tension: 0.1,
                fill: true,
                yAxisID: 'yThreats',
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { mode: 'index', intersect: false },
        scales: {
            y: {
                type: 'linear',
                position: 'left',
                beginAtZero: true,
                max: 100,
                grid: { color: 'rgba(51, 65, 85, 0.4)', drawBorder: false },
                ticks: { color: '#64748b', font: { family: 'monospace', size: 10 }, callback: v => v + '%' }
            },
            yThreats: {
                type: 'linear',
                position: 'right',
                beginAtZero: true,
                grid: { drawOnChartArea: false },
                ticks: {
                    color: '#ef4444',
                    font: { family: 'monospace', size: 10 },
                    stepSize: 1,
                    callback: v => Number.isInteger(v) ? v : ''
                },
                title: { display: true, text: 'Threats', color: '#ef4444', font: { size: 9 } }
            },
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: '#475569', font: { family: 'monospace', size: 9 }, maxRotation: 45, minRotation: 45, maxTicksLimit: 10 }
            }
        },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: { color: '#94a3b8', boxWidth: 10, usePointStyle: true, font: { size: 10 } }
            },
            tooltip: {
                backgroundColor: 'rgba(2, 6, 23, 0.95)',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                borderColor: 'rgba(51, 65, 85, 0.8)',
                borderWidth: 1,
                padding: 10,
                displayColors: true,
                boxPadding: 4,
            }
        }
    };

    return (
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] h-[300px] flex flex-col group hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center justify-between mb-2 relative z-10">
                <h3 className="text-sm font-bold text-slate-200 tracking-wider uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Live Telemetry Graph
                </h3>
                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                    {history.length > 0 && (
                        <>
                            <span className="text-cyan-400">CPU: {history[history.length - 1]?.cpu}%</span>
                            <span className="text-purple-400">MEM: {history[history.length - 1]?.memory}%</span>
                            <span className={history[history.length - 1]?.threats > 0 ? 'text-red-400 font-bold' : 'text-slate-600'}>
                                THREATS: {history[history.length - 1]?.threats}
                            </span>
                        </>
                    )}
                </div>
            </div>
            <div className="flex-1 relative w-full h-full">
                {history.length > 1 ? (
                    <Line data={data} options={options} />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-mono text-xs">
                        Collecting telemetry data...
                    </div>
                )}
            </div>
        </div>
    );
};

export default HealthGraph;
