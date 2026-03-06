import React, { useEffect, useRef } from 'react';
import { TerminalSquare } from 'lucide-react';

const LiveEventStream = ({ rawEvents }) => {
    const streamEndRef = useRef(null);

    // User requested to remove auto-scroll so they can read at their own pace
    // useEffect(() => {
    //     streamEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // }, [rawEvents]);

    return (
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] h-full min-h-[400px] flex flex-col group hover:border-cyan-500/30 transition-colors">
            <h3 className="text-sm font-bold text-slate-200 tracking-wider mb-4 uppercase flex items-center gap-2">
                <TerminalSquare className="w-4 h-4 text-slate-400" />
                Raw Event Stream
            </h3>

            <div className="flex-1 overflow-y-auto bg-black/60 rounded border border-slate-800 p-3 font-mono text-[11px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {!rawEvents || rawEvents.length === 0 ? (
                    <div className="text-slate-600 animate-pulse">Initializing stream...</div>
                ) : (
                    rawEvents.map((evtStr, idx) => {
                        // Colorize the event string
                        let colorStr = "text-slate-400";
                        if (evtStr.includes("classified DDoS") || evtStr.includes("classified Malware")) colorStr = "text-red-400";
                        if (evtStr.includes("assigned risk score 9") || evtStr.includes("assigned risk score 8")) colorStr = "text-red-400";
                        if (evtStr.includes("assigned risk score 5") || evtStr.includes("assigned risk score 6")) colorStr = "text-orange-400";
                        if (evtStr.includes("executed action: block") || evtStr.includes("executed action: isolate")) colorStr = "text-emerald-400";
                        if (evtStr.includes("MonitoringAgent")) colorStr = "text-cyan-400/70";

                        return (
                            <div key={idx} className={`hover:bg-slate-800/50 px-1 py-0.5 transition-colors ${colorStr}`}>
                                {evtStr}
                            </div>
                        );
                    })
                )}
                <div ref={streamEndRef} />
            </div>
            {/* Blinking cursor effect at the top (since it doesn't auto-scroll) */}
            <div className="absolute top-12 right-6 flex gap-1 items-center z-10 opacity-50">
                <div className="w-2 h-4 bg-cyan-500 animate-pulse"></div>
            </div>
        </div>
    );
};

export default LiveEventStream;
