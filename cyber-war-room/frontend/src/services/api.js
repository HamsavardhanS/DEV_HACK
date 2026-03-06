import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
});

// Mock Data Generator for robustness
const generateMockData = () => {
    return {
        stats: {
            totalEvents: 14502,
            activeThreats: 12,
            blockedIps: 89,
            systemStatus: 'Active'
        },
        threats: [
            { id: 1, time: new Date().toISOString(), eventId: 'evt-001', type: 'DDoS', riskScore: 85, action: 'isolate_host', status: 'Blocked' },
            { id: 2, time: new Date(Date.now() - 5000).toISOString(), eventId: 'evt-002', type: 'Brute Force', riskScore: 65, action: 'block_ip', status: 'Blocked' },
            { id: 3, time: new Date(Date.now() - 15000).toISOString(), eventId: 'evt-003', type: 'Suspicious Activity', riskScore: 35, action: 'monitor', status: 'Monitoring' },
        ],
        logs: [
            { id: 101, timestamp: new Date().toISOString(), agent_name: 'MonitoringAgent', event_id: 'evt-101', action_taken: 'N/A', details: '{"ip": "10.0.0.5", "traffic": 1050}' },
            { id: 102, timestamp: new Date().toISOString(), agent_name: 'ThreatIntelAgent', event_id: 'evt-101', action_taken: 'N/A', details: '{"threat": "DDoS", "level": "High"}' },
            { id: 103, timestamp: new Date().toISOString(), agent_name: 'ResponseAgent', event_id: 'evt-101', action_taken: 'isolate_host', details: '{"justification": "Risk >= 80"}' },
        ],
        agents: [
            { name: 'Monitoring Agent', status: 'Detecting anomalies', active: true },
            { name: 'Threat Agent', status: 'Classifying attack', active: true },
            { name: 'Risk Agent', status: 'Calculating risk score', active: true },
            { name: 'Response Agent', status: 'Blocking malicious IP', active: true },
            { name: 'Forensic Agent', status: 'Storing logs to SQLite', active: true },
            { name: 'Learning Agent', status: 'Analyzing false positive rates', active: true },
        ]
    }
}

const mocks = generateMockData();

export const fetchStats = async () => {
    try {
        const res = await api.get('/stats');
        return res.data;
    } catch (error) {
        console.warn("Backend not available, using mock stats");
        return mocks.stats;
    }
};

export const fetchThreats = async () => {
    try {
        const res = await api.get('/threats');
        return res.data;
    } catch (error) {
        console.warn("Backend not available, using mock threats");
        return mocks.threats;
    }
};

export const fetchLogs = async () => {
    try {
        const res = await api.get('/logs');
        return res.data;
    } catch (error) {
        console.warn("Backend not available, using mock logs");
        return mocks.logs;
    }
};

export const fetchAgents = async () => {
    try {
        const res = await api.get('/agents');
        return res.data;
    } catch (error) {
        console.warn("Backend not available, using mock agents");
        return mocks.agents;
    }
};

export const fetchDistribution = async () => {
    try {
        const res = await api.get('/distribution');
        return res.data;
    } catch (error) {
        console.warn("Backend not available, using mock distribution");
        return { 'DDoS': 10, 'Brute Force': 5, 'Malware': 3, 'Suspicious Activity': 15, 'Privilege Escalation': 1 };
    }
};

export const fetchRiskTrend = async () => {
    try {
        const res = await api.get('/risk-trend');
        return res.data;
    } catch (error) {
        console.warn("Backend not available, using mock risk trend");
        return [
            { time: '10:00', score: 20 },
            { time: '10:10', score: 35 },
            { time: '10:20', score: 45 },
            { time: '10:30', score: 30 }
        ];
    }
};

export const clearLogs = async () => {
    try {
        const res = await api.delete('/clear');
        return res.data;
    } catch (error) {
        console.error("Failed to clear logs", error);
        return { status: 'error' };
    }
};

export const fetchSystemHealth = async () => {
    try {
        const res = await api.get('/system-health');
        return res.data;
    } catch (error) {
        console.warn("Backend not available, using mock system health");
        return { cpu_usage: 34, memory_usage: 58, kafka_queue_size: 21, event_processing_rate: 120, active_threats: 3, system_stability: 92 };
    }
};

export const fetchSecurityScore = async () => {
    try {
        const res = await api.get('/security-score');
        return res.data;
    } catch (error) {
        console.warn("Backend not available, using mock security score");
        return { security_score: 85 };
    }
};

export const fetchRawEvents = async () => {
    try {
        const res = await api.get('/events');
        return res.data;
    } catch (error) {
        console.warn("Backend not available, using mock events");
        return ["[10:42:21] MockingAgent simulated event"];
    }
};
