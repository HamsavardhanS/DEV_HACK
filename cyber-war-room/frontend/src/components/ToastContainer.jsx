import React, { useEffect, useState, useRef } from 'react';

let toastId = 0;

const ToastContainer = ({ threats }) => {
    const [toasts, setToasts] = useState([]);
    const prevThreatsRef = useRef([]);

    useEffect(() => {
        if (!threats || threats.length === 0) {
            prevThreatsRef.current = [];
            return;
        }

        const prevIds = new Set(prevThreatsRef.current.map(t => t.eventId));
        const newThreats = threats.filter(t => t.riskScore >= 50 && !prevIds.has(t.eventId));

        if (newThreats.length > 0) {
            const newToasts = newThreats.map(threat => ({
                id: ++toastId,
                threat,
                exit: false,
            }));
            setToasts(prev => [...prev, ...newToasts].slice(-5)); // Max 5 toasts at once
        }

        prevThreatsRef.current = threats;
    }, [threats]);

    const dismiss = (id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exit: true } : t));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
    };

    // Auto-dismiss after 6s
    useEffect(() => {
        if (toasts.length === 0) return;
        const timers = toasts.map(t => setTimeout(() => dismiss(t.id), 6000));
        return () => timers.forEach(clearTimeout);
    }, [toasts]);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(({ id, threat, exit }) => {
                const isCritical = threat.riskScore >= 80;
                return (
                    <div
                        key={id}
                        className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-md font-sans max-w-sm transition-all duration-300 ${exit ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
                            } ${isCritical
                                ? 'bg-red-950/90 border-red-500/50 text-red-100'
                                : 'bg-orange-950/90 border-orange-500/40 text-orange-100'
                            }`}
                    >
                        <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${isCritical ? 'bg-red-500/30' : 'bg-orange-500/30'}`}>
                            <svg className={`w-4 h-4 ${isCritical ? 'text-red-400' : 'text-orange-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full inline-block animate-pulse ${isCritical ? 'bg-red-400' : 'bg-orange-400'}`}></span>
                                {isCritical ? 'Critical' : 'High'} Risk Threat
                            </div>
                            <div className="text-xs opacity-80 mt-0.5 truncate font-mono">{threat.type}</div>
                            <div className="text-[10px] opacity-60 mt-0.5 font-mono">
                                Score: {threat.riskScore} · {threat.status}
                            </div>
                        </div>
                        <button
                            onClick={() => dismiss(id)}
                            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default ToastContainer;
