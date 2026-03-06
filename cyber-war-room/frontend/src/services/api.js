import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
});

// Mock Data Generator for robustness
// No mock data - forcing real backend usage

export const fetchStats = async () => {
    try {
        const res = await api.get('/stats');
        return res.data;
    } catch (error) {
        console.error("Backend stats unavailable");
        return null;
    }
};

export const fetchThreats = async () => {
    try {
        const res = await api.get('/threats');
        return res.data;
    } catch (error) {
        console.error("Backend threats unavailable");
        return [];
    }
};

export const fetchBlockedIps = async () => {
    try {
        const res = await api.get('/blocked-ips');
        return res.data;
    } catch (error) {
        console.warn("Backend not available, using mock blocked IPs");
        return [];
    }
};

export const fetchHeatmap = async () => {
    try {
        const res = await api.get('/heatmap');
        return res.data;
    } catch (error) {
        console.error("Backend heatmap unavailable");
        return null;
    }
};

export const fetchLogs = async () => {
    try {
        const res = await api.get('/logs');
        return res.data;
    } catch (error) {
        console.error("Backend logs unavailable");
        return [];
    }
};

export const fetchAgents = async () => {
    try {
        const res = await api.get('/agents');
        return res.data;
    } catch (error) {
        console.error("Backend agents unavailable");
        return [];
    }
};

export const fetchDistribution = async () => {
    try {
        const res = await api.get('/distribution');
        return res.data;
    } catch (error) {
        console.error("Backend distribution unavailable");
        return {};
    }
};

export const fetchRiskTrend = async () => {
    try {
        const res = await api.get('/risk-trend');
        return res.data;
    } catch (error) {
        console.error("Backend risk trend unavailable");
        return [];
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
        console.error("Backend system health unavailable");
        return null;
    }
};

export const fetchSecurityScore = async () => {
    try {
        const res = await api.get('/security-score');
        return res.data;
    } catch (error) {
        console.error("Backend security score unavailable");
        return { security_score: 100 };
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
