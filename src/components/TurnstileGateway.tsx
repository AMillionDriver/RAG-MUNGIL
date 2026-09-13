import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ShieldAlert, Lock, CheckCircle2, RefreshCw, Terminal, Globe, Cpu, ExternalLink, Shield } from 'lucide-react';

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
          size?: 'normal' | 'compact' | 'flexible' | 'invisible';
          appearance?: 'always' | 'execute' | 'interaction-only';
          execution?: 'auto' | 'render';
          action?: string;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      execute: (container?: string | HTMLElement | null, options?: any) => void;
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
  const [progressPercent, setProgressPercent] = useState<number>(20);

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
    let progressInterval: any = null;
    let isMounted = true;

    // Progress animation bar
    progressInterval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.floor(Math.random() * 15 + 5);
      });
    }, 400);

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
          size: 'invisible',
          execution: 'auto',
          appearance: 'always',
          action: 'rag_mungil_gateway',
          callback: (receivedToken: string) => {
            if (!isMounted) return;
            setToken(receivedToken);
            setProgressPercent(100);
            setStatus('success');
            sessionStorage.setItem('cf_turnstile_token', receivedToken);
            setTimeout(() => {
              if (isMounted) {
                onVerified(receivedToken, rayId);
              }
            }, 500);
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
        console.error('Turnstile invisible render error:', e);
        if (isMounted) {
          setStatus('error');
          setErrorMessage('Gagal menginisialisasi Cloudflare Invisible Turnstile.');
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
      }, 150);
    }

    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
      if (progressInterval) clearInterval(progressInterval);
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
      setProgressPercent(30);
      setErrorMessage(null);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 text-paper flex flex-col items-center justify-center p-4 selection:bg-verdigris/30">
      {/* Container Kotak Verifikasi Cloudflare Interstitial */}
      <div className="w-full max-w-lg bg-ink-900 border border-ink-600 rounded-lg p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Border Aksen Gradasi */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-oxide via-verdigris to-oxide" />

        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-ink-700 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-ink-800 border border-ink-600 flex items-center justify-center text-verdigris">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-catalog-heading text-sm font-semibold tracking-wide text-paper">
                Cloudflare Managed Gateway
              </h2>
              <p className="text-[11px] text-paper-dim">RAG-MUNGIL Technical Archive</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded bg-ink-800 text-verdigris border border-ink-700">
            <span className="w-1.5 h-1.5 rounded-full bg-verdigris animate-ping" />
            INVISIBLE SHIELD
          </span>
        </div>

        {/* Subtitle Instruksi & Status */}
        <div className="mb-5 space-y-2">
          <h3 className="text-[15px] font-medium text-paper flex items-center gap-2">
            {status === 'success' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-verdigris" />
                <span>Koneksi Aman Terverifikasi</span>
              </>
            ) : status === 'error' ? (
              <>
                <ShieldAlert className="w-4 h-4 text-oxide" />
                <span>Tantangan Memerlukan Verifikasi</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-verdigris animate-spin" />
                <span>Memeriksa Keamanan Perangkat & Browser...</span>
              </>
            )}
          </h3>
          <p className="text-[12px] text-paper-dim leading-relaxed">
            Sistem Cloudflare Turnstile sedang memverifikasi integritas sesi browser Anda secara otomatis tanpa perlu mengisi CAPTCHA manual.
          </p>
        </div>

        {/* Progress Bar Indikator */}
        <div className="w-full bg-ink-950 rounded-full h-1.5 mb-5 overflow-hidden border border-ink-800">
          <div
            className="bg-verdigris h-1.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Hidden Container untuk Cloudflare Invisible Turnstile Widget */}
        <div ref={containerRef} className="flex justify-center my-1" />

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-oxide/10 border border-oxide/30 rounded text-[12px] text-oxide flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{errorMessage}</p>
              <button
                onClick={handleManualRetry}
                className="mt-1.5 text-[11px] underline font-mono text-paper hover:text-oxide transition-colors"
              >
                Coba Ulang Verifikasi Turnstile
              </button>
            </div>
          </div>
        )}

        {/* Telemetri Ray ID & WAF Information */}
        <div className="bg-ink-950 rounded border border-ink-700/80 p-3.5 space-y-2 text-[11px] font-mono text-paper-dim">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-paper">
              <Terminal className="w-3 h-3 text-verdigris" />
              Cloudflare Ray ID:
            </span>
            <span className="text-paper font-semibold select-all text-verdigris">
              {rayId}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-ink-800/80 pt-1.5">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-paper-dim" />
              Client Edge IP:
            </span>
            <span>{simulatedIp}</span>
          </div>

          <div className="flex items-center justify-between border-t border-ink-800/80 pt-1.5">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-paper-dim" />
              Site Key:
            </span>
            <span className="truncate max-w-[190px] text-paper-dim/90" title={siteKey}>{siteKey}</span>
          </div>

          <div className="flex items-center justify-between border-t border-ink-800/80 pt-1.5 text-[10px]">
            <span>Mode Tantangan:</span>
            <span className="text-verdigris font-semibold">Invisible Zero-Friction Challenge</span>
          </div>
        </div>

        {/* Privacy Policy & Terms Footer */}
        <div className="mt-5 pt-3.5 border-t border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-paper-dim">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-verdigris" />
            <span>Protected by Cloudflare Turnstile</span>
          </div>
          <div className="flex items-center gap-3 text-[10.5px]">
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-paper hover:underline flex items-center gap-0.5 transition-colors"
            >
              Privacy Policy
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <span className="text-ink-700">•</span>
            <a
              href="https://www.cloudflare.com/website-terms/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-paper hover:underline flex items-center gap-0.5 transition-colors"
            >
              Terms of Service
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
