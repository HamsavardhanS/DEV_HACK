import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { ShieldAlert } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const AttackChart = ({ distribution }) => {
    // Standardized categories
    const categories = ['DDoS', 'Brute Force', 'Malware', 'Suspicious Activity', 'Privilege Escalation'];

    // Use distribution from props or fallback to zeros
    const distData = distribution || categories.reduce((obj, cat) => ({ ...obj, [cat]: 0 }), {});

    const data = {
        labels: categories,
        datasets: [
            {
                label: 'Occurrences',
                data: categories.map(cat => distData[cat] || 0),
                backgroundColor: 'rgba(6, 182, 212, 0.9)', // Cyan-400 equivalent
                hoverBackgroundColor: 'rgba(34, 211, 238, 1)', // Cyan-300 on hover
                borderRadius: 4,
                borderSkipped: false,
                barThickness: 'flex',
                maxBarThickness: 40,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(51, 65, 85, 0.3)',
                    drawBorder: false,
                },
                ticks: {
                    color: '#64748b',
                    font: { family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', size: 10 }
                }
            },
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    color: '#94a3b8',
                    font: { size: 11 }
                }
            }
        },
        plugins: {
            legend: {
                display: false, // Hide legend for cleaner bar chart
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#38bdf8',
                bodyColor: '#e2e8f0',
                borderColor: 'rgba(6, 182, 212, 0.3)',
                borderWidth: 1,
            }
        },
    };

    return (
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] h-full flex flex-col group hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center gap-2 mb-6">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-slate-200 tracking-tight">Active Threat Types</h3>
            </div>
            <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase absolute top-14 left-5">Distribution Volume</p>
            <div className="flex-1 relative min-h-[250px] mt-4">
                <Bar options={options} data={data} />
            </div>
        </div>
    );
};

export default AttackChart;

