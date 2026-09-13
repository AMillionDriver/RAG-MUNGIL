import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ShieldAlert, Lock, CheckCircle2, RefreshCw, Terminal, Globe, Cpu } from 'lucide-react';

interface TurnstileGatewayProps {
  siteKey: string;
  onVerified: (token: string, rayId: string) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          callback?: (token: string) => void;
          'error-callback'?: (errorCode: string) => void;
          'expired-callback'?: () => void;
          size?: 'normal' | 'compact' | 'flexible';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export function generateRayId(): string {
  const chars = '0123456789abcdef';
  let hex = '';
  for (let i = 0; i < 16; i++) {
    hex += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${hex}-CGK`;
}

export default function TurnstileGateway({ siteKey, onVerified }: TurnstileGatewayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'script_loading'>('script_loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [rayId] = useState<string>(() => {
    const cached = sessionStorage.getItem('cf_ray_id');
    if (cached) return cached;
    const newId = generateRayId();
    sessionStorage.setItem('cf_ray_id', newId);
    return newId;
  });

  const [simulatedIp] = useState<string>(() => {
    return '182.253.' + Math.floor(Math.random() * 200 + 10) + '.' + Math.floor(Math.random() * 200 + 10);
  });

  useEffect(() => {
    let checkInterval: any = null;
    let isMounted = true;

    function initTurnstile() {
      if (!window.turnstile || !containerRef.current) return;
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      setStatus('verifying');
      setErrorMessage(null);

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          size: 'normal',
          callback: (receivedToken: string) => {
            if (!isMounted) return;
            setToken(receivedToken);
            setStatus('success');
            sessionStorage.setItem('cf_turnstile_token', receivedToken);
            setTimeout(() => {
              if (isMounted) {
                onVerified(receivedToken, rayId);
              }
            }, 600);
          },
          'error-callback': (err: string) => {
            if (!isMounted) return;
            setStatus('error');
            setErrorMessage(`Cloudflare Turnstile Challenge gagal (${err || 'Kode error'}).`);
          },
          'expired-callback': () => {
            if (!isMounted) return;
            setStatus('error');
            setErrorMessage('Sesi verifikasi kadaluarsa. Silakan muat ulang tantangan.');
          }
        });
        widgetIdRef.current = id;
      } catch (e) {
        console.error('Turnstile render error:', e);
        if (isMounted) {
          setStatus('error');
          setErrorMessage('Gagal memuat widget Cloudflare Turnstile.');
        }
      }
    }

    if (window.turnstile) {
      initTurnstile();
    } else {
      setStatus('script_loading');
      checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          initTurnstile();
        }
      }, 200);
    }

    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
    };
  }, [siteKey, onVerified, rayId]);

  const handleManualRetry = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      setStatus('verifying');
      setErrorMessage(null);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 text-paper flex flex-col items-center justify-center p-4 selection:bg-verdigris/30">
      {/* Container Kotak Verifikasi Cloudflare Interstitial */}
      <div className="w-full max-w-md bg-ink-900 border border-ink-600 rounded-lg p-6 shadow-2xl relative overflow-hidden">
        {/* Border Aksen */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-oxide via-verdigris to-oxide" />

        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-ink-700 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-ink-800 border border-ink-600 flex items-center justify-center text-verdigris">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-catalog-heading text-sm font-semibold tracking-wide text-paper">
                Cloudflare Gateway Shield
              </h2>
              <p className="text-[11px] text-paper-dim">RAG-MUNGIL Technical Archive</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-ink-800 text-verdigris border border-ink-700">
            <span className="w-1.5 h-1.5 rounded-full bg-verdigris animate-pulse" />
            PROTECTED
          </span>
        </div>

        {/* Subtitle Instruksi */}
        <div className="mb-5 space-y-1.5 text-center sm:text-left">
          <h3 className="text-[14px] font-medium text-paper flex items-center justify-center sm:justify-start gap-2">
            {status === 'success' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-verdigris" />
                Verifikasi Berhasil! Mengalihkan...
              </>
            ) : status === 'error' ? (
              <>
                <ShieldAlert className="w-4 h-4 text-oxide" />
                Tantangan Memerlukan Interaksi
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-verdigris animate-pulse" />
                Verifikasi Integritas Pengunjung
              </>
            )}
          </h3>
          <p className="text-[12px] text-paper-dim leading-relaxed">
            Gerbang keamanan memeriksa bahwa koneksi ini berasal dari manusia dan bukan bot liar sebelum membuka akses dataset RAG.
          </p>
        </div>

        {/* Cloudflare Turnstile Embed Widget */}
        <div className="my-6 flex flex-col items-center justify-center min-h-[75px] bg-ink-950/60 rounded border border-ink-700 p-3">
          <div ref={containerRef} className="flex justify-center" />
          {status === 'script_loading' && (
            <div className="flex items-center gap-2 text-[11px] text-paper-dim font-mono py-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-verdigris" />
              Menghubungkan ke Cloudflare Turnstile Network...
            </div>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-2.5 bg-oxide/10 border border-oxide/30 rounded text-[12px] text-oxide flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{errorMessage}</p>
              <button
                onClick={handleManualRetry}
                className="mt-1 text-[11px] underline font-mono hover:text-paper transition-colors"
              >
                Coba Ulang Verifikasi
              </button>
            </div>
          </div>
        )}

        {/* Telemetri Ray ID & WAF Information */}
        <div className="bg-ink-950 rounded border border-ink-700/80 p-3 space-y-2 text-[11px] font-mono text-paper-dim">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-paper">
              <Terminal className="w-3 h-3 text-verdigris" />
              Ray ID:
            </span>
            <span className="text-paper font-semibold select-all text-verdigris">
              {rayId}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-ink-800 pt-1.5">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-paper-dim" />
              Client IP:
            </span>
            <span>{simulatedIp}</span>
          </div>

          <div className="flex items-center justify-between border-t border-ink-800 pt-1.5">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-paper-dim" />
              Site Key:
            </span>
            <span className="truncate max-w-[170px]" title={siteKey}>{siteKey}</span>
          </div>

          <div className="flex items-center justify-between border-t border-ink-800 pt-1.5 text-[10px]">
            <span>Status WAF:</span>
            <span className="text-verdigris font-semibold">Active • Managed Challenge</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-ink-800 flex items-center justify-between text-[11px] text-paper-dim">
          <span>Performance & Security by Cloudflare</span>
          <span className="text-[10px] font-mono">v0.2-edge</span>
        </div>
      </div>
    </div>
  );
}
