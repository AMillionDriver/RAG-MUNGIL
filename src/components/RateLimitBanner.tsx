import React, { useEffect, useState } from 'react';
import { ShieldAlert, X, Hourglass, Activity } from 'lucide-react';
import { subscribeRateLimit, type RateLimitResult } from '../lib/rateLimiter';

export default function RateLimitBanner() {
  const [activeAlert, setActiveAlert] = useState<RateLimitResult | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = subscribeRateLimit((result) => {
      setActiveAlert(result);
      setCountdown(result.resetInSeconds);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      if (activeAlert) {
        setActiveAlert(null);
      }
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setActiveAlert(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, activeAlert]);

  if (!activeAlert || countdown <= 0) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="bg-ink-900 border border-oxide/60 rounded-lg p-3.5 shadow-2xl backdrop-blur-md text-paper flex flex-col gap-2 relative overflow-hidden">
        {/* Border Aksen */}
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-oxide" />

        <div className="flex items-start justify-between gap-2.5 pl-1.5">
          <div className="flex items-center gap-2 text-oxide font-medium text-[13px]">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Permintaan Dibatasi Sementara</span>
          </div>
          <button
            onClick={() => setActiveAlert(null)}
            className="text-paper-dim hover:text-paper transition-colors p-0.5"
            title="Tutup pemberitahuan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[12px] text-paper-dim leading-relaxed pl-1.5">
          {activeAlert.reason || `Batas aksi ${activeAlert.action} terlampaui.`}
        </p>

        <div className="flex items-center justify-between border-t border-ink-800 pt-2 pl-1.5 text-[11px] font-mono text-paper-dim">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-oxide" />
            <span>Anti-Flood Shield</span>
          </span>
          <span className="flex items-center gap-1 text-oxide font-semibold">
            <Hourglass className="w-3 h-3 animate-pulse" />
            Pulih dalam: {countdown}s
          </span>
        </div>
      </div>
    </div>
  );
}
