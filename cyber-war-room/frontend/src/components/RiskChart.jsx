import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Activity } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
);

const RiskChart = ({ data: riskData }) => {
    // Transform incoming array of {time, score} to chart format
    const labels = riskData?.length > 0 ? riskData.map(d => d.time) : ['--:--'];
    const scores = riskData?.length > 0 ? riskData.map(d => d.score) : [0];

    const data = {
        labels: labels,
        datasets: [
            {
                fill: true,
                label: 'Risk Score',
                data: scores,
                borderColor: 'rgb(56, 189, 248)',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                tension: 0.4,
                pointBackgroundColor: 'rgb(56, 189, 248)',
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: {
                    color: 'rgba(51, 65, 85, 0.5)',
                },
                ticks: {
                    color: '#94a3b8'
                }
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#94a3b8'
                }
            }
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#cbd5e1',
                    usePointStyle: true,
                }
            },
        },
    };

    return (
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] h-full flex flex-col group hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-slate-200 tracking-tight">Risk Score Trend</h3>
            </div>
            <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase absolute top-14 left-5">Risk Level Over Time</p>
            <div className="flex-1 relative min-h-[250px] mt-4">
                <Line options={options} data={data} />
            </div>
        </div>
    );
};

export default RiskChart;
