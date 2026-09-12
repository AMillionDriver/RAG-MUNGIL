/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Smartphone, Monitor, CheckCircle2, ChevronRight, ExternalLink, HelpCircle } from 'lucide-react';

export default function InstallationGuide() {
  const [activeTab, setActiveTab] = useState<'kiwi' | 'desktop'>('kiwi');

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] tracking-[0.35em] uppercase font-sans text-white/50">
            Tutorial Pemasangan
          </span>
          <h3 className="font-serif-display text-2xl text-white font-medium mt-1">
            Cara Pasang di HP (Kiwi) & Desktop
          </h3>
        </div>

        {/* Device Switcher */}
        <div className="inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/10">
          <button
            id="tab-kiwi"
            type="button"
            onClick={() => setActiveTab('kiwi')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'kiwi'
                ? 'bg-white/15 text-white shadow-xs'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Kiwi Browser (Android)</span>
          </button>
          <button
            id="tab-desktop"
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'desktop'
                ? 'bg-white/15 text-white shadow-xs'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop (Chrome / Edge / Firefox)</span>
          </button>
        </div>
      </div>

      {activeTab === 'kiwi' ? (
        <div className="space-y-4 text-xs font-sans text-white/80">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start gap-3">
            <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Kenapa Kiwi Browser?</strong> Karena Google Chrome resmi di Android tidak mengizinkan ekstensi web, sedangkan Kiwi Browser mendukung penuh seluruh ekstensi Chrome Web Store termasuk Tampermonkey!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono">1</span>
                <span>Install Kiwi & Tampermonkey</span>
              </div>
              <p className="text-white/60 leading-relaxed pl-7">
                Download <strong>Kiwi Browser</strong> dari Google Play Store. Buka Kiwi, lalu kunjungi Chrome Web Store dan pasang ekstensi <strong>Tampermonkey</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono">2</span>
                <span>Buka Dashboard Tampermonkey</span>
              </div>
              <p className="text-white/60 leading-relaxed pl-7">
                Di Kiwi Browser, ketuk menu titik tiga (<strong>⋮</strong>) di pojok kanan atas, scroll ke bawah, lalu pilih <strong>Tampermonkey</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono">3</span>
                <span>Import File atau Salin Script</span>
              </div>
              <p className="text-white/60 leading-relaxed pl-7">
                Pilih tab <strong>Utilities</strong> lalu klik <strong>Import from File</strong> (pilih file <code className="text-white bg-white/10 px-1 py-0.5 rounded">.user.js</code> yang Anda unduh di atas), ATAU buat script baru dan paste kodenya.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono">4</span>
                <span>Buka Situs Video Target</span>
              </div>
              <p className="text-white/60 leading-relaxed pl-7">
                Kunjungi website streaming target Anda. Tombol hitam <strong>⚡ Halo Sniffer</strong> otomatis muncul di sudut layar saat video mulai berputar!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-xs font-sans text-white/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono">1</span>
                <span>Pasang Ekstensi Tampermonkey</span>
              </div>
              <p className="text-white/60 leading-relaxed pl-7">
                Pasang Tampermonkey / Violentmonkey dari Chrome Web Store, Edge Addons, atau Firefox Add-ons.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono">2</span>
                <span>Buka File Script</span>
              </div>
              <p className="text-white/60 leading-relaxed pl-7">
                Seret (*drag and drop*) file <code className="text-white bg-white/10 px-1 py-0.5 rounded">halo-universal-downloader.user.js</code> langsung ke tab browser, dan Tampermonkey akan otomatis meminta persetujuan instalasi.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono">3</span>
                <span>Klik Install</span>
              </div>
              <p className="text-white/60 leading-relaxed pl-7">
                Klik tombol <strong>Install</strong> pada antarmuka Tampermonkey. Status script kini aktif (*Enabled*).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono">4</span>
                <span>Siap Digunakan 100% Offline</span>
              </div>
              <p className="text-white/60 leading-relaxed pl-7">
                Script langsung beroperasi sepenuhnya di browser lokal Anda tanpa bergantung pada server mana pun.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Troubleshooting & Fix Notes */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs space-y-2.5 font-sans">
        <div className="flex items-center gap-2 text-white font-medium">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <span>Solusi Kendala Deteksi & Unduhan di HP (Kiwi Browser)</span>
        </div>
        <p className="text-white/70 leading-relaxed">
          1. <strong>Status Unduhan Berhenti / Video Tidak Ada di Galeri</strong>: Pada versi sebelumnya, ekstensi Tampermonkey di Android memblokir fungsi penyimpanan file bawaan secara diam-diam. Di <strong>v2.1.0</strong>, mesin unduh telah diganti menggunakan <em>In-Memory Stream Blob Downloader</em> dengan indikator progress MB nyata. Saat selesai, file <code className="text-white bg-white/10 px-1 py-0.5 rounded">.mp4</code> langsung dikirim ke pengelola unduhan Android dan tersimpan di folder <strong>Download</strong> ponsel Anda.<br/>
          2. <strong>Bypass Anti-Hotlink TikTok</strong>: CDN TikTok (<code className="text-white bg-white/10 px-1 py-0.5 rounded">v16-webapp-prime.tiktok.com</code>) menolak unduhan jika header Referer tidak sesuai. Mesin v2.1.0 secara otomatis menyuntikkan header Referer asli sehingga server TikTok mengizinkan pengunduhan file video utuh.<br/>
          3. <strong>Deteksi Otomatis & Iframe</strong>: Didukung <code className="text-white bg-white/10 px-1 py-0.5 rounded">unsafeWindow</code> dan <code className="text-white bg-white/10 px-1 py-0.5 rounded">@allFrames true</code> untuk membaca stream dari YouTube, TikTok, hingga iframe Doodstream.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2 text-white/70">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Bypass CORS & Anti-Hotlink</span>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Penggabung Segmen HLS (.ts)</span>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Penyaring Iklan Pop-up Otomatis</span>
        </div>
      </div>
    </div>
  );
}
