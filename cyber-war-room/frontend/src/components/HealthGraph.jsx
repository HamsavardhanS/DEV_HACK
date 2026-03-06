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
    // Keep a rolling window of the last 15 health data points
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (!currentHealth) return;

        setHistory(prev => {
            const timeStr = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
            const snapshot = {
                time: timeStr,
                cpu: currentHealth.cpu_usage,
                events: currentHealth.event_processing_rate,
                threats: currentHealth.active_threats * 10 // Multiply by 10 to make it visible on the same Y-axis scale
            };
            const newHistory = [...prev, snapshot];
            if (newHistory.length > 15) newHistory.shift();
            return newHistory;
        });
    }, [currentHealth]);

    const data = {
        labels: history.map(d => d.time),
        datasets: [
            {
                label: 'CPU Usage (%)',
                data: history.map(d => d.cpu),
                borderColor: '#06b6d4', // cyan-500
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: true,
            },
            {
                label: 'Event Rate (evt/min)',
                data: history.map(d => d.events),
                borderColor: '#10b981', // emerald-500
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                tension: 0.4,
            },
            {
                label: 'Threat Spike (Scaled x10)',
                data: history.map(d => d.threats),
                borderColor: '#ef4444', // red-500
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: '#ef4444',
                tension: 0.1,
                fill: true,
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 }, // Disable animation for snappy live updates
        scales: {
            y: {
                beginAtZero: true,
                suggestedMax: 100, // Give headroom but allow scaling up
                grid: { color: 'rgba(51, 65, 85, 0.5)', drawBorder: false },
                ticks: { color: '#94a3b8', font: { family: 'monospace', size: 10 } }
            },
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: '#64748b', font: { family: 'monospace', size: 9 }, maxRotation: 45, minRotation: 45 }
            }
        },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: { color: '#94a3b8', boxWidth: 10, usePointStyle: true, font: { size: 10 } }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
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
            <h3 className="text-sm font-bold text-slate-200 tracking-wider mb-2 uppercase flex items-center gap-2 relative z-10">
                <Activity className="w-4 h-4 text-emerald-400" />
                Live Telemetry Graph
            </h3>
            <div className="flex-1 relative w-full h-full">
                {history.length > 0 ? (
                    <Line data={data} options={options} />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-mono text-xs">Waiting for telemetry data...</div>
                )}
            </div>
        </div>
    );
};

export default HealthGraph;
