import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ShieldCheck, ShieldAlert, Lock, CheckCircle2, RefreshCw, Cpu, ExternalLink, Shield, ToggleLeft, ToggleRight } from 'lucide-react';

export interface TurnstileKeys {
  invisible: string;
  interactive: string;
}

interface TurnstileGatewayProps {
  keys: TurnstileKeys;
  onVerified: (token: string, mode: 'invisible' | 'interactive') => void;
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

export default function TurnstileGateway({ keys, onVerified }: TurnstileGatewayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [activeMode, setActiveMode] = useState<'invisible' | 'interactive'>('invisible');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'script_loading'>('script_loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(25);

  const currentSiteKey = activeMode === 'invisible' ? keys.invisible : keys.interactive;

  const renderTurnstile = useCallback(() => {
    if (!window.turnstile || !containerRef.current) return;

    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {}
      widgetIdRef.current = null;
    }

    // Bersihkan kontainer DOM
    containerRef.current.innerHTML = '';
    setStatus('verifying');
    setErrorMessage(null);

    const isInvisible = activeMode === 'invisible';

    try {
      const id = window.turnstile.render(containerRef.current, {
        sitekey: currentSiteKey,
        theme: 'dark',
        size: isInvisible ? 'invisible' : 'normal',
        execution: isInvisible ? 'auto' : 'render',
        appearance: 'always',
        action: 'rag_mungil_gateway',
        callback: (receivedToken: string) => {
          setProgressPercent(100);
          setStatus('success');
          sessionStorage.setItem('cf_turnstile_token', receivedToken);
          sessionStorage.setItem('cf_turnstile_mode', activeMode);
          setTimeout(() => {
            onVerified(receivedToken, activeMode);
          }, 500);
        },
        'error-callback': (err: string) => {
          setStatus('error');
          if (activeMode === 'invisible') {
            setErrorMessage('Tantangan otomatis memerlukan verifikasi interaktif. Mengalihkan ke mode checklist...');
            // Otomatis beralih ke mode interaktif jika invisible gagal
            setTimeout(() => {
              setActiveMode('interactive');
            }, 1200);
          } else {
            setErrorMessage(`Cloudflare Turnstile Challenge gagal (${err || 'Kode error'}).`);
          }
        },
        'expired-callback': () => {
          setStatus('error');
          setErrorMessage('Sesi verifikasi kadaluarsa. Silakan muat ulang.');
        }
      });
      widgetIdRef.current = id;
    } catch (e) {
      console.error('Turnstile render error:', e);
      setStatus('error');
      setErrorMessage('Gagal memuat widget Cloudflare Turnstile.');
    }
  }, [activeMode, currentSiteKey, onVerified]);

  useEffect(() => {
    let checkInterval: any = null;
    let timeoutFallback: any = null;

    if (window.turnstile) {
      renderTurnstile();
    } else {
      setStatus('script_loading');
      checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          renderTurnstile();
        }
      }, 150);
    }

