import React from 'react';
import { ShieldAlert } from 'lucide-react';

const ThreatAlertBanner = ({ activeThreats }) => {
    if (!activeThreats || activeThreats.length === 0) return null;

    // Grab the most recent threat to display
    const latest = activeThreats[0];

    let colorClasses = "from-red-600/20 to-red-900/40 border-red-500/50 text-red-100 shadow-[0_0_20px_rgba(220,38,38,0.2)]";
    let iconColor = "text-red-400";

    if (latest.riskScore < 50) {
        colorClasses = "from-yellow-600/20 to-yellow-900/40 border-yellow-500/50 text-yellow-100 shadow-[0_0_20px_rgba(234,179,8,0.2)]";
        iconColor = "text-yellow-400";
    } else if (latest.riskScore < 80) {
        colorClasses = "from-orange-600/20 to-orange-900/40 border-orange-500/50 text-orange-100 shadow-[0_0_20px_rgba(249,115,22,0.2)]";
        iconColor = "text-orange-400";
    }

    return (
        <div className={`w-full relative overflow-hidden backdrop-blur-md border rounded-xl p-3 mb-6 bg-gradient-to-r ${colorClasses} animate-pulse-slow flex items-center justify-between`}>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-black/30 rounded-lg">
                    <ShieldAlert className={`w-6 h-6 ${iconColor}`} />
                </div>
                <div>
                    <h2 className="text-sm font-bold tracking-wide uppercase">
                        ⚠ {latest.riskScore >= 80 ? 'Critical' : latest.riskScore >= 50 ? 'High' : 'Medium'} Risk Threat Detected
                    </h2>
                    <p className="text-xs opacity-90 font-mono mt-0.5">
                        {latest.type} in progress | Event: {latest.eventId}
                    </p>
                </div>
            </div>
            <div className="text-xs font-mono font-bold bg-black/40 px-3 py-1.5 rounded uppercase tracking-widest border border-white/10">
                Action: {latest.action.replace('_', ' ')}
            </div>
        </div>
    );
};

export default ThreatAlertBanner;
