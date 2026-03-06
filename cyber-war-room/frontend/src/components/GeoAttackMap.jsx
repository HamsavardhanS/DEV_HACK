import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

// Simple IP to Country lookup using ip-api.com (free, no key needed)
// We cache results to avoid hammering the API
const geoCache = {};

async function lookupGeo(ip) {
    if (geoCache[ip]) return geoCache[ip];
    if (!ip || ip === 'unknown' || ip.startsWith('192.168') || ip.startsWith('10.') || ip.startsWith('127.')) {
        return null;
    }
    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,lat,lon`);
        const data = await res.json();
        if (data.status === 'success') {
            geoCache[ip] = data;
            return data;
        }
    } catch (e) { }
    return null;
}

// Map IP threats to geo data  
async function enrichThreats(threats) {
    const results = [];
    for (const t of threats) {
        if (t.riskScore < 50) continue;
        // Extract IP from eventId or details — use eventId as proxy key
        let geoData = null;
        results.push({ ...t, geo: geoData });
    }
    return results;
}

// Approximate world map SVG path — we use a canvas-based approach
// Country ISO code → approximate [x%, y%] on a simple equirectangular map
const COUNTRY_POSITIONS = {
    US: [18, 35], CA: [16, 25], MX: [15, 45], BR: [28, 60], AR: [25, 70],
    GB: [46, 22], FR: [47, 27], DE: [49, 25], ES: [45, 32], IT: [50, 32],
    RU: [62, 25], CN: [72, 37], JP: [79, 33], IN: [68, 42], AU: [78, 65],
    ZA: [52, 65], NG: [49, 52], EG: [53, 40], SA: [60, 43], PK: [66, 38],
    KR: [78, 30], ID: [77, 55], PH: [80, 48], SG: [76, 53], MY: [75, 50],
    TH: [74, 47], VN: [76, 44], BD: [70, 41], UA: [55, 30], PL: [51, 28],
    TR: [57, 35], IR: [62, 38], IQ: [59, 39], AF: [65, 37], NL: [47, 23],
    SE: [50, 17], NO: [49, 15], FI: [52, 15], DK: [49, 21], CH: [48, 27],
    BE: [47, 24], AT: [50, 28], CZ: [50, 26], HU: [51, 29], RO: [53, 31],
    GR: [52, 35], PT: [44, 32], NZ: [84, 70], CL: [22, 68], CO: [22, 52],
    PE: [21, 60], VE: [24, 50], EC: [20, 56], BO: [23, 63],
};

const GeoAttackMap = ({ threats }) => {
    const [geoThreats, setGeoThreats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [countryStats, setCountryStats] = useState({});
    const [hoveredCountry, setHoveredCountry] = useState(null);

    useEffect(() => {
        const buildFromThreats = async () => {
            setLoading(true);
            try {
                // Fetch geo data from backend which has the source IPs
                const res = await fetch('http://localhost:5000/api/geo-threats');
                const data = await res.json();
                if (data && data.geoThreats) {
                    setGeoThreats(data.geoThreats);
                    const stats = {};
                    data.geoThreats.forEach(t => {
                        const code = t.countryCode;
                        if (!stats[code]) stats[code] = { name: t.country, count: 0, critical: 0 };
                        stats[code].count++;
                        if (t.riskScore >= 80) stats[code].critical++;
                    });
                    setCountryStats(stats);
                }
            } catch (e) {
                console.error('GeoMap fetch failed:', e);
            }
            setLoading(false);
        };
        buildFromThreats();
        const interval = setInterval(buildFromThreats, 15000);
        return () => clearInterval(interval);
    }, []);

    const totalAttacks = geoThreats.length;
    const topCountries = Object.entries(countryStats)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5);

    return (
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-200 tracking-wider uppercase flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    Attack Origin Map
                    <span className="text-[10px] font-mono text-slate-500 normal-case font-normal">
                        (last 100 blocks)
                    </span>
                </h3>
                {!loading && (
                    <span className="text-xs font-mono text-slate-500">
                        {totalAttacks} geo-tagged events
                    </span>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48 text-slate-600 font-mono text-xs gap-2">
                    <Globe className="w-4 h-4 animate-spin" /> Resolving geolocations...
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* World Point Map */}
                    <div className="relative flex-1 bg-slate-950/60 rounded-lg border border-slate-800/50 overflow-hidden" style={{ height: 220 }}>
                        {/* Simple grid lines */}
                        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                            {[...Array(9)].map((_, i) => (
                                <line key={`h${i}`} x1="0" y1={`${(i + 1) * 10}%`} x2="100%" y2={`${(i + 1) * 10}%`} stroke="#334155" strokeWidth="0.5" />
                            ))}
                            {[...Array(11)].map((_, i) => (
                                <line key={`v${i}`} x1={`${(i + 1) * 8.33}%`} y1="0" x2={`${(i + 1) * 8.33}%`} y2="100%" stroke="#334155" strokeWidth="0.5" />
                            ))}
                        </svg>

                        {/* No data state */}
                        {geoThreats.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 font-mono text-xs gap-2">
                                <Globe className="w-8 h-8 opacity-20" />
                                <span>No geo-tagged threats yet</span>
                                <span className="text-[10px] opacity-60">Requires blocked_ip events in DB</span>
                            </div>
                        ) : (
                            Object.entries(countryStats).map(([code, info]) => {
                                const pos = COUNTRY_POSITIONS[code];
                                if (!pos) return null;
                                const size = Math.min(18, 6 + info.count * 2);
                                const color = info.critical > 0 ? '#ef4444' : info.count > 3 ? '#f97316' : '#eab308';
                                return (
                                    <div
                                        key={code}
                                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                                        style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}
                                        onMouseEnter={() => setHoveredCountry(code)}
                                        onMouseLeave={() => setHoveredCountry(null)}
                                    >
                                        {/* Ping rings */}
                                        <div className="absolute rounded-full animate-ping opacity-30" style={{ width: size + 8, height: size + 8, background: color, top: -(size + 8) / 2, left: -(size + 8) / 2 }} />
                                        <div className="relative rounded-full shadow-lg" style={{ width: size, height: size, background: color, boxShadow: `0 0 ${size}px ${color}80` }}>
                                            <span className="absolute inset-0 flex items-center justify-center text-white font-bold" style={{ fontSize: Math.max(7, size * 0.45) }}>
                                                {info.count > 9 ? '!' : info.count}
                                            </span>
                                        </div>
                                        {hoveredCountry === code && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-950 border border-slate-700 text-white text-[10px] font-mono py-1 px-2 rounded whitespace-nowrap z-10 shadow-xl pointer-events-none">
                                                <div className="font-bold">{info.name} ({code})</div>
                                                <div className="text-slate-400">{info.count} attack{info.count !== 1 ? 's' : ''} | {info.critical} critical</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Top Countries Sidebar */}
                    <div className="lg:w-44 shrink-0">
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Top Sources</div>
                        {topCountries.length === 0 ? (
                            <div className="text-[10px] text-slate-700 font-mono">No data yet</div>
                        ) : (
                            <div className="space-y-2">
                                {topCountries.map(([code, info], idx) => (
                                    <div key={code} className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-slate-600 w-4">{idx + 1}.</span>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-mono text-slate-300">{code}</span>
                                                <span className={`text-[10px] font-mono font-bold ${info.critical > 0 ? 'text-red-400' : 'text-orange-400'}`}>{info.count}</span>
                                            </div>
                                            <div className="w-full bg-slate-800 rounded-full h-1 mt-0.5">
                                                <div
                                                    className={`h-1 rounded-full ${info.critical > 0 ? 'bg-red-500' : 'bg-orange-500'}`}
                                                    style={{ width: `${Math.min(100, (info.count / (topCountries[0]?.[1].count || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeoAttackMap;
