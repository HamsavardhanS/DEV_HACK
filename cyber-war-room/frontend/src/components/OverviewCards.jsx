import React from 'react';
import { Activity, ShieldAlert, Ban, Server, Shield } from 'lucide-react';

const getStatusStyle = (status) => {
    switch (status) {
        case 'Under Attack':
            return {
                card: 'bg-red-500/15 border-red-500/50 animate-pulse',
                icon: 'bg-red-500 text-white',
                text: 'text-red-400',
                dot: 'bg-red-500',
                iconEl: <ShieldAlert size={24} />
            };
        case 'Mitigated':
            return {
                card: 'bg-amber-500/15 border-amber-500/40',
                icon: 'bg-amber-500 text-white',
                text: 'text-amber-400',
                dot: 'bg-amber-500',
                iconEl: <Shield size={24} />
            };
        default: // Healthy
            return {
                card: 'bg-emerald-500/15 border-emerald-500/40',
                icon: 'bg-emerald-500 text-white',
                text: 'text-emerald-400',
                dot: 'bg-emerald-500',
                iconEl: <Server size={24} />
            };
    }
};

const OverviewCards = ({ stats, onCardClick }) => {
    const statusStyle = getStatusStyle(stats?.systemStatus);
    const hasThreats = (stats?.activeThreats ?? 0) > 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

            {/* Total Events */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center space-x-4">
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
                    <Activity size={24} />
                </div>
                <div>
                    <p className="text-slate-400 text-sm font-medium">Total Events</p>
                    <h3 className="text-2xl font-bold text-slate-100">{stats?.totalEvents?.toLocaleString() ?? 0}</h3>
                </div>
            </div>

            {/* Active Threats — clickable */}
            <div
                className={`border p-4 rounded-xl shadow-lg flex items-center space-x-4 cursor-pointer transition-all duration-300 ${hasThreats
                        ? 'bg-red-500/10 border-red-500/50 hover:border-red-400/70 hover:bg-red-500/15'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                    }`}
                onClick={() => onCardClick && onCardClick('activeThreats')}
            >
                <div className={`p-3 rounded-lg ${hasThreats ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                    <ShieldAlert size={24} />
                </div>
                <div>
                    <p className="text-slate-400 text-sm font-medium">Active Threats</p>
                    <h3 className={`text-2xl font-bold ${hasThreats ? 'text-red-400' : 'text-slate-100'}`}>
                        {stats?.activeThreats ?? 0}
                    </h3>
                    {hasThreats && (
                        <p className="text-[10px] text-red-400/70 font-mono mt-0.5">Click to inspect →</p>
                    )}
                </div>
            </div>

            {/* Blocked IPs — clickable */}
            <div
                className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center space-x-4 cursor-pointer hover:border-orange-500/50 transition-colors"
                onClick={() => onCardClick && onCardClick('blockedIps')}
            >
                <div className="p-3 bg-orange-500/20 text-orange-400 rounded-lg">
                    <Ban size={24} />
                </div>
                <div>
                    <p className="text-slate-400 text-sm font-medium">Blocked IPs</p>
                    <h3 className="text-2xl font-bold text-slate-100">{stats?.blockedIps ?? 0}</h3>
                </div>
            </div>

            {/* System Status */}
            <div className={`border p-4 rounded-xl shadow-lg flex items-center space-x-4 transition-all duration-500 ${statusStyle.card}`}>
                <div className={`p-3 rounded-lg ${statusStyle.icon}`}>
                    {statusStyle.iconEl}
                </div>
                <div>
                    <p className="text-slate-400 text-sm font-medium">System Status</p>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusStyle.dot} ${stats?.systemStatus === 'Under Attack' ? 'animate-ping' : ''}`}></span>
                        <h3 className={`text-xl font-bold ${statusStyle.text}`}>
                            {stats?.systemStatus ?? 'Healthy'}
                        </h3>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default OverviewCards;
