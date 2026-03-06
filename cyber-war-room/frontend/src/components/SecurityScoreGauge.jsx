import React from 'react';
import { Target } from 'lucide-react';

const SecurityScoreGauge = ({ score }) => {
    // If we don't have a score yet, show a pulsing placeholder
    const currentScore = score !== undefined ? score : 100;

    let color = '#10b981'; // emerald-500
    let textClass = 'text-emerald-500';
    let status = 'SECURE';

    if (currentScore < 60) {
        color = '#ef4444'; // red-500
        textClass = 'text-red-500';
        status = 'CRITICAL';
    } else if (currentScore < 80) {
        color = '#eab308'; // yellow-500
        textClass = 'text-yellow-500';
        status = 'WARNING';
    }

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (currentScore / 100) * circumference;

    return (
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center">
            <h3 className="text-sm font-bold text-slate-200 tracking-wider mb-4 uppercase flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-400" />
                Security Posture
            </h3>

            <div className="relative flex items-center justify-center">
                {/* Background Track */}
                <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-slate-800"
                    />
                    {/* Foreground Glow */}
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke={color}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                        style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
                    />
                </svg>

                {/* Center Text */}
                <div className="absolute flex flex-col items-center justify-center">
                    <span className={`text-3xl font-mono font-bold ${textClass}`}>
                        {currentScore}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                        / 100
                    </span>
                </div>
            </div>

            <div className={`mt-4 text-xs font-bold tracking-widest border border-slate-700/50 px-4 py-1.5 rounded-full ${textClass} bg-slate-900 shadow-inner`}>
                {status}
            </div>

            {/* Background ambient glow based on status */}
            {status !== 'SECURE' && (
                <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[50px] pointer-events-none ${currentScore < 60 ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}></div>
            )}
        </div>
    );
};

export default SecurityScoreGauge;
