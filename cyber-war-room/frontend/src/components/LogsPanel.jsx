import React from 'react';
import { Terminal, Download } from 'lucide-react';

const LogsPanel = ({ logs }) => {
    const handleDownload = () => {
        if (!logs || logs.length === 0) return alert('No logs available to download.');

        const data = logs.map(log => {
            let detailsStr = '';
            try {
                detailsStr = typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details);
            } catch {
                detailsStr = String(log.details);
            }

            return {
                Timestamp: new Date(log.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                Agent: log.agent_name,
                EventID: log.event_id,
                Details: detailsStr
            };
        });

        if (!window.XLSX) {
            alert('Excel export library is still loading. Please try again in a moment.');
            return;
        }

        const worksheet = window.XLSX.utils.json_to_sheet(data);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, "Forensic Logs");

        const excelBuffer = window.XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Forensic_Report_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.4)] h-[400px] flex flex-col font-mono group hover:border-cyan-500/30 transition-colors">
            <div className="p-4 border-b border-slate-700/50 bg-slate-900/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Terminal className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-200 tracking-widest uppercase">Forensic Timeline DB</h3>
                </div>
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer shadow-inner"
                    title="Download Logs as .xlsx"
                >
                    <Download className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider font-bold">Export .xlsx</span>
                </button>
            </div>
            <div className="p-4 flex-1 bg-black/40 overflow-y-auto text-xs space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {logs?.map((log, idx) => (
                    <div key={idx} className="border-l border-slate-700/50 pl-4 py-2 hover:bg-slate-800/40 transition-colors group/log">
                        <div className="flex flex-wrap items-center text-slate-500 mb-2 gap-2 text-[11px]">
                            <span className="text-emerald-500/80">
                                [{new Date(log.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} IST]
                            </span>
                            <span className="text-cyan-400/80">[{log.agent_name}]</span>
                            <span className="text-slate-600 font-bold tracking-widest uppercase">ID:{log.event_id?.substring(0, 8)}</span>
                        </div>
                        <div className="mt-1 font-mono text-[10px] bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-cyan-400/90 overflow-x-auto shadow-inner group-hover/log:border-cyan-500/20 transition-colors">
                            <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                    </div>
                ))}
                {(!logs || logs.length === 0) && (
                    <div className="text-slate-600 italic mt-4 text-center">Waiting for incoming traces...</div>
                )}
                <div className="flex items-center gap-2 mt-4 ml-2">
                    <div className="animate-pulse w-2 h-4 bg-emerald-500/50"></div>
                </div>
            </div>
        </div>
    );
};

export default LogsPanel;
