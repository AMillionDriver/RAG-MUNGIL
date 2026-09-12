import { useState } from 'react';
import { GitBranch, Clock, ShieldCheck, RefreshCw, CheckCircle2, ArrowUpRight, Github } from 'lucide-react';

export default function GitHubWorkflowStatus() {
  return (
    <div className="space-y-6">
      <div className="bg-[#121214] p-6 rounded-2xl border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Status GitHub Actions Auto-Harvester</h2>
              <p className="text-xs text-white/50">Mesin otonom di repositori AMillionDriver/RAG-MUNGIL</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Workflow: SUCCESS (Active)</span>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#09090b] p-4 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-white/70 text-xs font-semibold">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Jadwal Pemanenan</span>
            </div>
            <p className="text-sm font-mono text-white">0 */2 * * *</p>
            <p className="text-[11px] text-white/40">Berjalan otomatis setiap 2 jam sekali tanpa perlu laptop menyala.</p>
          </div>

          <div className="bg-[#09090b] p-4 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-white/70 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Anti-Conflict Rebase</span>
            </div>
            <p className="text-sm font-mono text-white">git pull --rebase</p>
            <p className="text-[11px] text-white/40">Mencegah bentrok commit saat Anda membuka/mengedit repo dari HP.</p>
          </div>

          <div className="bg-[#09090b] p-4 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-white/70 text-xs font-semibold">
              <RefreshCw className="w-4 h-4 text-blue-400" />
              <span>Deduplikasi SHA-256</span>
            </div>
            <p className="text-sm font-mono text-white">Zero Duplicate Hash</p>
            <p className="text-[11px] text-white/40">DATA_CLEANER.py menjamin tidak ada duplikasi konten di file JSONL.</p>
          </div>
        </div>

        {/* Official Export Notice */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-[#0d1612] to-[#121214] border border-emerald-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Cara Push / Export Resmi dari AI Studio ke GitHub</span>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            Karena Anda telah mengotorisasi aplikasi resmi <strong>Google AI Studio</strong> di akun GitHub Anda:
          </p>
          <ol className="text-xs text-white/60 list-decimal list-inside space-y-1 pl-1">
            <li>Buka menu di kanan atas antarmuka AI Studio Anda (ikon GitHub atau tombol <strong>Export / Settings</strong>).</li>
            <li>Pilih opsi <strong>"Push to GitHub"</strong> atau <strong>"Export to GitHub"</strong>.</li>
            <li>Arahkan ke repositori <code>AMillionDriver/RAG-MUNGIL</code>.</li>
            <li>Semua file arsitektur Gold Tier dari workspace ini akan langsung ter-update di repositori Anda!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
