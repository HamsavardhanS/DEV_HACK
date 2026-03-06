import React from 'react';
import { Brain, ShieldAlert, Lightbulb, Crosshair, TrendingUp } from 'lucide-react';

/**
 * AIAnalysisPanel – Displays AI-generated threat analysis from the LLM SOC Analyst Agent.
 * Shows attack type, severity, risk score, AI narrative analysis, and mitigation recommendations.
 */

const severityConfig = {
    Critical: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.2)]' },
    High: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', glow: 'shadow-[0_0_12px_rgba(249,115,22,0.2)]' },
    Medium: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', glow: 'shadow-[0_0_12px_rgba(234,179,8,0.2)]' },
    Low: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]' },
};

const AIAnalysisPanel = ({ analyses = [] }) => {
    if (!analyses || analyses.length === 0) {
        return (
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                        <Brain className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm">AI Threat Analysis</h3>
                        <p className="text-slate-500 text-xs font-mono">GPT-4o-mini SOC Analyst</p>
                    </div>
                </div>
                <div className="text-center py-8 text-slate-500">
                    <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Waiting for AI analysis data...</p>
                    <p className="text-xs mt-1 text-slate-600">Start the LLM SOC Analyst agent to generate insights</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                        <Brain className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm">AI Threat Analysis</h3>
                        <p className="text-slate-500 text-xs font-mono">GPT-4o-mini SOC Analyst · {analyses.length} analyses</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                    </span>
                    <span className="text-purple-400 text-[10px] font-mono font-bold tracking-wider">AI ACTIVE</span>
                </div>
            </div>

            {/* Analysis Cards */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {analyses.map((item, idx) => {
                    const sev = severityConfig[item.severity] || severityConfig.Low;
                    const riskPercent = Math.min(100, item.riskScore || 0);

                    return (
                        <div
                            key={item.id || idx}
                            className={`bg-slate-800/60 border ${sev.border} rounded-lg p-4 ${sev.glow} transition-all hover:bg-slate-800/80`}
                        >
                            {/* Top Row: Attack Type + Severity + Timestamp */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                    <Crosshair className={`w-4 h-4 ${sev.text}`} />
                                    <span className="text-white font-semibold text-sm">{item.attackType || 'Unknown'}</span>
                                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${sev.bg} ${sev.text} border ${sev.border}`}>
                                        {item.severity}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-500 text-[10px] font-mono">
                                        {item.sourceIp || '—'}
                                    </span>
                                    <span className="text-slate-600 text-[10px] font-mono">
                                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : '—'}
                                    </span>
                                </div>
                            </div>

                            {/* Risk Score Bar */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="text-slate-400 text-xs font-mono">Risk</span>
                                </div>
                                <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${riskPercent >= 80 ? 'bg-red-500' :
                                                riskPercent >= 50 ? 'bg-orange-500' :
                                                    riskPercent >= 30 ? 'bg-yellow-500' : 'bg-emerald-500'
                                            }`}
                                        style={{ width: `${riskPercent}%` }}
                                    />
                                </div>
                                <span className={`text-xs font-mono font-bold ${sev.text}`}>{item.riskScore}</span>
                            </div>

                            {/* AI Analysis */}
                            <div className="mb-3">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="text-purple-400 text-[10px] font-mono font-bold tracking-wider">AI ANALYSIS</span>
                                </div>
                                <p className="text-slate-300 text-xs leading-relaxed pl-5">
                                    {item.aiAnalysis || 'No analysis available.'}
                                </p>
                            </div>

                            {/* Recommendations */}
                            {item.recommendations && item.recommendations.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                                        <span className="text-cyan-400 text-[10px] font-mono font-bold tracking-wider">RECOMMENDATIONS</span>
                                    </div>
                                    <ul className="space-y-1 pl-5">
                                        {item.recommendations.map((rec, rIdx) => (
                                            <li key={rIdx} className="text-slate-400 text-xs flex items-start gap-2">
                                                <span className="text-cyan-500 mt-0.5 text-[8px]">▸</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AIAnalysisPanel;
