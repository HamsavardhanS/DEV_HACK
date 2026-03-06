import React, { useState, useEffect, useRef } from 'react';
import OverviewCards from '../components/OverviewCards';
import ThreatTable from '../components/ThreatTable';
import AttackChart from '../components/AttackChart';
import RiskChart from '../components/RiskChart';
import LogsPanel from '../components/LogsPanel';
import SystemHealth from '../components/SystemHealth';
import HealthComparison from '../components/HealthComparison';
import HealthGraph from '../components/HealthGraph';
import ThreatAlertBanner from '../components/ThreatAlertBanner';
import SecurityScoreGauge from '../components/SecurityScoreGauge';
import ThreatHeatmap from '../components/ThreatHeatmap';
import LiveEventStream from '../components/LiveEventStream';
import DetailModal from '../components/DetailModal';
import ToastContainer from '../components/ToastContainer';
import GeoAttackMap from '../components/GeoAttackMap';
import {
    fetchStats, fetchThreats, fetchLogs, fetchAgents,
    fetchDistribution, fetchRiskTrend, clearLogs,
    fetchSystemHealth, fetchSecurityScore, fetchRawEvents
} from '../services/api';
import { Shield, RefreshCw, Download, FileText } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [threats, setThreats] = useState([]);
    const [distribution, setDistribution] = useState(null);
    const [riskTrend, setRiskTrend] = useState([]);
    const [logs, setLogs] = useState([]);
    const [agents, setAgents] = useState([]);
    const [health, setHealth] = useState(null);
    const [securityScore, setSecurityScore] = useState(100);
    const [rawEvents, setRawEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState(null);

    // Dynamic security score: computed from real threat data
    const computeScore = (threats) => {
        if (!threats || threats.length === 0) return 100;
        const unblockedCritical = threats.filter(t => t.riskScore >= 80 && t.status !== 'Blocked').length;
        const unblockedHigh = threats.filter(t => t.riskScore >= 50 && t.riskScore < 80 && t.status !== 'Blocked').length;
        const blockedCritical = threats.filter(t => t.riskScore >= 80 && t.status === 'Blocked').length;
        const blockedHigh = threats.filter(t => t.riskScore >= 50 && t.riskScore < 80 && t.status === 'Blocked').length;
        let score = 100;
        score -= unblockedCritical * 15;  // Active critical — big hit
        score -= unblockedHigh * 8;   // Active high
        score -= blockedCritical * 5;   // Mitigated critical — still dings
        score -= blockedHigh * 2;   // Mitigated high — small ding
        return Math.max(0, Math.min(100, Math.round(score)));
    };

    const loadData = async () => {
        try {
            const [
                statsData, threatsData, logsData, agentsData, distData, trendData,
                healthData, eventsData
            ] = await Promise.all([
                fetchStats(),
                fetchThreats(),
                fetchLogs(),
                fetchAgents(),
                fetchDistribution(),
                fetchRiskTrend(),
                fetchSystemHealth(),
                fetchRawEvents()
            ]);
            setStats(statsData);
            if (threatsData) {
                setThreats(threatsData);
                setSecurityScore(computeScore(threatsData));
            }
            setLogs(logsData);
            setAgents(agentsData || []);
            setDistribution(distData);
            setRiskTrend(trendData);
            setHealth(healthData);
            if (eventsData) setRawEvents(eventsData);
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

    const handleExport = () => {
        const link = document.createElement('a');
        link.href = 'http://localhost:5000/api/export/report';
        link.download = `incident_report_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        loadData();
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
            {/* Toast Notifications — fixed position, shows on new threats */}
            <ToastContainer threats={threats} />

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
                                ⚡ Agentic AI Autonomous Threat Detection &amp; Response
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                        {/* Status Indicator */}
                        <div className="flex items-baseline gap-2">
                            <span className="relative flex h-2 w-2 top-[1px]">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${stats?.systemStatus === 'Under Attack' ? 'bg-red-500'
                                    : stats?.systemStatus === 'Mitigated' ? 'bg-amber-500'
                                        : 'bg-emerald-400'
                                    }`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${stats?.systemStatus === 'Under Attack' ? 'bg-red-500'
                                    : stats?.systemStatus === 'Mitigated' ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                    }`}></span>
                            </span>
                            <span className={`font-mono text-sm tracking-wide opacity-90 ${stats?.systemStatus === 'Under Attack' ? 'text-red-400 font-bold'
                                : stats?.systemStatus === 'Mitigated' ? 'text-amber-400'
                                    : 'text-slate-300'
                                }`}>
                                {stats?.systemStatus || 'System Online'}
                            </span>
                            <span className="text-slate-600 mx-1">|</span>
                            <span className="font-mono text-sm tracking-wide text-slate-400">
                                Agents: {agents.filter(a => a.active).length}/{agents.length || 6} Active
                            </span>
                        </div>

                        {/* Export Report Button */}
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded border border-slate-700/50 hover:border-cyan-500/40 transition-all shadow-sm font-mono text-xs"
                            title="Export incident report as JSON"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export
                        </button>

                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded border border-slate-700/50 transition-all shadow-sm font-mono text-xs"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reset
                        </button>
                    </div>
                </header>

                {/* Top Alert Banner */}
                <ThreatAlertBanner activeThreats={threats} onViewAll={() => setActiveModal('activeThreats')} />

                {/* 1. Core Security Rating & Top Metrics Cards */}
                <div className="flex flex-col xl:flex-row gap-6">
                    <div className="xl:w-[250px] shrink-0">
                        <SecurityScoreGauge score={securityScore} onClick={() => setActiveModal('activeThreats')} />
                    </div>
                    <div className="flex-1 w-full">
                        <OverviewCards stats={stats} onCardClick={setActiveModal} />
                    </div>
                </div>

                {/* 2. Live Event Stream Ticker */}
                <div className="w-full h-[60px] overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/60 flex items-center px-4 font-mono text-xs shadow-inner">
                    <div className="text-cyan-400 font-bold mr-4 shrink-0 whitespace-nowrap">LIVE STREAM &gt;</div>
                    <div className="flex-1 overflow-hidden relative leading-relaxed">
                        <div className="absolute whitespace-nowrap text-slate-400">
                            {(rawEvents || []).slice(-1)[0] || "Waiting for telemetry..."}
                        </div>
                    </div>
                </div>

                {/* 3. System Health Suite */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    <div className="lg:col-span-2 h-full">
                        <SystemHealth health={health} />
                    </div>
                    <div className="h-full">
                        <HealthComparison health={health} />
                    </div>
                </div>

                {/* 4. Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    <div className="lg:col-span-2 h-full">
                        <HealthGraph currentHealth={health} />
                    </div>
                    <div className="h-full min-h-[350px]">
                        <RiskChart data={riskTrend} />
                    </div>
                    <div className="h-full min-h-[350px]">
                        <AttackChart distribution={distribution} />
                    </div>
                    <div className="lg:col-span-2 h-full">
                        <ThreatHeatmap />
                    </div>
                </div>

                {/* 5. Geo Attack Map */}
                <GeoAttackMap threats={threats} />

                {/* 6. Live Threat Monitoring and Raw Stream */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    <div className="lg:col-span-2 h-full">
                        <ThreatTable threats={threats} onViewThreats={() => setActiveModal('activeThreats')} />
                    </div>
                    <div className="h-full">
                        <LiveEventStream rawEvents={rawEvents} />
                    </div>
                </div>

                {/* 7. Incident Reports / Forensics */}
                <div className="w-full mb-12 pt-4">
                    <LogsPanel logs={logs} />
                </div>
            </div>

            {/* Modals */}
            <DetailModal
                isOpen={!!activeModal}
                type={activeModal}
                onClose={() => setActiveModal(null)}
                threats={threats}
            />
        </div>
    );
};

export default Dashboard;
