/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import { Play, Pause, AlertCircle, CheckCircle, Video, RefreshCw, Zap } from 'lucide-react';

const PRESET_STREAMS = [
  {
    name: 'Akamai HLS Demo (Master Playlist)',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    format: 'HLS Multi-Bitrate',
  },
  {
    name: 'Big Buck Bunny (HLS Stream)',
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
    format: 'HLS 1080p',
  },
  {
    name: 'Sintel Open Source (Direct MP4)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    format: 'Direct MP4',
  },
];

export default function StreamPlayground() {
  const [streamUrl, setStreamUrl] = useState(PRESET_STREAMS[0].url);
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Siap memutar');
  const [detectedLevels, setDetectedLevels] = useState<string[]>([]);
  const [segmentsCount, setSegmentsCount] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const loadStream = (urlToLoad: string) => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Destroy existing hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setDetectedLevels([]);
    setSegmentsCount(null);
    setStatusMessage('Memuat stream...');

    if (urlToLoad.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hlsRef.current = hls;
        hls.loadSource(urlToLoad);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
          setStatusMessage(`Manifest berhasil diparsing! ${data.levels.length} resolusi ditemukan.`);
          const levels = data.levels.map((lvl) => `${lvl.height}p (${Math.round(lvl.bitrate / 1000)} kbps)`);
          setDetectedLevels(levels);
        });

        hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
          if (data.details && data.details.fragments) {
            setSegmentsCount(data.details.fragments.length);
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setStatusMessage(`Error fatal: ${data.type}`);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari HLS
        video.src = urlToLoad;
        setStatusMessage('Memutar via native Safari HLS');
      } else {
        setStatusMessage('Browser tidak mendukung pemutaran HLS');
      }
    } else {
      // Direct MP4 / WEBM
      video.src = urlToLoad;
      setStatusMessage('Format video standar (Direct MP4/WEBM)');
    }
  };

  useEffect(() => {
    loadStream(streamUrl);
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  const handlePlayToggle = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-6 sm:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] tracking-[0.35em] uppercase font-sans text-white/50">
            Simulator & Stream Tester
          </span>
        </div>
        <h3 className="font-serif-display text-2xl text-white font-medium">
          Uji Coba Stream Video & Sniffing
        </h3>
        <p className="text-xs text-white/50 font-sans mt-1">
          Gunakan simulator ini untuk menguji bagaimana stream HLS (.m3u8) atau MP4 diuraikan dan diputar langsung di browser.
        </p>
      </div>

      {/* Preset Pickers */}
      <div className="flex flex-wrap gap-2">
        {PRESET_STREAMS.map((item) => (
          <button
            key={item.url}
            type="button"
            onClick={() => {
              setStreamUrl(item.url);
              loadStream(item.url);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans transition-all cursor-pointer border ${
              streamUrl === item.url
                ? 'bg-white/15 border-white/30 text-white'
                : 'bg-white/[0.02] border-white/10 text-white/60 hover:text-white hover:border-white/20'
            }`}
          >
            <span>{item.name}</span>
            <span className="ml-1.5 text-[9px] opacity-60">({item.format})</span>
          </button>
        ))}
      </div>

      {/* Custom URL Input */}
      <div className="flex gap-2">
        <input
          id="custom-stream-url-input"
          type="text"
          value={streamUrl}
          onChange={(e) => setStreamUrl(e.target.value)}
          placeholder="Tempel URL m3u8 atau mp4 yang ingin diuji..."
          className="flex-1 px-3.5 py-2 text-xs bg-white/[0.03] border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:outline-hidden focus:border-white/40 focus:ring-1 focus:ring-white/20 font-mono"
        />
        <button
          type="button"
          onClick={() => loadStream(streamUrl)}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Muat</span>
        </button>
      </div>

      {/* Video Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative rounded-xl overflow-hidden bg-black border border-white/10 aspect-video flex items-center justify-center group">
          <video
            ref={videoRef}
            playsInline
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Stream Inspector Details */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-4 text-xs font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-[10px] tracking-[0.2em] uppercase text-white/50">Hasil Analisis Stream</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <CheckCircle className="w-3 h-3" /> Live
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] uppercase text-white/40">Status Engine</div>
            <div className="text-white/80 font-mono text-[11px] leading-snug">{statusMessage}</div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] uppercase text-white/40">Resolusi Terdeteksi</div>
            {detectedLevels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {detectedLevels.map((lvl, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-[10px] text-white/80 font-mono"
                  >
                    {lvl}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-white/40 italic">Single stream / direct file</span>
            )}
          </div>

          {segmentsCount !== null && (
            <div className="space-y-1">
              <div className="text-[10px] uppercase text-white/40">Total Segmen TS Ditemukan</div>
              <div className="text-emerald-400 font-mono font-medium">{segmentsCount} potongan segmen</div>
              <p className="text-[10px] text-white/40 pt-1">
                *Userscript Tampermonkey akan otomatis mendownload seluruh segmen ini dan menggabungkannya menjadi 1 file video utuh.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
