/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Download, Copy, Check, Sliders, Shield, Sparkles, FileCode2 } from 'lucide-react';
import { UserscriptConfig, generateUserscriptCode } from '../scripts/userscriptContent';

interface ScriptDownloaderProps {
  onCopySuccess?: () => void;
}

export default function ScriptDownloader({ onCopySuccess }: ScriptDownloaderProps) {
  const [config, setConfig] = useState<UserscriptConfig>({
    blockPopups: true,
    autoOpenOnFound: false,
    floatingPosition: 'bottom-right',
    theme: 'dark',
    maxHistory: 20,
  });

  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const scriptCode = generateUserscriptCode(config);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    if (onCopySuccess) onCopySuccess();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([scriptCode], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'halo-universal-downloader.user.js';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileCode2 className="w-4 h-4 text-white/80" />
            <h3 className="font-serif-display text-lg text-white font-medium">
              halo-universal-downloader.user.js
            </h3>
            <span className="text-[9px] tracking-[0.2em] uppercase font-sans px-2 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              v2.1.0 • Android Download Engine Fixed
            </span>
          </div>
          <p className="text-xs text-white/50 font-sans">
            Mendukung pengunduhan langsung TikTok, YouTube, Doodstream, HLS (.m3u8), dan MP4 ke memori HP.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-toggle-config"
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2.5 rounded-xl border text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              showConfig
                ? 'bg-white/15 border-white/30 text-white'
                : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white hover:border-white/20'
            }`}
            title="Kustomisasi Fitur Script"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pengaturan</span>
          </button>

          <button
            id="btn-copy-userscript"
            type="button"
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/10 text-white text-xs font-medium tracking-wide flex items-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white/70" />
                <span>Salin Kode</span>
              </>
            )}
          </button>

          <button
            id="btn-download-userscript"
            type="button"
            onClick={handleDownload}
            className="px-5 py-2.5 rounded-xl bg-white text-[#080808] hover:bg-[#E5E5E5] text-xs font-semibold tracking-wide flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            {downloaded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File .user.js</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Config Drawer */}
      {showConfig && (
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans animate-in fade-in duration-200">
          <label className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-white/60" />
              <div>
                <div className="text-white/90 font-medium">Perisai Anti Pop-up Iklan</div>
                <div className="text-[10px] text-white/40">Blokir otomatis redirect jendela klik liar</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.blockPopups}
              onChange={(e) => setConfig({ ...config, blockPopups: e.target.checked })}
              className="accent-white cursor-pointer w-4 h-4 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-white/60" />
              <div>
                <div className="text-white/90 font-medium">Buka Otomatis Panel</div>
                <div className="text-[10px] text-white/40">Munculkan list langsung saat video terdeteksi</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.autoOpenOnFound}
              onChange={(e) => setConfig({ ...config, autoOpenOnFound: e.target.checked })}
              className="accent-white cursor-pointer w-4 h-4 rounded"
            />
          </label>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-white/90 font-medium">Posisi Tombol Mengambang</div>
              <div className="text-[10px] text-white/40">Letak badge di layar HP/Desktop</div>
            </div>
            <select
              value={config.floatingPosition}
              onChange={(e) =>
                setConfig({ ...config, floatingPosition: e.target.value as UserscriptConfig['floatingPosition'] })
              }
              className="bg-[#18181b] border border-white/15 rounded-md px-2.5 py-1 text-white text-[11px] focus:outline-hidden"
            >
              <option value="bottom-right">Kanan Bawah (Default)</option>
              <option value="bottom-left">Kiri Bawah</option>
              <option value="top-right">Kanan Atas</option>
            </select>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-white/90 font-medium">Batas Riwayat Media</div>
              <div className="text-[10px] text-white/40">Maksimal URL stream yang disimpan di list</div>
            </div>
            <input
              type="number"
              min={5}
              max={50}
              value={config.maxHistory}
              onChange={(e) => setConfig({ ...config, maxHistory: Number(e.target.value) })}
              className="w-16 bg-[#18181b] border border-white/15 rounded-md px-2 py-1 text-white text-center text-[11px] focus:outline-hidden"
            />
          </div>
        </div>
      )}

      {/* Code Preview Box */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0c0c0e]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
            <span className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-sans ml-2">
              Tampermonkey Userscript Source
            </span>
          </div>
          <span className="text-[10px] text-white/30 font-mono">
            {scriptCode.split('\n').length} lines
          </span>
        </div>

        <pre className="p-5 text-[11px] font-mono text-[#E4E4E7] leading-relaxed overflow-x-auto max-h-[380px] selection:bg-white/20">
          <code>{scriptCode}</code>
        </pre>
      </div>
    </div>
  );
}
