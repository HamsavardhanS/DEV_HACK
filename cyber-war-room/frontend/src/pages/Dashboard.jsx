import React, { useState, useEffect } from 'react';
import OverviewCards from '../components/OverviewCards';
import ThreatTable from '../components/ThreatTable';
import AttackChart from '../components/AttackChart';
import RiskChart from '../components/RiskChart';
import AgentStatus from '../components/AgentStatus';
import LogsPanel from '../components/LogsPanel';
import AdminActions from '../components/AdminActions';
import IncidentWorkflow from '../components/IncidentWorkflow';
import { fetchStats, fetchThreats, fetchLogs, fetchAgents, fetchDistribution, fetchRiskTrend, clearLogs } from '../services/api';
import { Shield, RefreshCw } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [threats, setThreats] = useState([]);
    const [distribution, setDistribution] = useState(null);
    const [riskTrend, setRiskTrend] = useState([]);
    const [logs, setLogs] = useState([]);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const [statsData, threatsData, logsData, agentsData, distData, trendData] = await Promise.all([
                fetchStats(),
                fetchThreats(),
                fetchLogs(),
                fetchAgents(),
                fetchDistribution(),
                fetchRiskTrend()
            ]);
            setStats(statsData);
            setThreats(threatsData);
            setLogs(logsData);
            setAgents(agentsData);
            setDistribution(distData);
            setRiskTrend(trendData);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (window.confirm("Are you sure you want to reset all incident data and restore healthy status?")) {
            await clearLogs();
            loadData();
        }
    };

    useEffect(() => {
        loadData();
        // Poll every 3 seconds for real-time updates
        const interval = setInterval(loadData, 3000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="animate-spin text-emerald-500 mb-4">
                    <Shield size={48} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-slate-300 p-4 font-sans selection:bg-cyan-500/30">
            {/* Main Container */}
            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row items-center justify-between pb-4 border-b border-cyan-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-900/40 text-cyan-400 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex-shrink-0">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                                Cybersecurity War Room
                            </h1>
                            <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5 font-mono text-[11px] tracking-wide">
                                ⚡ Agentic AI Autonomous Threat Detection & Response
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 md:mt-0">
                        {/* Status Indicator */}
                        <div className="flex items-baseline gap-2">
                            <span className="relative flex h-2 w-2 top-[1px]">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${stats?.systemStatus === 'Under Attack' ? 'bg-red-500' : 'bg-emerald-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${stats?.systemStatus === 'Under Attack' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                            </span>
                            <span className="font-mono text-sm tracking-wide text-slate-300 opacity-90">
                                {stats?.systemStatus || 'System Online'}
                            </span>
                            <span className="text-slate-600 mx-1">|</span>
                            <span className="font-mono text-sm tracking-wide text-slate-400">
                                Agents: 6/6 Active
                            </span>
                        </div>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded border border-slate-700/50 transition-all shadow-sm font-mono text-xs"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reset
                        </button>
                    </div>
                </header>

                {/* 1. Top Metrics Cards */}
                <OverviewCards stats={stats} />

                {/* 2. Analytics Section (Line & Bar Chart Side-by-Side) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-[350px]">
                        <RiskChart data={riskTrend} />
                    </div>
                    <div className="h-[350px]">
                        <AttackChart distribution={distribution} />
                    </div>
                </div>

                {/* 3. Live Threat Monitoring */}
                <div className="w-full">
                    <ThreatTable threats={threats} />
                </div>

                {/* 4. Actions & Workflow (2-Column Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AdminActions />
                    <IncidentWorkflow />
                </div>

                {/* 5. Agent Status (Reference UI style grid) */}
                <div className="w-full pt-4">
                    <AgentStatus agents={agents} />
                </div>

                {/* 6. Incident Reports / Forensics */}
                <div className="w-full mb-12 pt-4">
                    <LogsPanel logs={logs} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
