import React from 'react';
import { ShieldAlert, ChevronRight } from 'lucide-react';

const ThreatAlertBanner = ({ activeThreats, onViewAll }) => {
    if (!activeThreats || activeThreats.length === 0) return null;

    // Only show banner for high-risk threats (score >= 50)
    const highRisk = activeThreats.filter(t => t.riskScore >= 50);
    if (highRisk.length === 0) return null;

    // Grab the highest risk unblocked threat to display
    const latest = [...highRisk].sort((a, b) => b.riskScore - a.riskScore)[0];

    let colorClasses = "from-red-600/20 to-red-900/40 border-red-500/50 text-red-100 shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_30px_rgba(220,38,38,0.35)]";
    let iconColor = "text-red-400";
    let dotColor = "bg-red-500";
    let riskLabel = "Critical";

    if (latest.riskScore < 80) {
        colorClasses = "from-orange-600/20 to-orange-900/40 border-orange-500/50 text-orange-100 shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_30px_rgba(249,115,22,0.35)]";
        iconColor = "text-orange-400";
        dotColor = "bg-orange-500";
        riskLabel = "High";
    }

    return (
        <div
            className={`w-full relative overflow-hidden backdrop-blur-md border rounded-xl p-3 bg-gradient-to-r ${colorClasses} flex items-center justify-between cursor-pointer transition-all`}
            onClick={onViewAll}
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-black/30 rounded-lg shrink-0">
                    <ShieldAlert className={`w-6 h-6 ${iconColor}`} />
                </div>
                <div>
                    <h2 className="text-sm font-bold tracking-wide uppercase flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full inline-block ${dotColor} animate-ping`}></span>
                        ⚠ {riskLabel} Risk Threat Detected — {highRisk.length} Active
                    </h2>
                    <p className="text-xs opacity-90 font-mono mt-0.5">
                        Latest: <span className="font-bold">{latest.type}</span> | Risk Score: <span className="font-bold">{latest.riskScore}/100</span> | Event: {latest.eventId}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold bg-black/40 px-3 py-1.5 rounded uppercase tracking-widest border border-white/10 shrink-0">
                View All <ChevronRight className="w-3 h-3" />
            </div>
        </div>
    );
};

export default ThreatAlertBanner;