    // Auto-fallback timeout: Jika mode invisible macet > 8 detik, alihkan ke mode interaktif
    if (activeMode === 'invisible') {
      timeoutFallback = setTimeout(() => {
        if (status === 'verifying') {
          console.warn('Invisible Turnstile timeout fallback -> Switching to Interactive Mode');
          setActiveMode('interactive');
        }
      }, 8000);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (timeoutFallback) clearTimeout(timeoutFallback);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
    };
  }, [activeMode, renderTurnstile, status]);

  // Progress animation bar
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 85) return prev;
        return prev + Math.floor(Math.random() * 12 + 4);
      });
    }, 400);

    return () => clearInterval(progressInterval);
  }, []);

  const handleManualRetry = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      setStatus('verifying');
      setProgressPercent(30);
      setErrorMessage(null);
    } else {
      renderTurnstile();
    }
  };

  const toggleMode = () => {
    const nextMode = activeMode === 'invisible' ? 'interactive' : 'invisible';
    setActiveMode(nextMode);
    setProgressPercent(30);
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
              <p className="text-[11px] text-paper-dim">RAG-MUNGIL Security Shield</p>
            </div>
          </div>
          <button
            onClick={toggleMode}
            title="Klik untuk beralih mode Turnstile"
            className="flex items-center gap-1.5 text-[10.5px] font-mono px-2.5 py-1 rounded bg-ink-800 hover:bg-ink-700 text-verdigris border border-ink-700 transition-colors"
          >
            {activeMode === 'invisible' ? (
              <>
                <ToggleRight className="w-4 h-4 text-verdigris" />
                <span>MODE: INVISIBLE</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-oxide" />
                <span className="text-oxide">MODE: INTERACTIVE</span>
              </>
            )}
          </button>
        </div>

        {/* Subtitle Instruksi & Status */}
        <div className="mb-5 space-y-2">
          <h3 className="text-[15px] font-medium text-paper flex items-center gap-2">
            {status === 'success' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-verdigris" />
                <span>Koneksi Aman Terverifikasi! Mengalihkan...</span>
              </>
            ) : status === 'error' ? (
              <>
                <ShieldAlert className="w-4 h-4 text-oxide" />
                <span>Verifikasi Tambahan Diperlukan</span>
              </>
            ) : activeMode === 'invisible' ? (
              <>
                <RefreshCw className="w-4 h-4 text-verdigris animate-spin" />
                <span>Memeriksa Keamanan Koneksi secara Otomatis...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-verdigris" />
                <span>Silakan Centang Kotak Verifikasi Cloudflare di Bawah</span>
              </>
            )}
          </h3>
          <p className="text-[12px] text-paper-dim leading-relaxed">
            {activeMode === 'invisible'
              ? 'Mode Invisible aktif: Browser Anda diverifikasi secara instan di latar belakang tanpa form CAPTCHA manual.'
              : 'Mode Interaktif aktif: Silakan klik kotak centang Cloudflare untuk memverifikasi bahwa Anda bukan robot.'}
          </p>
        </div>

        {/* Progress Bar Indikator (hanya di mode invisible) */}
        {activeMode === 'invisible' && status !== 'success' && (
          <div className="w-full bg-ink-950 rounded-full h-1.5 mb-5 overflow-hidden border border-ink-800">
            <div
              className="bg-verdigris h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Container untuk Cloudflare Turnstile Widget */}
        <div className="my-5 flex flex-col items-center justify-center min-h-[70px] bg-ink-950/60 rounded border border-ink-700/80 p-3">
          <div ref={containerRef} className="flex justify-center" />
          {status === 'script_loading' && (
            <div className="flex items-center gap-2 text-[11px] text-paper-dim font-mono py-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-verdigris" />
              Menghubungkan ke Edge Network Cloudflare...
            </div>
          )}
        </div>

        {/* Error Notification & Manual Switch Prompt */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-oxide/10 border border-oxide/30 rounded text-[12px] text-oxide flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{errorMessage}</p>
              <div className="mt-1.5 flex items-center gap-3">
                <button
                  onClick={handleManualRetry}
                  className="text-[11px] underline font-mono text-paper hover:text-oxide transition-colors"
                >
                  Coba Ulang
                </button>
                <button
                  onClick={toggleMode}
                  className="text-[11px] underline font-mono text-verdigris hover:text-paper transition-colors"
                >
                  Ganti ke Mode {activeMode === 'invisible' ? 'Interaktif (Checkbox)' : 'Invisible (Auto)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info gateway — cuma data yang beneran nyata, bukan telemetri hasil karang-karangan */}
        <div className="bg-ink-950 rounded border border-ink-700/80 p-3.5 space-y-2 text-[11px] font-mono text-paper-dim">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-paper">
              <Cpu className="w-3 h-3 text-verdigris" />
              Site Key Aktif:
            </span>
            <span className="truncate max-w-[190px] text-paper-dim/90" title={currentSiteKey}>
              {currentSiteKey} ({activeMode})
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-ink-800/80 pt-1.5 text-[10px]">
            <span>Mekanisme gateway:</span>
            <span className="text-verdigris font-semibold">
              Auto-adaptive (invisible → fallback interaktif)
            </span>
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
