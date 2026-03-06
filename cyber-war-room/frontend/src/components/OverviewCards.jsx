import React from 'react';
import { Activity, ShieldAlert, Ban, Server } from 'lucide-react';

const OverviewCards = ({ stats, onCardClick }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center space-x-4">
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
                    <Activity size={24} />
                </div>
                <div>
                    <p className="text-slate-400 text-sm font-medium">Total Events</p>
                    <h3 className="text-2xl font-bold text-slate-100">{stats?.totalEvents.toLocaleString() || 0}</h3>
                </div>
            </div>

            <div
                className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center space-x-4 cursor-pointer hover:border-red-500/50 transition-colors"
                onClick={() => onCardClick && onCardClick('activeThreats')}
            >
                <div className="p-3 bg-red-500/20 text-red-500 rounded-lg">
                    <ShieldAlert size={24} />
                </div>
                <div>
                    <p className="text-slate-400 text-sm font-medium">Active Threats</p>
                    <h3 className="text-2xl font-bold text-slate-100">{stats?.activeThreats || 0}</h3>
                </div>
            </div>

            <div
                className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center space-x-4 cursor-pointer hover:border-orange-500/50 transition-colors"
                onClick={() => onCardClick && onCardClick('blockedIps')}
            >
                <div className="p-3 bg-orange-500/20 text-orange-400 rounded-lg">
                    <Ban size={24} />
                </div>
                <div>
                    <p className="text-slate-400 text-sm font-medium">Blocked IPs</p>
                    <h3 className="text-2xl font-bold text-slate-100">{stats?.blockedIps || 0}</h3>
                </div>
            </div>

            <div className={`border p-4 rounded-xl shadow-lg flex items-center space-x-4 transition-all duration-500 ${stats?.systemStatus === 'Under Attack'
                ? 'bg-red-500/20 border-red-500/50 animate-pulse'
                : 'bg-emerald-500/20 border-emerald-500/50'
                }`}>
                <div className={`p-3 rounded-lg ${stats?.systemStatus === 'Under Attack' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                    }`}>
                    {stats?.systemStatus === 'Under Attack' ? <ShieldAlert size={24} /> : <Server size={24} />}
                </div>
                <div>
                    <p className="text-slate-400 text-sm font-medium">System Status</p>
                    <h3 className={`text-xl font-bold ${stats?.systemStatus === 'Under Attack' ? 'text-red-500' : 'text-emerald-400'
                        }`}>
                        {stats?.systemStatus || 'Healthy'}
                    </h3>
                </div>
            </div>

        </div>
    );
};

export default OverviewCards;
